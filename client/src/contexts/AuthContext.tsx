import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthorizationData {
  id: number;
  name: string;
  usersHidden: boolean;
  usersRead: boolean;
  usersFullControl: boolean;
  authHidden: boolean;
  authRead: boolean;
  authFullControl: boolean;
}

interface AdminData {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  authorizationId: number;
  authorization?: AuthorizationData;
}

interface AuthState {
  isAuthenticated: boolean;
  admin: AdminData | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, adminData: AdminData) => void;
  logout: () => void;
  hasPermission: (permission: keyof AuthorizationData) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    isLoading: true,
  });

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const adminToken = localStorage.getItem("adminToken");
        const adminData = localStorage.getItem("admin");

        if (adminToken && adminData) {
          const admin = JSON.parse(adminData) as AdminData;
          setAuthState({
            isAuthenticated: true,
            admin,
            isLoading: false,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            admin: null,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          isAuthenticated: false,
          admin: null,
          isLoading: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, adminData: AdminData) => {
    localStorage.setItem("adminToken", token);
    localStorage.setItem("admin", JSON.stringify(adminData));
    
    setAuthState({
      isAuthenticated: true,
      admin: adminData,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    
    setAuthState({
      isAuthenticated: false,
      admin: null,
      isLoading: false,
    });
  };

  const hasPermission = (permission: keyof AuthorizationData): boolean => {
    return authState.admin?.authorization?.[permission] || false;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};