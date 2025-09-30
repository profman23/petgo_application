// Maps screen IDs to their corresponding permission fields in the database
export interface PermissionFields {
  hidden: string;
  read: string;
  fullControl: string;
}

export const screenPermissionMapping: Record<string, PermissionFields> = {
  // Administration screens
  users: {
    hidden: 'usersHidden',
    read: 'usersRead',
    fullControl: 'usersFullControl'
  },
  authorization: {
    hidden: 'authHidden',
    read: 'authRead',
    fullControl: 'authFullControl'
  },
  
  // Financial screens
  creditNotes: {
    hidden: 'creditNotesHidden',
    read: 'creditNotesRead',
    fullControl: 'creditNotesFullControl'
  },
  outgoingPayment: {
    hidden: 'outgoingPaymentHidden',
    read: 'outgoingPaymentRead',
    fullControl: 'outgoingPaymentFullControl'
  },
  incomePayment: {
    hidden: 'incomePaymentHidden',
    read: 'incomePaymentRead',
    fullControl: 'incomePaymentFullControl'
  },
  arBalance: {
    hidden: 'arBalanceHidden',
    read: 'arBalanceRead',
    fullControl: 'arBalanceFullControl'
  },
  
  // Business Partner screens
  partnerManagement: {
    hidden: 'partnerManagementHidden',
    read: 'partnerManagementRead',
    fullControl: 'partnerManagementFullControl'
  },
  
  // Individual screens
  vetsvanManagement: {
    hidden: 'vetsVanHidden',
    read: 'vetsVanRead',
    fullControl: 'vetsVanFullControl'
  },
  vetsvanShifts: {
    hidden: 'vetsVanShiftsHidden',
    read: 'vetsVanShiftsRead',
    fullControl: 'vetsVanShiftsFullControl'
  },
  vetsvanRequests: {
    hidden: 'vetsVanRequestsHidden',
    read: 'vetsVanRequestsRead',
    fullControl: 'vetsVanRequestsFullControl'
  },
  import: {
    hidden: 'importHidden',
    read: 'importRead',
    fullControl: 'importFullControl'
  },
  services: {
    hidden: 'servicesHidden',
    read: 'servicesRead',
    fullControl: 'servicesFullControl'
  },
  products: {
    hidden: 'productsHidden',
    read: 'productsRead',
    fullControl: 'productsFullControl'
  }
};

// Helper function to get permission field names for a screen
export function getPermissionFields(screenId: string): PermissionFields | undefined {
  return screenPermissionMapping[screenId];
}
