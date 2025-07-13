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
import { Camera, Cat, Dog, Bird, ArrowLeft } from 'lucide-react';

// Patient form schema - only name and type are required
const patientFormSchema = z.object({
  name: z.string().min(2, 'Patient name is required'),
  type: z.enum(['Cat', 'Dog', 'Bird'], {
    errorMap: () => ({ message: 'Please select patient type' })
  }),
  ageYear: z.string().optional(),
  ageMonth: z.string().optional(),
  ageDay: z.string().optional(),
  photo: z.string().optional(),
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
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: '',
      type: undefined,
      ageYear: '',
      ageMonth: '',
      ageDay: '',
      photo: '',
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedPhoto(result);
        form.setValue('photo', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: PatientFormData) => {
    // Clean up data - convert empty strings to numbers or undefined for optional fields
    const cleanData = {
      name: data.name,
      type: data.type,
      ageYear: data.ageYear && data.ageYear !== '' ? Number(data.ageYear) : undefined,
      ageMonth: data.ageMonth && data.ageMonth !== '' ? Number(data.ageMonth) : undefined,
      ageDay: data.ageDay && data.ageDay !== '' ? Number(data.ageDay) : undefined,
      photo: data.photo || undefined,
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
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  {t('patientName')} <span className="text-red-500">*</span>
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
                <Label className="text-sm font-medium text-gray-700">
                  {t('patientType')} <span className="text-red-500">*</span>
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

              {/* Patient Photo */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  {t('patientPhoto')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                </Label>
                <div className="flex flex-col items-center gap-4">
                  {selectedPhoto ? (
                    <div className="relative">
                      <img
                        src={selectedPhoto}
                        alt="Patient"
                        className="w-32 h-32 object-cover rounded-full border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-600 rounded-full p-2"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <div className="text-center">
                        <Camera className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm text-purple-600">{t('uploadPhoto')}</p>
                      </div>
                    </div>
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
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