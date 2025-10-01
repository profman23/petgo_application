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

