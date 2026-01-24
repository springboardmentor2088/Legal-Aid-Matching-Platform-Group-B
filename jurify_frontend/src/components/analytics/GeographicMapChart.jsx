import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

// Fix for leaflet marker icons in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Internal component to handle view changes
const ChangeView = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (!coords || coords.length === 0) return;

    // Create a stable key for comparison to avoid resetting view when data reference changes but content is same
    const coordsKey = JSON.stringify(coords);
    if (window.lastCoordsKey === coordsKey) return;
    window.lastCoordsKey = coordsKey;

    try {
      if (coords.length === 1) {
        // If only one point, center on it with a reasonable zoom
        map.setView(coords[0], 10);
      } else {
        // If multiple points, fit bounds
        const bounds = L.latLngBounds(coords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    } catch (e) {
      console.error("Error setting map bounds:", e);
    }
  }, [JSON.stringify(coords), map]);

  return null;
};

const GeographicMapChart = ({ data, title = "Geographic Distribution of Your Cases", userType = 'NGO', onMarkerClick }) => {
  // Handle undefined or empty data
  if (!data || !Array.isArray(data)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full min-h-[500px]"
      >
        <div className="flex items-center justify-center h-[400px]">
          <p className="text-gray-500 dark:text-gray-400">No geographic data available</p>
        </div>
      </motion.div>
    );
  }

  // Calculate summary stats based on user type
  const totalLocations = data.length;
  const totalCases = data.reduce((sum, city) => sum + (city.casesHandled || city.casesSupported || city.count || 0), 0);
  const topCity = [...data].sort((a, b) => (b.casesHandled || b.casesSupported || b.count || 0) - (a.casesHandled || a.casesSupported || a.count || 0))[0];

  // Calculate percentage for each city (for lawyer view)
  const dataWithPercentage = data.map(city => ({
    ...city,
    percentage: totalCases > 0 ? ((city.casesHandled || city.casesSupported || city.count || 0) / totalCases * 100).toFixed(1) : 0
  }));

  const coords = dataWithPercentage
    .filter(c => c.lat && c.lng)
    .map(c => [c.lat, c.lng]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-full min-h-[500px]"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>

        {/* Stats Summary Strip */}
        <div className="flex gap-4 text-xs sm:text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
          <div className="px-2">
            <span className="block text-gray-500 dark:text-gray-400">
              {userType === 'LAWYER' ? 'Top City' : 'Highest Impact City'}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{topCity?.name || 'N/A'}</span>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-600"></div>
          <div className="px-2">
            <span className="block text-gray-500 dark:text-gray-400">
              {userType === 'LAWYER' ? 'Cities Served' : 'Cities Reached'}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{totalLocations}</span>
          </div>
          <div className="w-px bg-gray-200 dark:bg-gray-600"></div>
          <div className="px-2">
            <span className="block text-gray-500 dark:text-gray-400">Total Cases</span>
            <span className="font-bold text-gray-900 dark:text-white">{totalCases.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="h-[400px] w-full rounded-xl overflow-hidden z-0 flex-1">
        <MapContainer
          center={[20.5937, 78.9629]} // Initial Center
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: '400px', width: '100%', minHeight: '400px', zIndex: 0 }}
        >
          <ChangeView coords={coords} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {dataWithPercentage.map((city, index) => {
            const isIndividualCase = userType === 'LAWYER' && city.caseId;

            if (isIndividualCase) {
              return (
                <Marker
                  key={`case-${city.caseId}-${index}`}
                  position={[city.lat, city.lng]}
                  eventHandlers={{
                    click: () => onMarkerClick && onMarkerClick(city.caseId),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                    <div className="p-1">
                      <div className="font-bold text-slate-900">Case #{city.caseId}</div>
                      <div className="text-xs text-slate-600">{city.citizenName}</div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            }

            return (
              <CircleMarker
                key={`city-${index}`}
                center={[city.lat, city.lng]}
                radius={Math.sqrt(city.casesHandled || city.casesSupported || city.count || 0) * 3}
                pathOptions={{
                  color: userType === 'LAWYER' ? '#3B82F6' : '#10B981',
                  fillColor: userType === 'LAWYER' ? '#3B82F6' : '#10B981',
                  fillOpacity: 0.6
                }}
              >
                <Popup>
                  <div className="text-center p-2 min-w-[150px]">
                    <strong className="block text-gray-900 text-base mb-2">{city.name}</strong>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-600">
                          {userType === 'LAWYER' ? 'Cases Handled:' : 'Cases Supported:'}
                        </span>
                        <span className="font-bold text-gray-900">
                          {city.casesHandled || city.casesSupported || city.count || 0}
                        </span>
                      </div>
                      {userType === 'LAWYER' && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-600">Percentage:</span>
                          <span className="font-bold text-blue-600">{city.percentage}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </motion.div>
  );
};

export default GeographicMapChart;
