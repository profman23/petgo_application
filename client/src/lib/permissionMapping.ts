// Maps screen IDs to their corresponding permission fields in the database
// Based on the actual database schema in shared/schema.ts authorizations table

export interface PermissionFields {
  hidden?: string;      // e.g., "usersHidden" - Some screens use "noPermission" instead
  noPermission?: string; // e.g., "creditNoteNoPermission" - Alternative to "hidden"
  read?: string;        // e.g., "usersRead" - Not all screens have read permission
  fullControl: string;  // e.g., "usersFullControl" - All screens have this
  export?: string;      // e.g., "creditNoteExport" - Only some screens have export
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
  
  // Financial screens - Credit Notes uses different naming convention
  creditNotes: {
    noPermission: 'creditNoteNoPermission', // Note: uses "noPermission" instead of "hidden"
    read: 'creditNoteRead',
    fullControl: 'creditNoteFullControl',
    export: 'creditNoteExport'
  },
  
  // Financial screens - Not yet in database schema, using credit note permissions as fallback
  outgoingPayment: {
    noPermission: 'creditNoteNoPermission',
    read: 'creditNoteRead',
    fullControl: 'creditNoteFullControl'
  },
  incomePayment: {
    noPermission: 'creditNoteNoPermission',
    read: 'creditNoteRead',
    fullControl: 'creditNoteFullControl'
  },
  arBalance: {
    noPermission: 'creditNoteNoPermission',
    read: 'creditNoteRead',
    fullControl: 'creditNoteFullControl'
  },
  
  // Business Partner screens - Not yet in database schema, using users permissions as fallback
  partnerManagement: {
    hidden: 'usersHidden',
    read: 'usersRead',
    fullControl: 'usersFullControl'
  },
  
  // VetsVan Management screens
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
  
  // VetsVan Requests - Not yet in database schema, using vetsvan permissions as fallback
  vetsvanRequests: {
    hidden: 'vetsVanHidden',
    read: 'vetsVanRead',
    fullControl: 'vetsVanFullControl'
  },
  
  // Import - Only has hidden and fullControl, no read permission
  import: {
    hidden: 'importHidden',
    fullControl: 'importFullControl'
  },
  
  // Services & Products screens
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
