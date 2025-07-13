import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, url: string) {
  if (!res.ok) {
    // If unauthorized, clear tokens and redirect
    if (res.status === 401) {
      console.log('🔐 401 Unauthorized - clearing tokens and redirecting');
      
      if (url.includes('/api/admin/')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        setTimeout(() => window.location.href = '/admin-login', 100);
      } else if (url.includes('/api/doctor/')) {
        localStorage.removeItem('doctorToken');
        localStorage.removeItem('user');
        setTimeout(() => window.location.href = '/doctor-login', 100);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => window.location.href = '/login', 100);
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
  // Check for tokens: admin, doctor, then regular token
  const adminToken = localStorage.getItem('adminToken');
  const doctorToken = localStorage.getItem('doctorToken');
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }
  
  // Use appropriate token based on endpoint with debugging
  if (url.includes('/api/admin/') && adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
    console.log('🔐 Using admin token for:', url);
  } else if (url.includes('/api/doctor/') && doctorToken) {
    headers["Authorization"] = `Bearer ${doctorToken}`;
    console.log('🔐 Using doctor token for:', url);
  } else if (url.includes('/api/invoice-') && doctorToken) {
    headers["Authorization"] = `Bearer ${doctorToken}`;
    console.log('🔐 Using doctor token for invoice:', url);
  } else if (url.includes('/api/pet-') && doctorToken) {
    headers["Authorization"] = `Bearer ${doctorToken}`;
    console.log('🔐 Using doctor token for pet:', url);
  } else if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log('🔐 Using customer token for:', url);
  } else {
    console.log('⚠️ No token available for:', url, {
      adminToken: !!adminToken,
      doctorToken: !!doctorToken,
      token: !!token
    });
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
    const adminToken = localStorage.getItem('adminToken');
    const doctorToken = localStorage.getItem('doctorToken');
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    const url = queryKey[0] as string;
    
    // Use appropriate token based on endpoint
    if (url.includes('/api/admin/') && adminToken) {
      headers["Authorization"] = `Bearer ${adminToken}`;
    } else if (url.includes('/api/doctor/') && doctorToken) {
      headers["Authorization"] = `Bearer ${doctorToken}`;
    } else if (url.includes('/api/invoice-') && doctorToken) {
      headers["Authorization"] = `Bearer ${doctorToken}`;
    } else if (url.includes('/api/pet-') && doctorToken) {
      headers["Authorization"] = `Bearer ${doctorToken}`;
    } else if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, queryKey[0] as string);
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
