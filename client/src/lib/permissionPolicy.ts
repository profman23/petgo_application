/**
 * Permission Policy
 * 
 * This file defines the global behavior rules for different permission levels.
 * These rules will be applied consistently across all screens.
 * 
 * Permission Levels:
 * - NONE: No access (hide from navigation, redirect if accessed)
 * - READ: Read-only access (show in navigation, disable write actions)
 * - FULL: Full control (all actions enabled)
 */

export type PermissionLevel = 'none' | 'read' | 'full';

export interface PermissionBehavior {
  navigation: 'hide' | 'show' | 'disabled';
  routing: 'redirect' | 'allow' | 'block';
  ui: 'disabled' | 'read-only' | 'all-enabled';
}

// Global permission behavior rules - will be implemented later
export const PERMISSION_BEHAVIOR: Record<PermissionLevel, PermissionBehavior> = {
  none: {
    navigation: 'hide',
    routing: 'redirect',
    ui: 'disabled'
  },
  read: {
    navigation: 'show',
    routing: 'allow',
    ui: 'read-only'
  },
  full: {
    navigation: 'show',
    routing: 'allow',
    ui: 'all-enabled'
  }
};

// Helper function to get behavior for a permission level
export const getPermissionBehavior = (level: PermissionLevel): PermissionBehavior => {
  return PERMISSION_BEHAVIOR[level];
};
