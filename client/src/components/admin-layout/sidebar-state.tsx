import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { getDefaultExpandedSections } from '@/lib/adminSidebar';

interface SidebarStateContextType {
  expandedSections: Record<string, boolean>;
  toggleSection: (sectionId: string) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

const SidebarStateContext = createContext<SidebarStateContextType | null>(null);

const SIDEBAR_STATE_KEY = 'adminSidebar:v1';

interface SidebarStateProviderProps {
  children: ReactNode;
}

export function SidebarStateProvider({ children }: SidebarStateProviderProps) {
  const [location] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Initialize expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to parse saved sidebar state:', error);
    }
    
    // If no saved state, use defaults based on current route
    return getDefaultExpandedSections(location);
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(expandedSections));
    } catch (error) {
      console.warn('Failed to save sidebar state:', error);
    }
  }, [expandedSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const contextValue: SidebarStateContextType = {
    expandedSections,
    toggleSection,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  };

  return (
    <SidebarStateContext.Provider value={contextValue}>
      {children}
    </SidebarStateContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext);
  if (!context) {
    throw new Error('useSidebarState must be used within a SidebarStateProvider');
  }
  return context;
}