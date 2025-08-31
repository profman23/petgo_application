import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, Users, Shield, Truck, BarChart3, User } from 'lucide-react';
import { Link } from 'wouter';

export default function MyProfile() {
  const [, setLocation] = useLocation();
  const [currentRequestCount, setCurrentRequestCount] = useState(0);
  const lastRequestCountRef = useRef(0);

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setLocation("/admin-login");
      return;
    }
  }, [setLocation]);

  // Fetch current user's authorization permissions
  const {
    data: currentUserPermissions,
    isLoading: permissionsLoading,
    error: permissionsError
  } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    retry: false,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const adminToken = localStorage.getItem("adminToken");
  const admin = JSON.parse(localStorage.getItem("admin") || "{}");

  // Fetch all VetsVan requests for notification counter
  const { data: allVetsVanRequests } = useQuery({
    queryKey: ["/api/admin/vetsvan-requests"],
    queryFn: async () => {
      const response = await fetch("/api/admin/vetsvan-requests", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch requests");
      return response.json();
    },
    refetchInterval: 3000,
    enabled: !!adminToken,
  });

  // Monitor for new requests and update counter
  useEffect(() => {
    if (allVetsVanRequests && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests]);

  // Request browser notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    setLocation("/admin-login");
  };

  // Super admin check
  const isSuperAdmin = admin?.username === 'admin';

  // Determine sidebar item states
  const isUsersDisabled = !isSuperAdmin && (currentUserPermissions as any)?.usersHidden;
  const isUsersReadOnly = !isSuperAdmin && (currentUserPermissions as any)?.usersRead && !(currentUserPermissions as any)?.usersFullControl;
  
  const isAuthDisabled = !isSuperAdmin && (currentUserPermissions as any)?.authHidden;
  const isAuthReadOnly = !isSuperAdmin && (currentUserPermissions as any)?.authRead && !(currentUserPermissions as any)?.authFullControl;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-purple-800">My Profile</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Bell className="w-4 h-4" />
              <span>{currentRequestCount} Active Requests</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>Welcome, {admin?.firstName || admin?.username}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-lg h-screen">
          <div className="p-6">
            <div className="space-y-2">
              {/* My Profile - Active */}
              <div className="bg-purple-100 border-l-4 border-purple-500 rounded-lg">
                <Link href="/my-profile">
                  <div className="flex items-center space-x-3 px-4 py-3 text-purple-700 font-medium">
                    <User className="w-5 h-5" />
                    <span>My Profile</span>
                  </div>
                </Link>
              </div>

              {/* Vets Van Management */}
              <Link href="/admin-dashboard">
                <div className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Truck className="w-5 h-5" />
                  <span>Vets Van Management</span>
                </div>
              </Link>

              {/* Sales Reports */}
              <Link href="/sales-reports">
                <div className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <BarChart3 className="w-5 h-5" />
                  <span>Sales Reports</span>
                </div>
              </Link>

              {/* Administration Section */}
              <div className="pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Administration</h3>
                
                {/* Users */}
                <div className={`${
                  isUsersDisabled 
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                    : ''
                }`}>
                  {isUsersDisabled ? (
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-lg">
                      <Users className="w-5 h-5" />
                      <span>Users</span>
                    </div>
                  ) : (
                    <Link href="/administration/users">
                      <div className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Users className="w-5 h-5" />
                        <span>Users</span>
                        {isUsersReadOnly && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Read Only</span>}
                      </div>
                    </Link>
                  )}
                </div>

                {/* Authorization */}
                <div className={`${
                  isAuthDisabled 
                    ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                    : ''
                }`}>
                  {isAuthDisabled ? (
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-lg">
                      <Shield className="w-5 h-5" />
                      <span>Authorization</span>
                    </div>
                  ) : (
                    <Link href="/administration/authorization">
                      <div className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                        <Shield className="w-5 h-5" />
                        <span>Authorization</span>
                        {isAuthReadOnly && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Read Only</span>}
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-6 h-6 text-purple-600" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <User className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                      Profile Page Coming Soon
                    </h2>
                    <p className="text-gray-600">
                      This page will contain user profile management features.
                    </p>
                  </div>
                  
                  {/* Current User Info */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Current Session</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Username</label>
                          <p className="text-gray-800">{admin?.username || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Full Name</label>
                          <p className="text-gray-800">{admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}` : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p className="text-gray-800">{admin?.email || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Account Type</label>
                          <p className="text-gray-800">{isSuperAdmin ? 'Super Administrator' : 'Administrator'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}