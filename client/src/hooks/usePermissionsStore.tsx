import { createContext, useContext, useReducer, ReactNode } from 'react';

// Define permission keys for different areas
export type PermissionKey = 
  | 'creditNote' 
  | 'outgoingPayment' 
  | 'incomePayment' 
  | 'arInvoice' 
  | 'authorizationMgmt' 
  | 'partnerMgmt'
  | 'products'
  | 'services';

// Define the state for each permission group
export type PermissionGroupState = {
  noPermission: boolean;
  read: boolean;
  fullControl: boolean;
  export: boolean;
};

// Define the overall store state
type PermissionsState = Record<PermissionKey, PermissionGroupState>;

// Define action types
type PermissionAction = 
  | { type: 'TOGGLE_NO_PERMISSION'; key: PermissionKey; value: boolean }
  | { type: 'TOGGLE_READ'; key: PermissionKey; value: boolean }
  | { type: 'TOGGLE_FULL_CONTROL'; key: PermissionKey; value: boolean }
  | { type: 'TOGGLE_EXPORT'; key: PermissionKey; value: boolean }
  | { type: 'LOAD_AUTHORIZATION'; data: PermissionsState }
  | { type: 'RESET_ALL' };

// Initial state for a permission group
const initialGroupState: PermissionGroupState = {
  noPermission: false,
  read: false,
  fullControl: false,
  export: false,
};

// Initial state for the store
const initialState: PermissionsState = {
  creditNote: { ...initialGroupState },
  outgoingPayment: { ...initialGroupState },
  incomePayment: { ...initialGroupState },
  arInvoice: { ...initialGroupState },
  authorizationMgmt: { ...initialGroupState },
  partnerMgmt: { ...initialGroupState },
  products: { ...initialGroupState },
  services: { ...initialGroupState },
};

// Reducer with business rules enforcement
function permissionsReducer(state: PermissionsState, action: PermissionAction): PermissionsState {
  switch (action.type) {
    case 'TOGGLE_NO_PERMISSION':
      return {
        ...state,
        [action.key]: {
          ...state[action.key],
          noPermission: action.value,
          // When No Permission is enabled, disable all other permissions
          read: action.value ? false : state[action.key].read,
          fullControl: action.value ? false : state[action.key].fullControl,
          export: action.value ? false : state[action.key].export,
        },
      };

    case 'TOGGLE_READ':
      return {
        ...state,
        [action.key]: {
          ...state[action.key],
          read: action.value,
          // When any permission is enabled, disable No Permission
          noPermission: action.value ? false : state[action.key].noPermission,
        },
      };

    case 'TOGGLE_FULL_CONTROL':
      return {
        ...state,
        [action.key]: {
          ...state[action.key],
          fullControl: action.value,
          // When Full Control is enabled, also enable Read
          read: action.value ? true : state[action.key].read,
          // When any permission is enabled, disable No Permission
          noPermission: action.value ? false : state[action.key].noPermission,
        },
      };

    case 'TOGGLE_EXPORT':
      return {
        ...state,
        [action.key]: {
          ...state[action.key],
          export: action.value,
          // When any permission is enabled, disable No Permission
          noPermission: action.value ? false : state[action.key].noPermission,
        },
      };

    case 'LOAD_AUTHORIZATION':
      return { ...action.data };

    case 'RESET_ALL':
      return { ...initialState };

    default:
      return state;
  }
}

// Context type
type PermissionsContextType = {
  state: PermissionsState;
  dispatch: React.Dispatch<PermissionAction>;
};

// Create context
const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// Provider component
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(permissionsReducer, initialState);

  return (
    <PermissionsContext.Provider value={{ state, dispatch }}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook to use permissions for a specific group
export function usePermissionGroup(key: PermissionKey) {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionGroup must be used within a PermissionsProvider');
  }

  const { state, dispatch } = context;
  const groupState = state[key];

  return {
    state: groupState,
    toggleNoPermission: (value: boolean) => 
      dispatch({ type: 'TOGGLE_NO_PERMISSION', key, value }),
    toggleRead: (value: boolean) => 
      dispatch({ type: 'TOGGLE_READ', key, value }),
    toggleFullControl: (value: boolean) => 
      dispatch({ type: 'TOGGLE_FULL_CONTROL', key, value }),
    toggleExport: (value: boolean) => 
      dispatch({ type: 'TOGGLE_EXPORT', key, value }),
  };
}

