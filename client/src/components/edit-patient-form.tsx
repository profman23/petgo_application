import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage, useTranslation, getDirection } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Cat, Dog, Bird, ArrowLeft, Save } from 'lucide-react';
import type { Patient } from '@shared/schema';

// Edit patient form schema
const editPatientFormSchema = z.object({
  name: z.string().min(2, 'Patient name is required'),
  type: z.enum(['Cat', 'Dog', 'Bird'], {
    errorMap: () => ({ message: 'Please select patient type' })
  }),
  ageYear: z.string().optional(),
  ageMonth: z.string().optional(),
  ageDay: z.string().optional(),
  photo: z.string().optional(),
});

type EditPatientFormData = z.infer<typeof editPatientFormSchema>;

interface EditPatientFormProps {
  patient: Patient;
  onBack: () => void;
  onSuccess: () => void;
}

export function EditPatientForm({ patient, onBack, onSuccess }: EditPatientFormProps) {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(patient.photo || null);
  const isRTL = language === 'ar';
  
  const form = useForm<EditPatientFormData>({
    resolver: zodResolver(editPatientFormSchema),
    defaultValues: {
      name: patient.name,
      type: patient.type as 'Cat' | 'Dog' | 'Bird',
      ageYear: patient.ageYear?.toString() || '',
      ageMonth: patient.ageMonth?.toString() || '',
      ageDay: patient.ageDay?.toString() || '',
      photo: patient.photo || '',
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: EditPatientFormData) => {
      const cleanData = {
        name: data.name,
        type: data.type,
        ageYear: data.ageYear && data.ageYear !== '' ? Number(data.ageYear) : undefined,
        ageMonth: data.ageMonth && data.ageMonth !== '' ? Number(data.ageMonth) : undefined,
        ageDay: data.ageDay && data.ageDay !== '' ? Number(data.ageDay) : undefined,
        photo: data.photo || undefined,
      };
      await apiRequest(`/api/patients/${patient.id}`, {
        method: 'PUT',
        body: JSON.stringify(cleanData),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: t('success'),
        description: language === 'ar' ? 'تم تحديث بيانات المريض بنجاح' : 'Patient updated successfully',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message || (language === 'ar' ? 'فشل في تحديث المريض' : 'Failed to update patient'),
        variant: 'destructive',
      });
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast({
          title: t('error'),
          description: language === 'ar' ? 'حجم الملف كبير جداً (الحد الأقصى 50MB)' : 'File too large (max 50MB)',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedPhoto(result);
        form.setValue('photo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: EditPatientFormData) => {
    updatePatientMutation.mutate(data);
  };

  const getAnimalIcon = (type: string) => {
    switch (type) {
      case 'Cat':
        return <Cat className="h-5 w-5" />;
      case 'Dog':
        return <Dog className="h-5 w-5" />;
      case 'Bird':
        return <Bird className="h-5 w-5" />;
      default:
        return <Dog className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir={getDirection(language)}>
      <div className="max-w-lg mx-auto">
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-purple-500 p-2"
              >
                <ArrowLeft className="h-5 w-5" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
              </Button>
              <CardTitle className="text-xl">
                {language === 'ar' ? 'تعديل بيانات المريض' : 'Edit Patient'}
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Patient Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  {t('patientName')} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  className="border-2 border-purple-200 focus:border-purple-500 rounded-lg"
                  placeholder={t('patientName')}
                  autoFocus
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Patient Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t('patientType')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => form.setValue('type', value as 'Cat' | 'Dog' | 'Bird')}
                  defaultValue={form.watch('type')}
                >
                  <SelectTrigger className="border-2 border-purple-200 focus:border-purple-500 rounded-lg">
                    <SelectValue placeholder={t('selectPatientType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cat">
                      <div className="flex items-center gap-2">
                        <Cat className="h-4 w-4" />
                        <span>{language === 'ar' ? 'قطة' : 'Cat'}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Dog">
                      <div className="flex items-center gap-2">
                        <Dog className="h-4 w-4" />
                        <span>{language === 'ar' ? 'كلب' : 'Dog'}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Bird">
                      <div className="flex items-center gap-2">
                        <Bird className="h-4 w-4" />
                        <span>{language === 'ar' ? 'طائر' : 'Bird'}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-red-500 text-sm">{form.formState.errors.type.message}</p>
                )}
              </div>

              {/* Patient Age */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t('patientAge')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="ageYear" className="text-xs text-gray-500">
                      {t('year')}
                    </Label>
                    <Input
                      id="ageYear"
                      type="number"
                      min="0"
                      max="50"
                      {...form.register('ageYear')}
                      className="border-2 border-purple-200 focus:border-purple-500 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageMonth" className="text-xs text-gray-500">
                      {t('month')}
                    </Label>
                    <Input
                      id="ageMonth"
                      type="number"
                      min="0"
                      max="11"
                      {...form.register('ageMonth')}
                      className="border-2 border-purple-200 focus:border-purple-500 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageDay" className="text-xs text-gray-500">
                      {t('day')}
                    </Label>
                    <Input
                      id="ageDay"
                      type="number"
                      min="0"
                      max="30"
                      {...form.register('ageDay')}
                      className="border-2 border-purple-200 focus:border-purple-500 rounded-lg"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Photo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t('patientPhoto')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                </Label>
                
                {selectedPhoto && (
                  <div className="mb-4">
                    <img
                      src={selectedPhoto}
                      alt="Patient"
                      className="w-24 h-24 object-cover rounded-lg border-2 border-purple-200"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="border-2 border-purple-200 hover:border-purple-500 text-purple-700"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'اختر صورة' : 'Choose Photo'}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1 border-gray-300 hover:border-gray-400"
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updatePatientMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updatePatientMutation.isPending ? t('loading') : t('save')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}