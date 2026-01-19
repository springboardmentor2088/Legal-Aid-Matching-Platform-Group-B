import React, { useState } from 'react';
import { FiFilter, FiX, FiCalendar, FiChevronDown } from 'react-icons/fi';

const FilterBar = ({ filters, setFilters, activeTab }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const indianStates = [
    { value: "Andhra Pradesh", label: "Andhra Pradesh" },
    { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
    { value: "Assam", label: "Assam" },
    { value: "Bihar", label: "Bihar" },
    { value: "Chhattisgarh", label: "Chhattisgarh" },
    { value: "Goa", label: "Goa" },
    { value: "Gujarat", label: "Gujarat" },
    { value: "Haryana", label: "Haryana" },
    { value: "Himachal Pradesh", label: "Himachal Pradesh" },
    { value: "Jharkhand", label: "Jharkhand" },
    { value: "Karnataka", label: "Karnataka" },
    { value: "Kerala", label: "Kerala" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Manipur", label: "Manipur" },
    { value: "Meghalaya", label: "Meghalaya" },
    { value: "Mizoram", label: "Mizoram" },
    { value: "Nagaland", label: "Nagaland" },
    { value: "Odisha", label: "Odisha" },
    { value: "Punjab", label: "Punjab" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Sikkim", label: "Sikkim" },
    { value: "Tamil Nadu", label: "Tamil Nadu" },
    { value: "Telangana", label: "Telangana" },
    { value: "Tripura", label: "Tripura" },
    { value: "Uttar Pradesh", label: "Uttar Pradesh" },
    { value: "Uttarakhand", label: "Uttarakhand" },
    { value: "West Bengal", label: "West Bengal" },
  ];

  const stateCities = {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Anantapur", "Eluru"],
    "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Zero", "Bomdila", "Naharlagun", "Roing", "Tezu", "Changlang", "Khonsa"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur", "Bongaigaon", "Barpeta", "Karimganj", "Dhubri"],
    "Bihar": ["Patna", "Chapra", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Durg", "Korba", "Rajnandgaon", "Raigarh", "Ambikapur", "Mahasamund", "Dhamtari"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim", "Cuncolim", "Quepem"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar", "Junagadh", "Anand", "Nadiad"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Sonipat", "Rohtak", "Hisar", "Bhiwani", "Yamunanagar"],
    "Himachal Pradesh": ["Shimla", "Solan", "Dharamshala", "Mandi", "Palampur", "Kullu", "Manali", "Bilaspur", "Una", "Hamirpur"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Gulbarga", "Davanagere", "Bellary", "Bijapur", "Shimoga"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Malappuram", "Kannur", "Kasaragod"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Ratlam", "Satna", "Rewa", "Murwara"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Amravati", "Navi Mumbai", "Kolhapur"],
    "Manipur": ["Imphal", "Thoubal", "Lilong", "Bishnupur", "Churachandpur", "Kakching", "Ukhrul", "Senapati", "Tamenglong", "Chandel"],
    "Meghalaya": ["Shillong", "Tura", "Nongstoin", "Baghmara", "Jowai", "Williamnagar", "Resubelpara", "Mawsynram", "Amlarem", "Khliehriat"],
    "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Mamit", "Saitual", "Lawngtlai", "Sihphir", "Thenzawl"],
    "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Phek", "Kiphire", "Longleng", "Peren"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur", "Berhampur", "Baleshwar", "Baripada", "Jharsuguda", "Jeypore"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Firozpur", "Pathankot", "Hoshiarpur", "Batala"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Bhilwara", "Alwar", "Bhiwadi", "Sikar"],
    "Sikkim": ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Ravangla", "Jorethang", "Rangpo", "Singtam", "Melli", "Rongli"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore", "Thoothukudi", "Dindigul"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Miryalaguda"],
    "Tripura": ["Agartala", "Udaipur", "Dharmanagar", "Pratapgarh", "Kailashahar", "Belonia", "Khowai", "Amarpur", "Sabroom", "Kamalpur"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Allahabad", "Bareilly", "Aligarh", "Moradabad"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Kashipur", "Rudrapur", "Kashipur", "Kotdwar", "Pauri"],
    "West Bengal": ["Kolkata", "Siliguri", "Asansol", "Durgapur", "Bardhaman", "Malda", "Baharampur", "Haldia", "Kharagpur", "Shantipur"]
  };

  // Get cities for selected state
  const getCitiesForState = (state) => {
    return stateCities[state] || [];
  };

  const specializations = [
    'Criminal Law', 'Family Law', 'Corporate Law', 'Immigration Law',
    'Civil Rights', 'Environmental Law', 'Intellectual Property', 'Tax Law',
    'Real Estate Law', 'Employment Law', 'Bankruptcy Law', 'Personal Injury'
  ];

  const ngoAreas = [
    'Human Rights', 'Environmental Protection', 'Education', 'Healthcare',
    'Women Empowerment', 'Child Welfare', 'Animal Rights', 'Senior Care',
    'Legal Aid', 'Consumer Protection', 'Disability Rights', 'Refugee Support'
  ];

  const caseCategories = [
    "Civil Law",
    "Criminal Law",
    "Family Law",
    "Property Law",
    "Labor Law",
    "Consumer Protection",
    "Environmental Law",
    "Intellectual Property",
    "Tax Law",
    "Corporate Law",
    "Human Rights",
    "Other",
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRangeFilterChange = (key, field, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const clearFilter = (key) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const activeFilterCount = Object.keys(filters).length;

  const renderFilterSection = (title, children) => (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
      {children}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      {/* Filter Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <FiFilter className="text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white">
            Advanced Filters
          </span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-semibold">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              Clear All
            </button>
          )}
          <FiChevronDown
            className={`text-gray-600 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Basic Filters */}
            {renderFilterSection('Basic Filters', (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <select
                    value={filters.role || 'ALL'}
                    onChange={(e) => handleFilterChange('role', e.target.value === 'ALL' ? null : e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="LAWYER">Lawyers</option>
                    <option value="NGO">NGOs</option>
                    <option value="CITIZEN">Citizens</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <select
                    value={filters.state || ''}
                    onChange={(e) => {
                      handleFilterChange('state', e.target.value || null);
                      // Clear city filter when state changes
                      if (filters.city) {
                        setFilters(prev => {
                          const newFilters = { ...prev };
                          delete newFilters.city;
                          return newFilters;
                        });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All States</option>
                    {indianStates.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <select
                    value={filters.city || ''}
                    onChange={(e) => handleFilterChange('city', e.target.value || null)}
                    disabled={!filters.state}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:dark:bg-gray-800 disabled:dark:text-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">
                      {filters.state ? 'All Cities' : 'Select State First'}
                    </option>
                    {getCitiesForState(filters.state).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {/* Status Filters */}
            {renderFilterSection('Status Filters', (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Verification Status</label>
                  <select
                    value={filters.verificationStatus || 'ALL'}
                    onChange={(e) => handleFilterChange('verificationStatus', e.target.value === 'ALL' ? null : e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="RE-UPLOAD REQUESTED">Re-upload Requested</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Status</label>
                  <select
                    value={filters.accountStatus || 'ALL'}
                    onChange={(e) => handleFilterChange('accountStatus', e.target.value === 'ALL' ? null : e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Case Category</label>
                  <select
                    value={filters.caseCategory || ''}
                    onChange={(e) => handleFilterChange('caseCategory', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Categories</option>
                    {caseCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {/* Professional Filters */}
            {(activeTab === 'all' || activeTab === 'lawyers') && renderFilterSection('Professional Filters', (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
                  <select
                    value={filters.specialization || ''}
                    onChange={(e) => handleFilterChange('specialization', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Specializations</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Range (years)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.experienceRange?.min ?? ''}
                      onChange={(e) => handleRangeFilterChange('experienceRange', 'min', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.experienceRange?.max ?? ''}
                      onChange={(e) => handleRangeFilterChange('experienceRange', 'max', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rating Range</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      step="0.1"
                      min="0"
                      max="5"
                      value={filters.ratingRange?.min ?? ''}
                      onChange={(e) => handleRangeFilterChange('ratingRange', 'min', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      step="0.1"
                      min="0"
                      max="5"
                      value={filters.ratingRange?.max ?? ''}
                      onChange={(e) => handleRangeFilterChange('ratingRange', 'max', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* NGO Specific Filters */}
            {(activeTab === 'all' || activeTab === 'ngos') && renderFilterSection('NGO Filters', (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Areas of Work</label>
                  <select
                    value={filters.areasOfWork || ''}
                    onChange={(e) => handleFilterChange('areasOfWork', e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">All Areas</option>
                    {ngoAreas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pro Bono Capacity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.proBonoRange?.min ?? ''}
                      onChange={(e) => handleRangeFilterChange('proBonoRange', 'min', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.proBonoRange?.max ?? ''}
                      onChange={(e) => handleRangeFilterChange('proBonoRange', 'max', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Date Range Filters */}
            {renderFilterSection('Date Range Filters', (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date Joined</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.dateJoinedRange?.from ?? ''}
                      onChange={(e) => handleRangeFilterChange('dateJoinedRange', 'from', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={filters.dateJoinedRange?.to ?? ''}
                      onChange={(e) => handleRangeFilterChange('dateJoinedRange', 'to', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Active</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.lastActiveRange?.from ?? ''}
                      onChange={(e) => handleRangeFilterChange('lastActiveRange', 'from', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={filters.lastActiveRange?.to ?? ''}
                      onChange={(e) => handleRangeFilterChange('lastActiveRange', 'to', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Active Filters</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;

                  const getFilterDisplay = (key, value) => {
                    switch (key) {
                      case 'role': return `Role: ${value}`;
                      case 'state': return `State: ${value}`;
                      case 'city': return `City: ${value}`;
                      case 'verificationStatus': return `Verification: ${value}`;
                      case 'accountStatus': return `Account: ${value}`;
                      case 'specialization': return `Specialization: ${value}`;
                      case 'caseCategory': return `Category: ${value}`;
                      case 'areasOfWork': return `Area: ${value}`;
                      case 'experienceRange': return `Experience: ${value.min}-${value.max} years`;
                      case 'ratingRange': return `Rating: ${value.min}-${value.max}`;
                      case 'proBonoRange': return `Pro Bono: ${value.min}-${value.max}`;
                      case 'dateJoinedRange': return `Joined: ${value.from} to ${value.to}`;
                      case 'lastActiveRange': return `Active: ${value.from} to ${value.to}`;
                      default: return `${key}: ${value}`;
                    }
                  };

                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                    >
                      {getFilterDisplay(key, value)}
                      <button
                        onClick={() => clearFilter(key)}
                        className="hover:text-blue-900"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
