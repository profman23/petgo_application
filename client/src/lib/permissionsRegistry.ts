/**
 * Permissions Registry
 * 
 * This file defines all modules/screens in the application that require permissions.
 * Each module will have its own permission configuration.
 * 
 * Structure will be added later as we add permissions for each screen.
 */

export interface ModulePermission {
  id: string;
  title: { ar: string; en: string };
  route?: string;
  supportsExport?: boolean;
}

// Module registry - will be populated later
export const PERMISSION_MODULES: ModulePermission[] = [
  // Modules will be added here
];

// Helper function to get module by ID
export const getModuleById = (id: string): ModulePermission | undefined => {
  return PERMISSION_MODULES.find(module => module.id === id);
};

// Helper function to get all modules
export const getAllModules = (): ModulePermission[] => {
  return PERMISSION_MODULES;
};
