import React, { useState, useEffect, useMemo } from 'react';
import { FiUsers, FiBriefcase, FiHome, FiUserCheck, FiShield, FiFilter, FiDownload, FiSearch, FiSave, FiAlertCircle } from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import AdminDirectoryTable from './AdminDirectoryTable';
import FilterBar from './FilterBar';
import VerificationModal from './VerificationModal';
import api from '../../services/api';

const AdminDirectory = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [filters, setFilters] = useState({});
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedUserForVerification, setSelectedUserForVerification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users from API (Now fetching All Users via Admin Service)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // AdminController.getUsers returns Page<AdminUserDTO>
      // We pass page/size but for now we want all logical users for client-side filtering unless we implement server-side
      // The current UI relies on fetching a large batch. The previous call was size=1000.
      const result = await api.get('/admin/users?page=0&size=1000');
      const data = result.content || result;

      // Map AdminUserDTO to the format expected by the table
      const mappedUsers = data.map(entry => ({
        id: entry.id, // User ID
        userId: entry.id, // Redundant but kept for compatibility if needed
        name: entry.name,
        role: entry.role,
        email: entry.email,
        phone: entry.phone,
        state: entry.state,
        city: entry.city,
        accountStatus: entry.accountStatus, // 'ACTIVE', 'SUSPENDED'
        verificationStatus: entry.verificationStatus, // 'PENDING', 'APPROVED', etc.
        isVerified: entry.isVerified,
        createdAt: entry.joinedAt || new Date().toISOString(),
        lastActive: entry.lastActive || new Date().toISOString(),

        // Lawyer specific
        barCouncilNumber: entry.barCouncilNumber,
        specializations: entry.specializations || [], // DTO returns List<String>
        yearsOfExperience: entry.yearsOfExperience,
        rating: entry.rating || '0.0',
        availability: entry.availability,
        casesHandled: entry.casesHandled,

        // NGO specific
        ngoDarpanId: entry.ngoDarpanId,
        areasOfWork: entry.areasOfWork || [], // DTO returns List<String>
        proBonoCapacity: entry.proBonoCapacity,
        activeCases: entry.activeCases,

        // Citizen specific
        totalCasesSubmitted: entry.totalCasesSubmitted,
        lastCaseDate: entry.lastCaseDate,
        lastCaseDate: entry.lastCaseDate,

        // Verification Documents (Fallback)
        documentUrl: entry.documentUrl,
        documentType: entry.documentType,

        // Common placeholder (DTO doesn't have description)
        description: ''
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to fetch users", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const tabs = [
    { id: 'all', label: 'All Users', icon: FiUsers, count: users.length },
    { id: 'lawyers', label: 'Lawyers', icon: FiBriefcase, count: users.filter(u => u.role === 'LAWYER').length },
    { id: 'ngos', label: 'NGOs', icon: HiOutlineOfficeBuilding, count: users.filter(u => u.role === 'NGO').length },
    { id: 'citizens', label: 'Citizens', icon: FiHome, count: users.filter(u => u.role === 'CITIZEN').length },
    { id: 'pending', label: 'Pending Verifications', icon: FiUserCheck, count: users.filter(u => u.verificationStatus === 'PENDING').length },
    { id: 'suspended', label: 'Suspended', icon: FiShield, count: users.filter(u => u.accountStatus === 'SUSPENDED').length },
  ];

  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Tab filtering
    if (activeTab !== 'all') {
      if (activeTab === 'lawyers') filtered = filtered.filter(u => u.role === 'LAWYER');
      else if (activeTab === 'ngos') filtered = filtered.filter(u => u.role === 'NGO');
      else if (activeTab === 'citizens') filtered = filtered.filter(u => u.role === 'CITIZEN');
      else if (activeTab === 'pending') filtered = filtered.filter(u => u.verificationStatus === 'PENDING');
      else if (activeTab === 'suspended') filtered = filtered.filter(u => u.accountStatus === 'SUSPENDED');
    }

    // Search filtering
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Advanced filtering
    if (filters.role && filters.role !== 'ALL') {
      filtered = filtered.filter(u => u.role === filters.role);
    }
    if (filters.state) {
      filtered = filtered.filter(u => u.state === filters.state);
    }
    if (filters.verificationStatus && filters.verificationStatus !== 'ALL') {
      filtered = filtered.filter(u => u.verificationStatus === filters.verificationStatus);
    }
    if (filters.accountStatus && filters.accountStatus !== 'ALL') {
      filtered = filtered.filter(u => u.accountStatus === filters.accountStatus);
    }
    if (filters.ratingRange) {
      filtered = filtered.filter(u => u.rating && parseFloat(u.rating) >= filters.ratingRange.min && parseFloat(u.rating) <= filters.ratingRange.max);
    }
    if (filters.experienceRange) {
      filtered = filtered.filter(u => u.yearsOfExperience && u.yearsOfExperience >= filters.experienceRange.min && u.yearsOfExperience <= filters.experienceRange.max);
    }

    return filtered;
  }, [users, activeTab, searchTerm, filters]);

  const analytics = useMemo(() => {
    const totalUsers = users.length;
    const verifiedLawyers = users.filter(u => u.role === 'LAWYER' && u.verificationStatus === 'APPROVED').length;
    const totalLawyers = users.filter(u => u.role === 'LAWYER').length;
    const pendingVerifications = users.filter(u => u.verificationStatus === 'PENDING').length;
    const activeUsers = users.filter(u => u.accountStatus === 'ACTIVE').length;
    const inactiveUsers = users.filter(u => u.accountStatus === 'SUSPENDED').length;

    return {
      totalUsers,
      verifiedLawyersPercentage: totalLawyers > 0 ? ((verifiedLawyers / totalLawyers) * 100).toFixed(1) : 0,
      pendingVerifications,
      activeUsers,
      inactiveUsers,
    };
  }, [users]);

  const handleVerification = (user) => {
    setSelectedUserForVerification(user);
    setShowVerificationModal(true);
  };

  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');

  const handleBulkAction = (action) => {
    console.log('handleBulkAction called with:', action);
    console.log('selectedUsers:', selectedUsers);

    const selectedUsersArray = Array.from(selectedUsers).map(userId =>
      users.find(u => u.id === userId)
    ).filter(Boolean);

    console.log('selectedUsersArray:', selectedUsersArray);

    if (selectedUsersArray.length === 0) {
      console.log('No users selected, showing no_selection modal');
      setBulkActionType('no_selection');
      setShowBulkActionModal(true);
      return;
    }

    console.log('Setting bulk action type and showing modal');
    setBulkActionType(action);
    setShowBulkActionModal(true);
  };

  const handleExport = () => {
    console.log('Export button clicked');
    console.log('filteredUsers:', filteredUsers);

    // Create CSV content
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Role', 'State', 'City', 'Account Status', 'Verification Status', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.role,
        user.state,
        user.city,
        user.accountStatus,
        user.verificationStatus,
        new Date(user.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    console.log('CSV content created');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin_directory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('CSV export completed');
  };

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 transition-colors duration-300 min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Directory</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and monitor all platform users, verifications, and activities</p>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalUsers}</p>
              </div>
              <FiUsers className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Verified Lawyers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.verifiedLawyersPercentage}%</p>
              </div>
              <FiUserCheck className="text-2xl text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Verifications</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.pendingVerifications}</p>
              </div>
              <FiUserCheck className="text-2xl text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activeUsers}</p>
              </div>
              <FiShield className="text-2xl text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.inactiveUsers}</p>
              </div>
              <FiShield className="text-2xl text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <Icon className="text-lg" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${activeTab === tab.id ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilters({})}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
              >
                <FiFilter />
                Clear Filters
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center gap-2 transition-colors"
              >
                <FiDownload />
                Export CSV
              </button>
              {selectedUsers.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Selected ({selectedUsers.size})
                  </button>
                  <button
                    onClick={() => handleBulkAction('suspend')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Suspend Selected ({selectedUsers.size})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} setFilters={setFilters} activeTab={activeTab} />

        {/* Directory Table */}
        <AdminDirectoryTable
          users={filteredUsers}
          loading={loading}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
          onVerification={handleVerification}
          activeTab={activeTab}
        />

        {/* Verification Modal */}
        {showVerificationModal && selectedUserForVerification && (
          <VerificationModal
            user={selectedUserForVerification}
            onClose={() => {
              setShowVerificationModal(false);
              setSelectedUserForVerification(null);
            }}
            onUpdate={(updatedUser) => {
              setUsers(prevUsers =>
                prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u)
              );
            }}
          />
        )}
      </div>

      {/* Bulk Action Modal */}
      {console.log('showBulkActionModal:', showBulkActionModal, 'bulkActionType:', bulkActionType)}
      {showBulkActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6 animate-scale-in border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                {bulkActionType === 'no_selection' ? (
                  <FiAlertCircle className="text-blue-600 dark:text-blue-400 text-lg" />
                ) : (
                  <FiSave className="text-blue-600 dark:text-blue-400 text-lg" />
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {bulkActionType === 'no_selection' ? 'No Users Selected' :
                  bulkActionType === 'approve' ? 'Approve Selected Users?' :
                    bulkActionType === 'suspend' ? 'Suspend Selected Users?' :
                      bulkActionType === 'notify' ? 'Notify Selected Users?' : 'Confirm Action'}
              </h2>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {bulkActionType === 'no_selection'
                ? 'Please select at least one user to perform this action.'
                : bulkActionType === 'approve'
                  ? `Are you sure you want to approve ${selectedUsers.size} selected users for verification?`
                  : bulkActionType === 'suspend'
                    ? `Are you sure you want to suspend ${selectedUsers.size} selected users?`
                    : bulkActionType === 'notify'
                      ? `Are you sure you want to send notifications to ${selectedUsers.size} selected users?`
                      : 'Are you sure you want to proceed with this action?'}
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  console.log('Cancel button clicked');
                  setShowBulkActionModal(false);
                  setBulkActionType('');
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  console.log('Confirm button clicked, bulkActionType:', bulkActionType);
                  if (bulkActionType !== 'no_selection') {
                    // Perform the bulk action
                    console.log(`Executing bulk ${bulkActionType} for ${selectedUsers.size} users`);
                    // TODO: Implement actual bulk action logic
                  }
                  setShowBulkActionModal(false);
                  setBulkActionType('');
                }}
                className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-[#0e5658]"
              >
                {bulkActionType === 'no_selection' ? 'OK' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDirectory;
