import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, url: string) {
  if (!res.ok) {
    // If unauthorized, clear local storage and redirect to appropriate login
    if (res.status === 401) {
      if (url.includes('/api/admin/')) {
        // Admin endpoint - clear admin tokens and redirect to admin login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        window.location.href = '/admin-login';
      } else {
        // Regular endpoint - clear user tokens and redirect to regular login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
      return;
    }
    const text = await res.text();
    try {
      // Try to parse JSON response to extract clean message
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || text || res.statusText);
    } catch (parseError) {
      // If not JSON, use the text as is
      throw new Error(text || res.statusText);
    }
  }
}

export async function apiRequest(
  url: string,
  options?: {
    method?: string;
    body?: string;
  },
): Promise<any> {
  // Check for admin token first (for admin endpoints), then regular token
  const adminToken = localStorage.getItem('adminToken');
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }
  
  // Use admin token for admin endpoints, regular token for others
  if (url.includes('/api/admin/') && adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers,
    body: typeof options?.body === 'string' ? options.body : JSON.stringify(options?.body),
    credentials: "include",
  });

  await throwIfResNotOk(res, url);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const adminToken = localStorage.getItem('adminToken');
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    // Use admin token for admin endpoints, regular token for others
    if (url.includes('/api/admin/') && adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    } else if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, url);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
