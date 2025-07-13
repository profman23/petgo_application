// Force refresh notification system DISABLED to prevent login loops
export function useForceRefreshNotifications() {
  // DISABLED function - returns empty cleanup function to prevent login loops
  return () => {};
}