// Hook to access the full store (for loading/saving authorization data)
export function usePermissionsStore() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissionsStore must be used within a PermissionsProvider');
  }

  const { state, dispatch } = context;

  return {
    state,
    loadAuthorization: (data: PermissionsState) => 
      dispatch({ type: 'LOAD_AUTHORIZATION', data }),
    resetAll: () => 
      dispatch({ type: 'RESET_ALL' }),
  };
}

// Helper functions to convert between API data and store format
export function fromAuthData(auth: any): PermissionsState {
  return {
    creditNote: {
      noPermission: auth.creditNoteNoPermission || false,
      read: auth.creditNoteRead || false,
      fullControl: auth.creditNoteFullControl || false,
      export: auth.creditNoteExport || false,
    },
    outgoingPayment: {
      noPermission: auth.outgoingPaymentNoPermission || false,
      read: auth.outgoingPaymentRead || false,
      fullControl: auth.outgoingPaymentFullControl || false,
      export: auth.outgoingPaymentExport || false,
    },
    incomePayment: {
      noPermission: auth.incomePaymentNoPermission || false,
      read: auth.incomePaymentRead || false,
      fullControl: auth.incomePaymentFullControl || false,
      export: auth.incomePaymentExport || false,
    },
    arInvoice: {
      noPermission: auth.arInvoiceNoPermission || false,
      read: auth.arInvoiceRead || false,
      fullControl: auth.arInvoiceFullControl || false,
      export: auth.arInvoiceExport || false,
    },
    authorizationMgmt: {
      noPermission: auth.authorizationMgmtHidden || false,
      read: auth.authorizationMgmtRead || false,
      fullControl: auth.authorizationMgmtFullControl || false,
      export: false, // No export for authorization management
    },
    partnerMgmt: {
      noPermission: auth.partnerMgmtHidden || false,
      read: auth.partnerMgmtRead || false,
      fullControl: auth.partnerMgmtFullControl || false,
      export: false, // No export for partner management
    },
    products: {
      noPermission: auth.productsHidden || false,
      read: auth.productsRead || false,
      fullControl: auth.productsFullControl || false,
      export: false, // No export for products
    },
    services: {
      noPermission: auth.servicesHidden || false,
      read: auth.servicesRead || false,
      fullControl: auth.servicesFullControl || false,
      export: false, // No export for services
    },
  };
}

export function toAuthData(store: PermissionsState): any {
  return {
    // Credit Note permissions
    creditNoteNoPermission: store.creditNote.noPermission,
    creditNoteRead: store.creditNote.read,
    creditNoteFullControl: store.creditNote.fullControl,
    creditNoteExport: store.creditNote.export,
    
    // Outgoing Payment permissions
    outgoingPaymentNoPermission: store.outgoingPayment.noPermission,
    outgoingPaymentRead: store.outgoingPayment.read,
    outgoingPaymentFullControl: store.outgoingPayment.fullControl,
    outgoingPaymentExport: store.outgoingPayment.export,
    
    // Income Payment permissions
    incomePaymentNoPermission: store.incomePayment.noPermission,
    incomePaymentRead: store.incomePayment.read,
    incomePaymentFullControl: store.incomePayment.fullControl,
    incomePaymentExport: store.incomePayment.export,
    
    // AR Invoice permissions
    arInvoiceNoPermission: store.arInvoice.noPermission,
    arInvoiceRead: store.arInvoice.read,
    arInvoiceFullControl: store.arInvoice.fullControl,
    arInvoiceExport: store.arInvoice.export,
    
    // Authorization Management permissions (using "Hidden" naming convention)
    authorizationMgmtHidden: store.authorizationMgmt.noPermission,
    authorizationMgmtRead: store.authorizationMgmt.read,
    authorizationMgmtFullControl: store.authorizationMgmt.fullControl,
    
    // Partner Management permissions (using "Hidden" naming convention)
    partnerMgmtHidden: store.partnerMgmt.noPermission,
    partnerMgmtRead: store.partnerMgmt.read,
    partnerMgmtFullControl: store.partnerMgmt.fullControl,
    
    // Products permissions (using "Hidden" naming convention)
    productsHidden: store.products.noPermission,
    productsRead: store.products.read,
    productsFullControl: store.products.fullControl,
    
    // Services permissions (using "Hidden" naming convention)
    servicesHidden: store.services.noPermission,
    servicesRead: store.services.read,
    servicesFullControl: store.services.fullControl,
  };
}