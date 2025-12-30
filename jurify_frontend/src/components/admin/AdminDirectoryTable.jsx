import React, { useState } from 'react';
import { FiEye, FiEdit, FiTrash2, FiCheck, FiX, FiShield, FiShieldOff, FiMail, FiPhone, FiCalendar, FiStar } from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';

const AdminDirectoryTable = ({ users, loading, selectedUsers, setSelectedUsers, onVerification, activeTab }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedUsers(new Set(currentUsers.map(u => u.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId, checked) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleRowExpansion = (userId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusBadge = (status, type = 'verification') => {
    const styles = {
      verification: {
        PENDING: 'bg-yellow-100 text-yellow-700',
        APPROVED: 'bg-green-100 text-green-700',
        REJECTED: 'bg-red-100 text-red-700',
        'RE-UPLOAD REQUESTED': 'bg-orange-100 text-orange-700',
      },
      account: {
        ACTIVE: 'bg-green-100 text-green-700',
        SUSPENDED: 'bg-red-100 text-red-700',
        PENDING: 'bg-yellow-100 text-yellow-700',
        OFFLINE: 'bg-gray-100 text-gray-700',
      }
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[type][status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'LAWYER': return <FiEdit className="text-purple-600" />;
      case 'NGO': return <HiOutlineOfficeBuilding className="text-orange-600" />;
      case 'CITIZEN': return <FiShield className="text-blue-600" />;
      default: return <FiShield className="text-gray-600" />;
    }
  };

  const renderRoleSpecificColumns = (user) => {
    if (user.role === 'LAWYER') {
      return (
        <>
          <td className="px-4 py-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user.barCouncilNumber}</div>
              <div className="text-gray-500">{user.specializations?.join(', ')}</div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm">
              <div className="text-gray-900">{user.yearsOfExperience} years</div>
              <div className="text-gray-500">{user.casesHandled} cases</div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm">
              <div className="flex items-center gap-1">
                <FiStar className="text-yellow-500" />
                <span className="text-gray-900">{user.rating}</span>
              </div>
              <div className="text-gray-500">{user.availability}</div>
            </div>
          </td>
        </>
      );
    } else if (user.role === 'NGO') {
      return (
        <>
          <td className="px-4 py-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user.ngoDarpanId}</div>
              <div className="text-gray-500">{user.areasOfWork?.join(', ')}</div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm">
              <div className="text-gray-900">{user.proBonoCapacity} cases/month</div>
              <div className="text-gray-500">{user.activeCases} active</div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm text-gray-500">—</div>
          </td>
        </>
      );
    } else if (user.role === 'CITIZEN') {
      return (
        <>
          <td className="px-4 py-3">
            <div className="text-sm text-gray-500">—</div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm">
              <div className="text-gray-900">{user.totalCasesSubmitted} total</div>
              <div className="text-gray-500">{user.activeCases} active</div>
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="text-sm text-gray-500">
              {user.lastCaseDate ? new Date(user.lastCaseDate).toLocaleDateString() : 'No cases'}
            </div>
          </td>
        </>
      );
    }
    return null;
  };

  const renderActionButtons = (user) => {
    return (
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleRowExpansion(user.id)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title="View Details"
          >
            <FiEye />
          </button>

          {user.verificationStatus === 'PENDING' && (
            <>
              <button
                onClick={() => onVerification(user)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Approve Verification"
              >
                <FiCheck />
              </button>
              <button
                onClick={() => onVerification(user)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Reject Verification"
              >
                <FiX />
              </button>
            </>
          )}

          <button
            onClick={() => {
              console.log('Edit user:', user.id);
              // TODO: Implement edit functionality
            }}
            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
            title="Edit User"
          >
            <FiEdit />
          </button>

          {user.accountStatus === 'ACTIVE' ? (
            <button
              onClick={() => {
                console.log('Suspend user:', user.id);
                // TODO: Implement suspend functionality
              }}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Suspend User"
            >
              <FiShieldOff />
            </button>
          ) : (
            <button
              onClick={() => {
                console.log('Activate user:', user.id);
                // TODO: Implement activate functionality
              }}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Activate User"
            >
              <FiShield />
            </button>
          )}

          <button
            onClick={() => {
              console.log('Send notification to user:', user.id);
              // TODO: Implement notification functionality
            }}
            className="p-1 text-gray-600 hover:bg-gray-50 rounded"
            title="Send Notification"
          >
            <FiMail />
          </button>
        </div>
      </td>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === currentUsers.length && currentUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {activeTab === 'all' || activeTab === 'lawyers' ? (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'lawyers' ? 'Bar Council & Specialization' : 'Professional Info'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                </>
              ) : null}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.map((user) => (
              <React.Fragment key={user.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-gray-900">
                        <FiMail className="text-xs" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <FiPhone className="text-xs" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div className="text-gray-900">{user.city}</div>
                      <div className="text-gray-500">{user.state}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {getStatusBadge(user.verificationStatus, 'verification')}
                      {getStatusBadge(user.accountStatus, 'account')}
                    </div>
                  </td>
                  {renderRoleSpecificColumns(user)}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="text-xs" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        Last active: {new Date(user.lastActive).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  {renderActionButtons(user)}
                </tr>

                {/* Expanded Row Details */}
                {expandedRows.has(user.id) && (
                  <tr>
                    <td colSpan="12" className="px-4 py-6 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-gray-500">User ID:</span> {user.id}</div>
                            <div><span className="text-gray-500">Role:</span> {user.role}</div>
                            <div><span className="text-gray-500">Email:</span> {user.email}</div>
                            <div><span className="text-gray-500">Phone:</span> {user.phone}</div>
                            <div><span className="text-gray-500">Created:</span> {new Date(user.createdAt).toLocaleString()}</div>
                            <div><span className="text-gray-500">Last Active:</span> {new Date(user.lastActive).toLocaleString()}</div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Status & Verification</h4>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-gray-500">Account Status:</span> {getStatusBadge(user.accountStatus, 'account')}</div>
                            <div><span className="text-gray-500">Verification Status:</span> {getStatusBadge(user.verificationStatus, 'verification')}</div>
                            {user.role === 'LAWYER' && (
                              <>
                                <div><span className="text-gray-500">Languages:</span> {user.languages?.join(', ')}</div>
                                <div><span className="text-gray-500">Availability:</span> {user.availability}</div>
                              </>
                            )}
                            {user.role === 'NGO' && (
                              <div><span className="text-gray-500">Pro Bono Capacity:</span> {user.proBonoCapacity} cases/month</div>
                            )}
                            {user.role === 'CITIZEN' && (
                              <div><span className="text-gray-500">Last Case Date:</span> {user.lastCaseDate ? new Date(user.lastCaseDate).toLocaleDateString() : 'No cases'}</div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Quick Actions</h4>
                          <div className="space-y-2">
                            <button className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                              View Full Profile
                            </button>
                            <button className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">
                              Send Notification
                            </button>
                            <button className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">
                              Reset Password
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {currentUsers.map((user) => (
            <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.id}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {getStatusBadge(user.verificationStatus, 'verification')}
                  {getStatusBadge(user.accountStatus, 'account')}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-1 text-gray-900">
                  <FiMail className="text-xs" />
                  {user.email}
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <FiPhone className="text-xs" />
                  {user.phone}
                </div>
                <div className="text-gray-900">{user.city}, {user.state}</div>
                <div className="text-gray-500">Joined: {new Date(user.createdAt).toLocaleDateString()}</div>

                {user.role === 'LAWYER' && (
                  <div className="text-gray-900">
                    <div>Bar Council: {user.barCouncilNumber}</div>
                    <div>Specialization: {user.specializations?.join(', ')}</div>
                    <div>Experience: {user.yearsOfExperience} years</div>
                    <div className="flex items-center gap-1">
                      <FiStar className="text-yellow-500 text-xs" />
                      Rating: {user.rating}
                    </div>
                  </div>
                )}

                {user.role === 'NGO' && (
                  <div className="text-gray-900">
                    <div>NGO Darpan: {user.ngoDarpanId}</div>
                    <div>Areas: {user.areasOfWork?.join(', ')}</div>
                    <div>Active Cases: {user.activeCases}</div>
                  </div>
                )}

                {user.role === 'CITIZEN' && (
                  <div className="text-gray-900">
                    <div>Total Cases: {user.totalCasesSubmitted}</div>
                    <div>Active Cases: {user.activeCases}</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => toggleRowExpansion(user.id)}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                  title="View Details"
                >
                  <FiEye />
                </button>

                {user.verificationStatus === 'PENDING' && (
                  <>
                    <button
                      onClick={() => onVerification(user)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Approve Verification"
                    >
                      <FiCheck />
                    </button>
                    <button
                      onClick={() => onVerification(user)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Reject Verification"
                    >
                      <FiX />
                    </button>
                  </>
                )}

                <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Edit User">
                  <FiEdit />
                </button>

                <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Send Notification">
                  <FiMail />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, users.length)} of {users.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDirectoryTable;
