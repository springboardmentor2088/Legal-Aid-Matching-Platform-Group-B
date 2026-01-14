//  ROLES 
export const ROLES = {
  CITIZEN: 'citizen',
  LAWYER: 'lawyer',
  NGO: 'ngo',
};

//  CHAT PERMISSIONS 
export const ROLE_PERMISSIONS = {
  [ROLES.CITIZEN]: {
    canCreateCases: true,
    canViewOwnCases: true,
    canUploadDocuments: true,
    canRequestCall: true,
    canEditCase: true,
    canCloseCase: false,
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg'],
    messageLengthLimit: 500,
    dailyMessageLimit: 50,
  },

  [ROLES.LAWYER]: {
    canViewAssignedCases: true,
    canUploadDocuments: true,
    canRequestCall: true,
    canScheduleMeeting: true,
    canEditCase: true,
    canCloseCase: true,
    maxFileSize: 25,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg', 'xlsx', 'pptx'],
    messageLengthLimit: 1000,
    dailyMessageLimit: 200,
  },

  [ROLES.NGO]: {
    canViewSupportedCases: true,
    canUploadDocuments: true,
    canScheduleMeeting: true,
    canEditCase: true,
    canCloseCase: false,
    maxFileSize: 20,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg', 'xlsx'],
    messageLengthLimit: 800,
    dailyMessageLimit: 150,
  },
};

//  ROLE LABELS 
export const ROLE_LABELS = {
  [ROLES.CITIZEN]: 'Client',
  [ROLES.LAWYER]: 'Legal Counsel',
  [ROLES.NGO]: 'Legal Aid Support',
};

//  CHAT RULES 
export const CHAT_RULES = {
  security: {
    encryptionRequired: true,
    messageRetentionDays: 365,
    auditLogAccess: [ROLES.LAWYER, ROLES.NGO],
  },
};

//  CORE CHAT RULE
export const canSendMessage = (senderRole, receiverRole) => {
  if (senderRole === ROLES.CITIZEN) {
    return [ROLES.LAWYER, ROLES.NGO].includes(receiverRole);
  }

  if (senderRole === ROLES.LAWYER) {
    return receiverRole === ROLES.CITIZEN;
  }

  if (senderRole === ROLES.NGO) {
    // NGO can chat with Citizen OR Lawyer (if assigned)
    return [ROLES.CITIZEN, ROLES.LAWYER].includes(receiverRole);
  }

  return false;
};

//  HELPERS 
export const getMessageLimits = (role) => {
  const permissions = ROLE_PERMISSIONS[role];
  return {
    maxLength: permissions?.messageLengthLimit ?? 500,
    dailyLimit: permissions?.dailyMessageLimit ?? 50,
  };
};

export const getFileUploadLimits = (role) => {
  const permissions = ROLE_PERMISSIONS[role];
  return {
    maxSize: permissions?.maxFileSize ?? 5,
    allowedTypes: permissions?.allowedFileTypes ?? ['pdf'],
  };
};

export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] ?? role;
};

export const validateMessage = (role, message) => {
  const { maxLength } = getMessageLimits(role);
  const errors = [];

  if (!message?.trim()) {
    errors.push('Message cannot be empty');
  }

  if (message.length > maxLength) {
    errors.push(`Message exceeds ${maxLength} characters`);
  }

  const prohibitedPatterns = [
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /password\s*[:=]\s*\S+/i,
  ];

  if (prohibitedPatterns.some((p) => p.test(message))) {
    errors.push('Message contains sensitive information');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  ROLES,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  CHAT_RULES,
  canSendMessage,
  getMessageLimits,
  getFileUploadLimits,
  getRoleLabel,
  validateMessage,
};
