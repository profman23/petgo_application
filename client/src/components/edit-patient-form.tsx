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
import { Cat, Dog, Bird, ArrowLeft, Save } from 'lucide-react';
import type { Patient } from '@shared/schema';

// Edit patient form schema
const editPatientFormSchema = z.object({
  name: z.string().min(2, 'Patient name is required'),
  type: z.enum(['Cat', 'Dog', 'Bird'], {
    errorMap: () => ({ message: 'Please select patient type' })
  }),
  gender: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Please select patient gender' })
  }),
  ageYear: z.string().optional(),
  ageMonth: z.string().optional(),
  ageDay: z.string().optional(),
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

  const isRTL = language === 'ar';
  
  const form = useForm<EditPatientFormData>({
    resolver: zodResolver(editPatientFormSchema),
    defaultValues: {
      name: patient.name,
      type: patient.type as 'Cat' | 'Dog' | 'Bird',
      gender: patient.gender as 'Male' | 'Female' | undefined,
      ageYear: patient.ageYear?.toString() || '',
      ageMonth: patient.ageMonth?.toString() || '',
      ageDay: patient.ageDay?.toString() || '',
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: EditPatientFormData) => {
      const cleanData = {
        name: data.name,
        type: data.type,
        gender: data.gender,
        ageYear: data.ageYear && data.ageYear !== '' ? data.ageYear : undefined,
        ageMonth: data.ageMonth && data.ageMonth !== '' ? data.ageMonth : undefined,
        ageDay: data.ageDay && data.ageDay !== '' ? data.ageDay : undefined,
      };
      await apiRequest(`/api/patients/${patient.id}`, {
        method: 'PUT',
        body: JSON.stringify(cleanData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: t('success'),
        description: language === 'ar' ? 'تم تحديث بيانات الأليف بنجاح' : 'Patient updated successfully',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message || (language === 'ar' ? 'فشل في تحديث الأليف' : 'Failed to update patient'),
        variant: 'destructive',
      });
    },
  });



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
        <Card className="border-2 border-purple-600 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-purple-600 p-2"
              >
                <ArrowLeft className="h-5 w-5" style={{ transform: isRTL ? 'rotate(180deg)' : 'none' }} />
              </Button>
              <CardTitle className="text-xl">
                {language === 'ar' ? 'تعديل بيانات الأليف' : 'Edit Patient'}
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Patient Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700" style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {language === 'ar' ? 'اسم الأليف' : 'Patient Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  className="border-2 border-purple-600 focus:border-purple-600 rounded-lg"
                  placeholder={t('patientName')}
                  style={{
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}
                  autoFocus
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Patient Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {language === 'ar' ? 'نوع الأليف' : 'Patient Type'} <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => form.setValue('type', value as 'Cat' | 'Dog' | 'Bird')}
                  defaultValue={form.watch('type')}
                >
                  <SelectTrigger className="border-2 border-purple-600 focus:border-purple-600 rounded-lg" style={{
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}>
                    <SelectValue placeholder={t('selectPatientType')} />
                  </SelectTrigger>
                  <SelectContent style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <SelectItem value="Cat" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                      <div className="flex items-center gap-2">
                        <Cat className="h-4 w-4" />
                        <span>{language === 'ar' ? 'قطة' : 'Cat'}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Dog" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                      <div className="flex items-center gap-2">
                        <Dog className="h-4 w-4" />
                        <span>{language === 'ar' ? 'كلب' : 'Dog'}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Bird" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
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

              {/* Patient Gender */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {t('patientGender')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => form.setValue('gender', value as 'Male' | 'Female')}
                  value={form.watch('gender')}
                >
                  <SelectTrigger className="border-2 border-purple-600 focus:border-purple-600 rounded-lg" style={{
                    textAlign: language === 'ar' ? 'right' : 'left'
                  }}>
                    <SelectValue placeholder={t('selectPatientGender')} />
                  </SelectTrigger>
                  <SelectContent style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                    <SelectItem value="Male" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                      <span>{t('male')}</span>
                    </SelectItem>
                    <SelectItem value="Female" style={{ textAlign: language === 'ar' ? 'right' : 'left' }}>
                      <span>{t('female')}</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.gender && (
                  <p className="text-red-500 text-sm">{form.formState.errors.gender.message}</p>
                )}
              </div>

              {/* Patient Age */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700" style={{
                  fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
                }}>
                  {language === 'ar' ? 'عمر الأليف' : 'Patient Age'} <span className="text-gray-400 text-xs">({t('optional')})</span>
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
                      className="border rounded-lg"
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
                      className="border rounded-lg"
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
                      className="border rounded-lg"
                      placeholder="0"
                    />
                  </div>
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
                  className="flex-1 bg-purple-600 hover:bg-purple-600 text-white"
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