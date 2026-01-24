import React, { useState } from 'react';
import { FiX, FiCheck, FiAlertCircle, FiDownload, FiEye, FiFile, FiClock, FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiShield, FiBriefcase } from 'react-icons/fi';
import { HiOutlineOfficeBuilding } from 'react-icons/hi';
import AdminOnly from '../AdminOnly';
import api from '../../services/api';
import { verificationService } from '../../services/verificationService';

const VerificationModal = ({ user, onClose, onUpdate }) => {
  const [verificationStatus, setVerificationStatus] = useState(user.verificationStatus);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [requestReupload, setRequestReupload] = useState(false);
  const [reuploadReason, setReuploadReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Fetch real documents (pending requests) for this user
  React.useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoadingDocs(true);
        // Fetch all pending requests
        const requests = await verificationService.getPendingRequests();
        console.log("DEBUG: VerificationModal current user:", user);
        console.log("DEBUG: All Pending Requests:", requests);

        const requestList = Array.isArray(requests) ? requests : (requests.content || []);

        // Filter for this user
        const userDocs = requestList
          .filter(req => req.user && String(req.user.id) === String(user.id))
          .map(req => ({
            id: req.id,
            name: req.documentType || 'Document',
            type: 'FILE', // Generic type
            size: 0, // Size not available in this endpoint
            url: req.documentUrl,
            uploadDate: req.submittedAt || new Date().toISOString(),
            status: req.status
          }));

        // Fallback: If no pending request found but user has profile document
        if (userDocs.length === 0) {
          if (user.documents && user.documents.length > 0) {
            // Use pre-mapped documents from dashboard if available
            // Ensure they match the shape we need
            const mappedProfileDocs = user.documents.map(d => ({
              ...d,
              id: d.id || 'profile-doc-' + Math.random(),
              type: 'FILE',
              size: d.size || 0,
              uploadDate: d.uploadDate || user.lastUpdated || new Date().toISOString(),
              status: user.verificationStatus || 'PENDING'
            }));
            userDocs.push(...mappedProfileDocs);
          } else if (user.documentUrl) {
            // Use raw documentUrl from user profile
            userDocs.push({
              id: 'profile-doc',
              name: user.documentType || 'Profile Document',
              type: 'FILE',
              size: 0,
              url: user.documentUrl,
              uploadDate: user.lastUpdated || new Date().toISOString(),
              status: user.verificationStatus || 'PENDING'
            });
          }
        }

        setDocuments(userDocs);
      } catch (error) {
        console.error("Failed to fetch documents", error);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [user.id]);

  const verificationHistory = [
    {
      id: 'VH001',
      action: 'SUBMITTED',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      admin: 'System',
      notes: 'Initial verification submitted'
    },
    {
      id: 'VH002',
      action: 'UNDER_REVIEW',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      admin: 'Admin User',
      notes: 'Documents under review'
    }
  ];

  const handleSubmit = async (action) => {
    setIsSubmitting(true);

    try {
      if (action === 'APPROVED' || action === 'VERIFIED') {
        await api.post(`/admin/users/${user.userId}/verify`);
      }
      // TODO: Handle REJECTED or RE-UPLOAD if backend supports it

      const updatedUser = {
        ...user,
        verificationStatus: action === 'APPROVED' ? 'VERIFIED' : action,
        lastUpdated: new Date().toISOString()
      };

      onUpdate(updatedUser);
      onClose();
    } catch (error) {
      console.error("Verification failed", error);
      alert("Failed to verify user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = () => {
    handleSubmit('APPROVED');
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    handleSubmit('REJECTED');
  };

  const handleRequestReupload = () => {
    if (!reuploadReason.trim()) {
      alert('Please specify what documents need to be re-uploaded');
      return;
    }
    handleSubmit('RE-UPLOAD REQUESTED');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'LAWYER': return <FiBriefcase className="text-purple-600" />;
      case 'NGO': return <HiOutlineOfficeBuilding className="text-orange-600" />;
      case 'CITIZEN': return <FiShield className="text-blue-600" />;
      default: return <FiShield className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'APPROVED': 'bg-green-100 text-green-700',
      'REJECTED': 'bg-red-100 text-red-700',
      'RE-UPLOAD REQUESTED': 'bg-orange-100 text-orange-700',
      'VERIFIED': 'bg-green-100 text-green-700'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                {getRoleIcon(user.role)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Review</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.name} - {user.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column - User Info & Documents */}
            <div className="lg:col-span-2 space-y-6">

              {/* User Information */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiUser />
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Name:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Role:</span>
                    <p className="font-medium text-gray-900 dark:text-white">{user.role}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Email:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <FiMail className="text-xs" />
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <FiPhone className="text-xs" />
                      {user.phone}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Location:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <FiMapPin className="text-xs" />
                      {user.city}, {user.state}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Member Since:</span>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <FiCalendar className="text-xs" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Role-specific information */}
                {user.role === 'LAWYER' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">Professional Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Bar Council Number:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.barCouncilNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Experience:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.yearsOfExperience} years</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Specializations:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.specializations?.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Cases Handled:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.casesHandled}</p>
                      </div>
                    </div>
                  </div>
                )}

                {user.role === 'NGO' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-2">NGO Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">NGO Darpan ID:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.ngoDarpanId}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Areas of Work:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.areasOfWork?.join(', ')}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Pro Bono Capacity:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.proBonoCapacity} cases/month</p>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Active Cases:</span>
                        <p className="font-medium text-gray-900 dark:text-white">{user.activeCases}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiFile />
                  Uploaded Documents
                </h3>
                <div className="space-y-3">
                  {loadingDocs ? (
                    <div className="text-center py-4 text-gray-500">Loading documents...</div>
                  ) : documents.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">No documents available for verification.</p>
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                              <FiFile className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{doc.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{doc.type}</span>
                                <span>{formatFileSize(doc.size)}</span>
                                <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(doc.status)}
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg"
                              title="View Document"
                            >
                              <FiEye />
                            </button>
                            <button
                              onClick={() => window.open(doc.url, '_blank')}
                              className="p-2 text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg"
                              title="Download Document"
                            >
                              <FiDownload />
                            </button>
                          </div>
                        </div>
                      </div>
                    )))}
                </div>
              </div>

              {/* Verification History */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FiClock />
                  Verification History
                </h3>
                <div className="space-y-3">
                  {verificationHistory.map((history) => (
                    <div key={history.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
                        <FiClock className="text-blue-600 dark:text-blue-400 text-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-gray-200">{history.action.replace('_', ' ')}</h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(history.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{history.notes}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">By: {history.admin}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Verification Actions */}
            <div className="space-y-6">

              {/* Current Status */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Current Status</h3>
                <div className="flex items-center gap-2 mb-3">
                  {getStatusBadge(user.verificationStatus)}
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {user.verificationStatus === 'PENDING' && 'Verification is pending review.'}
                  {user.verificationStatus === 'APPROVED' && 'User has been verified.'}
                  {user.verificationStatus === 'REJECTED' && 'Verification was rejected.'}
                  {user.verificationStatus === 'RE-UPLOAD REQUESTED' && 'User needs to re-upload documents.'}
                </p>
              </div>

              {/* Verification Actions */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Verification Actions</h3>

                <div className="space-y-4">
                  <AdminOnly>
                    {/* Approve Button */}
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting || user.verificationStatus === 'APPROVED'}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <FiCheck />
                      {isSubmitting ? 'Processing...' : 'Approve Verification'}
                    </button>

                    {/* Reject Section */}
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <button
                        onClick={() => setVerificationStatus('REJECTED')}
                        className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${verificationStatus === 'REJECTED'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                          }`}
                      >
                        <FiX />
                        Reject Verification
                      </button>

                      {verificationStatus === 'REJECTED' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rejection Reason *
                          </label>
                          <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please specify reason for rejection..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={3}
                          />
                          <button
                            onClick={handleReject}
                            disabled={isSubmitting || !rejectionReason.trim()}
                            className="mt-2 w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                          </button>
                        </div>
                      )}
                    </div>
                  </AdminOnly>

                  {/* Request Re-upload Section */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <button
                      onClick={() => setRequestReupload(!requestReupload)}
                      className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${requestReupload
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                        }`}
                    >
                      <FiAlertCircle />
                      Request Re-upload
                    </button>

                    {requestReupload && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Re-upload Reason *
                        </label>
                        <textarea
                          value={reuploadReason}
                          onChange={(e) => setReuploadReason(e.target.value)}
                          placeholder="Specify which documents need to be re-uploaded and why..."
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={3}
                        />
                        <button
                          onClick={handleRequestReupload}
                          disabled={isSubmitting || !reuploadReason.trim()}
                          className="mt-2 w-full px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Processing...' : 'Request Re-upload'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this verification..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              {/* Quick Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition text-sm">
                    <FiMail />
                    Send Notification to User
                  </button>
                  <button className="w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition text-sm">
                    <FiUser />
                    View Full Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 transition text-sm">
                    <FiShield />
                    Suspend Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date(user.lastUpdated || user.createdAt).toLocaleString()}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
