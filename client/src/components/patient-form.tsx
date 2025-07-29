import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, getDirection } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cat, Dog, Bird, ArrowLeft } from 'lucide-react';

// Patient form schema - only name and type are required
const patientFormSchema = z.object({
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

type PatientFormData = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

const animalIcons = {
  Cat: Cat,
  Dog: Dog,
  Bird: Bird,
};

export function PatientForm({ onBack, onSuccess }: PatientFormProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: '',
      type: undefined,
      gender: undefined,
      ageYear: '',
      ageMonth: '',
      ageDay: '',
    },
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return await apiRequest('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: t('success'),
        description: t('addPatient') + ' ' + t('success'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });



  const onSubmit = (data: PatientFormData) => {
    // Clean up data - convert empty strings to numbers or undefined for optional fields
    const cleanData = {
      name: data.name,
      type: data.type,
      gender: data.gender,
      ageYear: data.ageYear && data.ageYear !== '' ? data.ageYear : undefined,
      ageMonth: data.ageMonth && data.ageMonth !== '' ? data.ageMonth : undefined,
      ageDay: data.ageDay && data.ageDay !== '' ? data.ageDay : undefined,
    };
    addPatientMutation.mutate(cleanData);
  };

  const isRTL = getDirection(language) === 'rtl';

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
              <CardTitle className="text-xl">{t('patientForm')}</CardTitle>
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
                  <SelectTrigger className="border-2 border-purple-600 focus:border-purple-600 rounded-lg">
                    <SelectValue placeholder={t('selectPatientType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Cat', 'Dog', 'Bird'] as const).map((type) => {
                      const IconComponent = animalIcons[type];
                      return (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-5 w-5 text-purple-600" />
                            <span>{t(type.toLowerCase() as 'cat' | 'dog' | 'bird')}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
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
                  <SelectTrigger className="border-2 border-purple-600 focus:border-purple-600 rounded-lg">
                    <SelectValue placeholder={t('selectPatientGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">
                      <span>{t('male')}</span>
                    </SelectItem>
                    <SelectItem value="Female">
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



              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={addPatientMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-600 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {addPatientMutation.isPending ? t('loading') : t('addPatient')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}