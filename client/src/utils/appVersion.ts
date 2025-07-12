// App version management for cache invalidation
export const APP_VERSION = Date.now().toString();

export const getAppVersion = (): string => {
  return APP_VERSION;
};

export const setAppVersion = (version: string): void => {
  localStorage.setItem('app_version', version);
};

export const getStoredAppVersion = (): string | null => {
  return localStorage.getItem('app_version');
};

export const isVersionUpdated = (): boolean => {
  const storedVersion = getStoredAppVersion();
  return storedVersion !== APP_VERSION;
};

export const updateStoredVersion = (): void => {
  setAppVersion(APP_VERSION);
};