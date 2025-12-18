import React, { useState, useRef, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker icons in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const center = { lat: 20.5937, lng: 78.9629 }; // Default: India

// Helper Component to Recenter Map
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
};

const LocationSelector = ({ onLocationSelect, initialLocation = null }) => {
  const [position, setPosition] = useState(initialLocation || center);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Reverse Geocoding Function
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept": "application/json", "User-Agent": "jurify-app/1.0" } }
      );
      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;

        // Construct structured address object
        const locationData = {
          addressLine1: (data.display_name || "").split(",")[0],
          city: addr.city || addr.town || addr.village || addr.suburb || "",
          state: addr.state || "",
          pincode: addr.postcode || "",
          country: addr.country || "India",
          latitude: lat,
          longitude: lng,
          fullAddress: data.display_name
        };

        // Pass data back to parent
        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error("Geocoding error", error);
    }
  };

  // Draggable Marker Component
  const DraggableMarker = () => {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            const { lat, lng } = marker.getLatLng();
            setPosition({ lat, lng });
            reverseGeocode(lat, lng);
          }
        },
      }),
      []
    );
    return <Marker draggable={true} eventHandlers={eventHandlers} position={position} ref={markerRef} />;
  };

  // Map Click Handler Component
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition({ lat, lng });
        reverseGeocode(lat, lng);
      }
    });
    return null;
  }

  // Search Handler
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`,
        { headers: { "Accept": "application/json", "User-Agent": "jurify-app/1.0" } }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        console.log("Location not found");
      }
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setPosition({ lat, lng });
    setSearchResults([]);
    setSearchQuery(result.display_name);
    reverseGeocode(lat, lng);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition({ lat: latitude, lng: longitude });
        await reverseGeocode(latitude, longitude);
        setIsLoadingLocation(false);
      },
      (error) => {
        setIsLoadingLocation(false);
        let errorMessage = "Unable to get your current location.";
        if (error.code === error.PERMISSION_DENIED) errorMessage = "Location access denied.";
        alert(errorMessage);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-2 relative z-20">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search location..."
            className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#11676a] focus:border-[#11676a] outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#11676a]"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {searchResults.length > 0 && (
            <ul className="absolute z-[1000] w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result, index) => (
                <li
                  key={index}
                  onClick={() => selectSearchResult(result)}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-none flex items-start gap-2"
                >
                  <span className="material-symbols-outlined text-gray-400 text-lg mt-0.5">location_on</span>
                  <span className="text-gray-700">{result.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={isLoadingLocation}
          className="bg-[#11676a] text-white px-4 py-2.5 rounded-lg hover:bg-[#0f5557] disabled:opacity-70 flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">
            {isLoadingLocation ? 'hourglass_empty' : 'my_location'}
          </span>
          <span className="hidden sm:inline">Use My Location</span>
        </button>
      </div>

      {/* Leaflet Map */}
      <div className="w-full h-[300px] rounded-xl overflow-hidden shadow-sm border border-gray-200 relative z-0">
        <MapContainer center={center} zoom={5} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <DraggableMarker />
          <RecenterMap lat={position.lat} lng={position.lng} />
          <MapClickHandler />
        </MapContainer>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
        <p className="font-medium mb-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-base">info</span>
          How to select location:
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs pl-1">
          <li>Search for an address above</li>
          <li>Drag the pin to refine exact location</li>
          <li>Or click anywhere on the map</li>
          <li>Use "Use My Location" to detect your position</li>
        </ul>
      </div>
    </div>
  );
};

export default LocationSelector;
