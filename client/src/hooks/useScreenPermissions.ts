import { useQuery } from "@tanstack/react-query";
import { getPermissionFields } from "@/lib/permissionMapping";

export interface ScreenPermissions {
  hasAccess: boolean;
  canRead: boolean;
  canExport: boolean;
  canEdit: boolean;
  isLoading: boolean;
}

/**
 * Centralized hook for checking screen permissions
 * @param screenId - The screen identifier (e.g., 'users', 'authorization', 'creditNotes')
 * @returns Permission status for the screen
 */
export function useScreenPermissions(screenId: string): ScreenPermissions {
  // Fetch current user's permissions
  const {
    data: currentUserPermissions,
    isLoading: permissionsLoading,
  } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Get permission field names for this screen
  const permissionFields = getPermissionFields(screenId);

  if (permissionsLoading || !currentUserPermissions || !permissionFields) {
    return {
      hasAccess: false,
      canRead: false,
      canExport: false,
      canEdit: false,
      isLoading: permissionsLoading,
    };
  }

  const permissions = currentUserPermissions as any;

  // Check if screen is hidden (No Permission)
  const isHidden = permissions[permissionFields.hidden] === true;
  
  // Check if user has Read permission
  const hasRead = permissions[permissionFields.read] === true;
  
  // Check if user has Full Control
  const hasFullControl = permissions[permissionFields.fullControl] === true;

  // Determine access levels
  const hasAccess = !isHidden && (hasRead || hasFullControl);
  const canRead = hasRead || hasFullControl;
  const canEdit = hasFullControl;
  const canExport = hasFullControl; // Export is included in Full Control

  return {
    hasAccess,
    canRead,
    canExport,
    canEdit,
    isLoading: false,
  };
}
