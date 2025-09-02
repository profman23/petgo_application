// This is an exact copy of admin-dashboard.tsx for the dedicated VetsVan Management route
// All functionality, permissions, design, and behavior are preserved identically

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Calendar, 
  Car, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  Edit3,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  Volume2,
  VolumeX,
  Bell,
  Plus,
  Trash2,
  Users,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO, isValid } from 'date-fns';
import { LanguageSelector } from '@/components/language-selector';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin-sidebar';

// Import the logo image
import vetsVanLogo from '@assets/Screenshot 2025-07-10 182605_1753012202060.png';

// Notification sound
const notificationSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IAAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsEJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBDKH0fLPfSsE');

// Add this interface for better type safety
interface VetsVanRequest {
  id: number;
  customerName: string;
  customerPhone: string;
  petName: string;
  petType: string;
  patientWeight?: number;
  selectedServices?: string;
  totalCost?: number;
  location: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  notes?: string;
  doctorNotes?: string;
  vetsVanId?: number;
  shiftId?: number;
  vetsVanCode?: string;
  doctorName?: string;
  scheduledDateTime?: string;
}

// Helper function to format date
const formatDate = (dateString: string) => {
  try {
    if (!dateString) return 'غير محدد';
    const date = parseISO(dateString);
    if (!isValid(date)) return 'تاريخ غير صالح';
    return format(date, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'تاريخ غير صالح';
  }
};

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'assigned': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-purple-100 text-purple-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get status text in Arabic
const getStatusText = (status: string, language: string) => {
  const statusTexts: Record<string, Record<string, string>> = {
    pending: { ar: 'في الانتظار', en: 'Pending' },
    assigned: { ar: 'تم التعيين', en: 'Assigned' },
    in_progress: { ar: 'قيد التنفيذ', en: 'In Progress' },
    completed: { ar: 'مكتمل', en: 'Completed' },
    cancelled: { ar: 'ملغي', en: 'Cancelled' }
  };
  
  return statusTexts[status]?.[language] || status;
};

// Note: getDirection and getTextAlign are imported from @/lib/i18n

export default function VetsVanManagement() {
  const [location, setLocation] = useLocation();
  const { language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Audio notifications state
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('audioNotificationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save audio preference
  useEffect(() => {
    localStorage.setItem('audioNotificationsEnabled', JSON.stringify(audioEnabled));
  }, [audioEnabled]);

  // States for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<VetsVanRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states for editing
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    petName: '',
    petType: '',
    location: '',
    notes: '',
    status: '',
    patientWeight: '',
    selectedServices: '',
    totalCost: ''
  });

  // Assignment form state
  const [assignForm, setAssignForm] = useState({
    vetsVanId: '',
    scheduledDateTime: ''
  });

  // Notification tracking
  const lastRequestCountRef = useRef<number>(0);
  const [currentRequestCount, setCurrentRequestCount] = useState<number>(0);

  // Check admin token and redirect if not authenticated
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      setLocation('/admin-login');
      return;
    }
  }, [setLocation]);

  // Fetch current user permissions
  const { data: userPermissions } = useQuery({
    queryKey: ['/api/admin/current-user-permissions'],
    staleTime: 5 * 60 * 1000,
    enabled: !!localStorage.getItem('adminToken'),
  });

  // Check if user has permission to view VetsVan management
  const canViewVetsVan = (userPermissions as any)?.username === 'admin' || !(userPermissions as any)?.vetsVanHidden;

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (userPermissions && !canViewVetsVan) {
      setLocation('/admin-home');
      toast({
        title: language === 'ar' ? 'غير مصرح' : 'Unauthorized',
        description: language === 'ar' ? 'ليس لديك صلاحية للوصول إلى إدارة العيادات المتنقلة' : 'You do not have permission to access VetsVan Management',
        variant: 'destructive',
      });
    }
  }, [userPermissions, canViewVetsVan, setLocation, language, toast]);

  // Don't render if user doesn't have permission
  if (userPermissions && !canViewVetsVan) {
    return null;
  }

  // Fetch all VetsVan requests
  const { data: allVetsVanRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['/api/admin/vetsvan-requests'],
    staleTime: 30 * 1000,
    refetchInterval: 3000,
  });

  // Fetch drivers for assignment
  const { data: drivers } = useQuery({
    queryKey: ['/api/admin/drivers'],
    staleTime: 5 * 60 * 1000,
  });

  // Monitor for new requests and play notification sound - exact same logic as other admin pages
  useEffect(() => {
    if (allVetsVanRequests && Array.isArray(allVetsVanRequests) && allVetsVanRequests.length > 0) {
      const currentCount = allVetsVanRequests.length;
      
      // Only play sound if there's an increase in count and it's not the initial load
      if (lastRequestCountRef.current > 0 && currentCount > lastRequestCountRef.current) {
        if (audioEnabled) {
          try {
            notificationSound.play().catch(e => console.log('Audio play failed:', e));
          } catch (error) {
            console.log('Audio notification error:', error);
          }
        }
        
        // Show toast notification for new request
        toast({
          title: language === 'ar' ? '🔔 طلب جديد!' : '🔔 New Request!',
          description: language === 'ar' 
            ? `تم استلام ${currentCount - lastRequestCountRef.current} طلب جديد` 
            : `${currentCount - lastRequestCountRef.current} new request(s) received`,
          duration: 5000,
        });
      }
      
      lastRequestCountRef.current = currentCount;
      setCurrentRequestCount(currentCount);
    }
  }, [allVetsVanRequests, audioEnabled, toast, language]);

  // Filter and sort requests
  const filteredRequests = (allVetsVanRequests as VetsVanRequest[] | undefined)?.filter((request: VetsVanRequest) => {
    const matchesSearch = 
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerPhone.includes(searchTerm) ||
      request.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    const matchesDate = () => {
      if (dateFilter === 'all') return true;
      const requestDate = new Date(request.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      switch (dateFilter) {
        case 'today':
          return requestDate.toDateString() === today.toDateString();
        case 'yesterday':
          return requestDate.toDateString() === yesterday.toDateString();
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return requestDate >= weekAgo;
        default:
          return true;
      }
    };
    
    return matchesSearch && matchesStatus && matchesDate();
  }) || [];

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    let aValue = a[sortBy as keyof VetsVanRequest];
    let bValue = b[sortBy as keyof VetsVanRequest];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Paginate results
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const paginatedRequests = sortedRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Update request mutation
  const updateRequestMutation = useMutation({
    mutationFn: async (data: { id: number; [key: string]: any }) => {
      const response = await fetch(`/api/admin/vetsvan-requests/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vetsvan-requests'] });
      setIsEditModalOpen(false);
      setIsAssignModalOpen(false);
      toast({
        title: language === 'ar' ? 'تم التحديث' : 'Updated Successfully',
        description: language === 'ar' ? 'تم تحديث الطلب بنجاح' : 'Request has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في تحديث الطلب' : 'Failed to update request',
        variant: 'destructive',
      });
    },
  });

  // Delete request mutation
  const deleteRequestMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/vetsvan-requests/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete request');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vetsvan-requests'] });
      setIsDeleteModalOpen(false);
      setSelectedRequest(null);
      toast({
        title: language === 'ar' ? 'تم الحذف' : 'Deleted Successfully',
        description: language === 'ar' ? 'تم حذف الطلب بنجاح' : 'Request has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حذف الطلب' : 'Failed to delete request',
        variant: 'destructive',
      });
    },
  });

  // Handle edit request
  const handleEditRequest = (request: VetsVanRequest) => {
    setSelectedRequest(request);
    setEditForm({
      customerName: request.customerName || '',
      customerPhone: request.customerPhone || '',
      petName: request.petName || '',
      petType: request.petType || '',
      location: request.location || '',
      notes: request.notes || '',
      status: request.status || '',
      patientWeight: request.patientWeight?.toString() || '',
      selectedServices: request.selectedServices || '',
      totalCost: request.totalCost?.toString() || ''
    });
    setIsEditModalOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = () => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      ...editForm,
      patientWeight: editForm.patientWeight ? parseFloat(editForm.patientWeight) : null,
      totalCost: editForm.totalCost ? parseFloat(editForm.totalCost) : null
    });
  };

  // Handle assign request
  const handleAssignRequest = (request: VetsVanRequest) => {
    setSelectedRequest(request);
    setAssignForm({
      vetsVanId: request.vetsVanId?.toString() || '',
      scheduledDateTime: request.scheduledDateTime || ''
    });
    setIsAssignModalOpen(true);
  };

  // Handle save assignment
  const handleSaveAssignment = () => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      vetsVanId: parseInt(assignForm.vetsVanId),
      scheduledDateTime: assignForm.scheduledDateTime,
      status: 'assigned'
    });
  };

  // Handle view details
  const handleViewDetails = (request: VetsVanRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  // Handle delete request
  const handleDeleteRequest = (request: VetsVanRequest) => {
    setSelectedRequest(request);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (selectedRequest) {
      deleteRequestMutation.mutate(selectedRequest.id);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredRequests.map((request: VetsVanRequest) => ({
      'ID': request.id,
      'Customer Name': request.customerName,
      'Phone': request.customerPhone,
      'Pet Name': request.petName,
      'Pet Type': request.petType,
      'Weight (kg)': request.patientWeight || '',
      'Services': request.selectedServices || '',
      'Total Cost': request.totalCost || '',
      'Location': request.location,
      'Status': getStatusText(request.status, 'en'),
      'Created': formatDate(request.createdAt),
      'Updated': formatDate(request.updatedAt),
      'VetsVan Code': request.vetsVanCode || '',
      'Doctor': request.doctorName || '',
      'Notes': request.notes || '',
      'Doctor Notes': request.doctorNotes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'VetsVan Requests');
    
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `vetsvan-requests-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div 
          className="min-h-screen bg-gray-50"
          dir={getDirection(language)}
          style={{ textAlign: getTextAlign(language) }}
        >
          {/* Full-width Header with logo and controls */}
          <div className="bg-white shadow-md border-b border-gray-200">
            <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
              {/* Logo */}
              <div className="flex-shrink-0 -ml-6">
                <img 
                  src={vetsVanLogo} 
                  alt="VETS VAN" 
                  className="h-14 w-auto object-contain"
                />
              </div>

              {/* Header Controls */}
              <div className="flex items-center gap-4">
                <LanguageSelector />
                
                {/* Audio notification toggle */}
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    audioEnabled 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={audioEnabled 
                    ? (language === 'ar' ? 'إيقاف الإشعارات الصوتية' : 'Disable audio notifications') 
                    : (language === 'ar' ? 'تفعيل الإشعارات الصوتية' : 'Enable audio notifications')
                  }
                >
                  {audioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>

                {/* Notifications counter */}
                <div className="relative">
                  <Bell className="h-6 w-6 text-purple-600" />
                  {currentRequestCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {currentRequestCount > 99 ? '99+' : currentRequestCount}
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    setLocation('/admin-login');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-6 p-6">
            {/* Page Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {language === 'ar' ? 'إدارة العيادات المتنقلة' : 'VetsVan Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {language === 'ar' 
                    ? 'إدارة جميع طلبات العيادات المتنقلة والمواعيد' 
                    : 'Manage all VetsVan requests and appointments'
                  }
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
                </Button>
                <Button
                  onClick={() => refetchRequests()}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  {language === 'ar' ? 'تحديث' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'إجمالي الطلبات' : 'Total Requests'}
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(allVetsVanRequests as VetsVanRequest[] | undefined)?.length || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'في الانتظار' : 'Pending'}
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(allVetsVanRequests as VetsVanRequest[] | undefined)?.filter((r: VetsVanRequest) => r.status === 'pending').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'مكتمل' : 'Completed'}
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(allVetsVanRequests as VetsVanRequest[] | undefined)?.filter((r: VetsVanRequest) => r.status === 'completed').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}
                  </CardTitle>
                  <Car className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(allVetsVanRequests as VetsVanRequest[] | undefined)?.filter((r: VetsVanRequest) => r.status === 'in_progress').length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder={language === 'ar' ? 'البحث...' : 'Search...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={language === 'ar' ? 'تصفية الحالة' : 'Filter Status'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</SelectItem>
                        <SelectItem value="pending">{language === 'ar' ? 'في الانتظار' : 'Pending'}</SelectItem>
                        <SelectItem value="assigned">{language === 'ar' ? 'تم التعيين' : 'Assigned'}</SelectItem>
                        <SelectItem value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
                        <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                        <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Date Filter */}
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder={language === 'ar' ? 'التاريخ' : 'Date'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === 'ar' ? 'جميع التواريخ' : 'All Dates'}</SelectItem>
                        <SelectItem value="today">{language === 'ar' ? 'اليوم' : 'Today'}</SelectItem>
                        <SelectItem value="yesterday">{language === 'ar' ? 'أمس' : 'Yesterday'}</SelectItem>
                        <SelectItem value="week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">{language === 'ar' ? 'تاريخ الإنشاء' : 'Created Date'}</SelectItem>
                        <SelectItem value="customerName">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</SelectItem>
                        <SelectItem value="status">{language === 'ar' ? 'الحالة' : 'Status'}</SelectItem>
                        <SelectItem value="totalCost">{language === 'ar' ? 'التكلفة' : 'Cost'}</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <ChevronDown className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-180" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {language === 'ar' ? 'طلبات العيادات المتنقلة' : 'VetsVan Requests'}
                  </span>
                  <Badge variant="secondary">
                    {filteredRequests.length} {language === 'ar' ? 'طلب' : 'requests'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paginatedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {language === 'ar' ? 'لا توجد طلبات متاحة' : 'No requests available'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {language === 'ar' ? 'معرف' : 'ID'}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {language === 'ar' ? 'العميل' : 'Customer'}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {language === 'ar' ? 'الحيوان الأليف' : 'Pet'}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {language === 'ar' ? 'الموقع' : 'Location'}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {language === 'ar' ? 'الحالة' : 'Status'}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {language === 'ar' ? 'التاريخ' : 'Date'}
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">
                            {language === 'ar' ? 'الإجراءات' : 'Actions'}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRequests.map((request: VetsVanRequest) => (
                          <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <span className="font-medium text-gray-900">#{request.id}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{request.customerName}</div>
                                <div className="text-sm text-gray-500">{request.customerPhone}</div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium text-gray-900">{request.petName}</div>
                                <div className="text-sm text-gray-500">
                                  {request.petType}
                                  {request.patientWeight && ` (${request.patientWeight} kg)`}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-1" />
                                {request.location}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusText(request.status, language)}
                              </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">
                              {formatDate(request.createdAt)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleViewDetails(request)}
                                  title={language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditRequest(request)}
                                  title={language === 'ar' ? 'تعديل' : 'Edit'}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleAssignRequest(request)}
                                  title={language === 'ar' ? 'تعيين عيادة' : 'Assign VetsVan'}
                                >
                                  <Car className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteRequest(request)}
                                  title={language === 'ar' ? 'حذف' : 'Delete'}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      {language === 'ar' 
                        ? `عرض ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredRequests.length)} من ${filteredRequests.length}`
                        : `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredRequests.length)} of ${filteredRequests.length}`
                      }
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {language === 'ar' ? 'السابق' : 'Previous'}
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {language === 'ar' ? 'التالي' : 'Next'}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Edit Request Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعديل الطلب' : 'Edit Request'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">{language === 'ar' ? 'اسم العميل' : 'Customer Name'}</Label>
                  <Input
                    id="customerName"
                    value={editForm.customerName}
                    onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">{language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input
                    id="customerPhone"
                    value={editForm.customerPhone}
                    onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petName">{language === 'ar' ? 'اسم الحيوان' : 'Pet Name'}</Label>
                  <Input
                    id="petName"
                    value={editForm.petName}
                    onChange={(e) => setEditForm({ ...editForm, petName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="petType">{language === 'ar' ? 'نوع الحيوان' : 'Pet Type'}</Label>
                  <Input
                    id="petType"
                    value={editForm.petType}
                    onChange={(e) => setEditForm({ ...editForm, petType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientWeight">{language === 'ar' ? 'وزن الحيوان (كيلو)' : 'Pet Weight (kg)'}</Label>
                  <Input
                    id="patientWeight"
                    type="number"
                    step="0.1"
                    value={editForm.patientWeight}
                    onChange={(e) => setEditForm({ ...editForm, patientWeight: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalCost">{language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}</Label>
                  <Input
                    id="totalCost"
                    type="number"
                    step="0.01"
                    value={editForm.totalCost}
                    onChange={(e) => setEditForm({ ...editForm, totalCost: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                  <Input
                    id="location"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="selectedServices">{language === 'ar' ? 'الخدمات المختارة' : 'Selected Services'}</Label>
                  <Textarea
                    id="selectedServices"
                    value={editForm.selectedServices}
                    onChange={(e) => setEditForm({ ...editForm, selectedServices: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">{language === 'ar' ? 'الحالة' : 'Status'}</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{language === 'ar' ? 'في الانتظار' : 'Pending'}</SelectItem>
                      <SelectItem value="assigned">{language === 'ar' ? 'تم التعيين' : 'Assigned'}</SelectItem>
                      <SelectItem value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</SelectItem>
                      <SelectItem value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
                      <SelectItem value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
                  <Textarea
                    id="notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateRequestMutation.isPending}>
                  {updateRequestMutation.isPending 
                    ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') 
                    : (language === 'ar' ? 'حفظ' : 'Save')
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Assign VetsVan Modal */}
          <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعيين عيادة متنقلة' : 'Assign VetsVan'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vetsVanId">{language === 'ar' ? 'العيادة المتنقلة' : 'VetsVan'}</Label>
                  <Select value={assignForm.vetsVanId} onValueChange={(value) => setAssignForm({ ...assignForm, vetsVanId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'ar' ? 'اختر عيادة متنقلة' : 'Select VetsVan'} />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers?.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.vetsvanCode} - {driver.vetsvanType} ({driver.firstName} {driver.lastName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledDateTime">{language === 'ar' ? 'تاريخ ووقت الموعد' : 'Scheduled Date & Time'}</Label>
                  <Input
                    id="scheduledDateTime"
                    type="datetime-local"
                    value={assignForm.scheduledDateTime}
                    onChange={(e) => setAssignForm({ ...assignForm, scheduledDateTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleSaveAssignment} disabled={updateRequestMutation.isPending}>
                  {updateRequestMutation.isPending 
                    ? (language === 'ar' ? 'جاري التعيين...' : 'Assigning...') 
                    : (language === 'ar' ? 'تعيين' : 'Assign')
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* View Details Modal */}
          <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تفاصيل الطلب' : 'Request Details'} #{selectedRequest?.id}
                </DialogTitle>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-6">
                  <Tabs defaultValue="basic">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic">{language === 'ar' ? 'البيانات الأساسية' : 'Basic Info'}</TabsTrigger>
                      <TabsTrigger value="services">{language === 'ar' ? 'الخدمات' : 'Services'}</TabsTrigger>
                      <TabsTrigger value="assignment">{language === 'ar' ? 'التعيين' : 'Assignment'}</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'اسم العميل' : 'Customer Name'}
                          </Label>
                          <p className="text-sm">{selectedRequest.customerName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                          </Label>
                          <p className="text-sm">{selectedRequest.customerPhone}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'اسم الحيوان' : 'Pet Name'}
                          </Label>
                          <p className="text-sm">{selectedRequest.petName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'نوع الحيوان' : 'Pet Type'}
                          </Label>
                          <p className="text-sm">{selectedRequest.petType}</p>
                        </div>
                        {selectedRequest.patientWeight && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              {language === 'ar' ? 'الوزن' : 'Weight'}
                            </Label>
                            <p className="text-sm">{selectedRequest.patientWeight} kg</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'الحالة' : 'Status'}
                          </Label>
                          <Badge className={getStatusColor(selectedRequest.status)}>
                            {getStatusText(selectedRequest.status, language)}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'الموقع' : 'Location'}
                          </Label>
                          <p className="text-sm">{selectedRequest.location}</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="services" className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {language === 'ar' ? 'الخدمات المختارة' : 'Selected Services'}
                        </Label>
                        <p className="text-sm whitespace-pre-wrap">{selectedRequest.selectedServices || 'N/A'}</p>
                      </div>
                      {selectedRequest.totalCost && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'التكلفة الإجمالية' : 'Total Cost'}
                          </Label>
                          <p className="text-lg font-semibold text-green-600">
                            {selectedRequest.totalCost} {language === 'ar' ? 'ر.س' : 'SAR'}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          {language === 'ar' ? 'ملاحظات العميل' : 'Customer Notes'}
                        </Label>
                        <p className="text-sm whitespace-pre-wrap">{selectedRequest.notes || 'N/A'}</p>
                      </div>
                      {selectedRequest.doctorNotes && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'ملاحظات الطبيب' : 'Doctor Notes'}
                          </Label>
                          <p className="text-sm whitespace-pre-wrap">{selectedRequest.doctorNotes}</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="assignment" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'رمز العيادة' : 'VetsVan Code'}
                          </Label>
                          <p className="text-sm">{selectedRequest.vetsVanCode || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'اسم الطبيب' : 'Doctor Name'}
                          </Label>
                          <p className="text-sm">{selectedRequest.doctorName || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'تاريخ الإنشاء' : 'Created Date'}
                          </Label>
                          <p className="text-sm">{formatDate(selectedRequest.createdAt)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                          </Label>
                          <p className="text-sm">{formatDate(selectedRequest.updatedAt)}</p>
                        </div>
                        {selectedRequest.scheduledDateTime && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              {language === 'ar' ? 'موعد الزيارة' : 'Scheduled Visit'}
                            </Label>
                            <p className="text-sm">{formatDate(selectedRequest.scheduledDateTime)}</p>
                          </div>
                        )}
                        {selectedRequest.completedAt && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              {language === 'ar' ? 'تاريخ الإكمال' : 'Completion Date'}
                            </Label>
                            <p className="text-sm">{formatDate(selectedRequest.completedAt)}</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Modal */}
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
                </DialogTitle>
              </DialogHeader>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'هل أنت متأكد من أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to delete this request? This action cannot be undone.'
                }
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteRequestMutation.isPending}
                >
                  {deleteRequestMutation.isPending 
                    ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') 
                    : (language === 'ar' ? 'حذف' : 'Delete')
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}