import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, File, Trash2, Eye, Download } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const translations = {
  ar: {
    uploadAttachment: 'رفع مرفق',
    selectFile: 'اختر ملف',
    description: 'وصف المرفق',
    enterDescription: 'أدخل وصف المرفق',
    upload: 'رفع',
    cancel: 'إلغاء',
    uploadSuccess: 'تم رفع المرفق بنجاح',
    uploadError: 'خطأ في رفع المرفق',
    deleteSuccess: 'تم حذف المرفق بنجاح',
    deleteError: 'خطأ في حذف المرفق',
    attachments: 'المرفقات',
    noAttachments: 'لا توجد مرفقات',
    fileName: 'اسم الملف',
    fileSize: 'حجم الملف',
    uploadedAt: 'تاريخ الرفع',
    delete: 'حذف',
    view: 'عرض',
    download: 'تحميل',
    maxFileSize: 'الحد الأقصى لحجم الملف 10 ميجابايت',
    fileTooBig: 'حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت'
  },
  en: {
    uploadAttachment: 'Upload Attachment',
    selectFile: 'Select File',
    description: 'Description',
    enterDescription: 'Enter attachment description',
    upload: 'Upload',
    cancel: 'Cancel',
    uploadSuccess: 'Attachment uploaded successfully',
    uploadError: 'Error uploading attachment',
    deleteSuccess: 'Attachment deleted successfully',
    deleteError: 'Error deleting attachment',
    attachments: 'Attachments',
    noAttachments: 'No attachments',
    fileName: 'File Name',
    fileSize: 'File Size',
    uploadedAt: 'Uploaded At',
    delete: 'Delete',
    view: 'View',
    download: 'Download',
    maxFileSize: 'Maximum file size 10MB',
    fileTooBig: 'File is too large. Maximum size is 10MB'
  }
};

interface UploadAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: number;
  petName: string;
  bookingId: number;
}

export default function UploadAttachmentModal({ 
  isOpen, 
  onClose, 
  petId, 
  petName, 
  bookingId 
}: UploadAttachmentModalProps) {
  const { language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const t = (key: keyof typeof translations.ar) => translations[language as keyof typeof translations][key];

  // Fetch existing attachments using query parameters
  const { data: attachments = [], refetch } = useQuery({
    queryKey: [`/api/pet-attachments?petId=${petId}&bookingId=${bookingId}`],
    enabled: isOpen,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (attachmentData: any) => {
      return apiRequest(`/api/pet-attachments`, {
        method: 'POST',
        body: JSON.stringify(attachmentData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      alert(t('uploadSuccess'));
      setSelectedFile(null);
      setDescription('');
      refetch();
    },
    onError: (error) => {
      console.error('Upload error:', error);
      alert(t('uploadError'));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      return apiRequest(`/api/pet-attachments/${attachmentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      alert(t('deleteSuccess'));
      refetch();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      alert(t('deleteError'));
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert(t('fileTooBig'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix to get only the base64 data
      const base64Data = base64String.split(',')[1];
      
      const attachmentData = {
        petId,
        bookingId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        fileData: base64Data, // Store only base64 data without prefix
        description: description.trim(),
      };

      uploadMutation.mutate(attachmentData);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDelete = (attachmentId: number) => {
    if (confirm('هل أنت متأكد من حذف هذا المرفق؟')) {
      deleteMutation.mutate(attachmentId);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // View file in browser (for images, PDFs)
  const handleViewFile = async (attachmentId: number) => {
    try {
      // Get current token from localStorage
      const token = localStorage.getItem('doctorToken') || localStorage.getItem('userToken');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Attempting to view file with token:', token);
      
      const response = await fetch(`/api/pet-attachments/view/${attachmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        const errorText = await response.text();
        console.error('Failed to view file:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error viewing file:', error);
    }
  };

  // Download file to device
  const handleDownloadFile = async (attachmentId: number, fileName: string) => {
    try {
      // Get current token from localStorage
      const token = localStorage.getItem('doctorToken') || localStorage.getItem('userToken');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Attempting to download file with token:', token);
      
      const response = await fetch(`/api/pet-attachments/download/${attachmentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const errorText = await response.text();
        console.error('Failed to download file:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {t('uploadAttachment')} - {petName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          
          {/* Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">{t('uploadAttachment')}</h3>
            
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('selectFile')}
              </label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.txt"
                className="mb-2"
              />
              <p className="text-xs text-gray-500">{t('maxFileSize')}</p>
              {selectedFile && (
                <div className="mt-2 p-2 bg-gray-50 rounded flex items-center">
                  <File className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm text-gray-700">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')}
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('enterDescription')}
                rows={3}
              />
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !description.trim() || uploadMutation.isPending}
              className="bg-purple-600 hover:bg-purple-600 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? 'جاري الرفع...' : t('upload')}
            </Button>
          </div>

          {/* Existing Attachments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">{t('attachments')}</h3>
            
            {attachments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">{t('noAttachments')}</p>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        <File className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <p className="font-semibold text-gray-900">{attachment.fileName}</p>
                        <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(attachment.fileSize)} • {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      {/* View button */}
                      <Button
                        onClick={() => handleViewFile(attachment.id)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-2 text-sm font-medium"
                        title={t('view')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('view')}
                      </Button>
                      
                      {/* Download button */}
                      <Button
                        onClick={() => handleDownloadFile(attachment.id, attachment.fileName)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 border-green-300 bg-green-50 hover:bg-green-100 px-3 py-2 text-sm font-medium"
                        title={t('download')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t('download')}
                      </Button>
                      
                      {/* Delete button */}
                      <Button
                        onClick={() => handleDelete(attachment.id)}
                        disabled={deleteMutation.isPending}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-red-300 bg-red-50 hover:bg-red-100 px-3 py-2 text-sm font-medium"
                        title={t('delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t bg-gray-50">
          <Button
            onClick={onClose}
            variant="outline"
          >
            {t('cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}