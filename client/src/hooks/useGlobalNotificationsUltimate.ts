// Hook COMPLETELY DISABLED to prevent unauthorized admin API calls from customer users

export function useGlobalNotificationsUltimate() {
  // COMPLETELY DISABLED - hook disabled to prevent admin API calls from customer users
  console.log('🔧 useGlobalNotificationsUltimate hook DISABLED to prevent unauthorized API calls');
  return () => {};
}