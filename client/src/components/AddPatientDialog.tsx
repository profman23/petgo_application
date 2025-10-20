import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Cat, Dog, Bird, Calendar } from 'lucide-react';

// Patient form schema - name, type, and weight are required
const patientFormSchema = z.object({
  name: z.string().min(2, 'Patient name is required'),
  type: z.enum(['Cat', 'Dog', 'Bird'], {
    errorMap: () => ({ message: 'Please select patient type' })
  }),
  patientWeight: z.string().min(1, 'Patient weight is required').transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('Please enter a valid weight');
    }
    return num;
  }),
  ageYear: z.string().optional(),
  ageMonth: z.string().optional(),
  ageDay: z.string().optional(),
  photo: z.string().optional(),
  birthdate: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientFormSchema>;

interface AddPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number; // The customer ID to attach the pet to
  userName: string; // Customer name for display
}

const animalIcons = {
  Cat: Cat,
  Dog: Dog,
  Bird: Bird,
};

export function AddPatientDialog({ open, onOpenChange, userId, userName }: AddPatientDialogProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: '',
      type: undefined,
      patientWeight: '' as any,
      ageYear: '',
      ageMonth: '',
      ageDay: '',
      photo: '',
      birthdate: '',
    },
  });

  const addPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return await apiRequest(`/api/admin/customers/${userId}/patients`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ar' ? 'نجاح' : 'Success',
        description: language === 'ar' ? 'تم إضافة الأليف بنجاح' : 'Pet added successfully',
      });
      
      // Invalidate customer pets query
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers', userId, 'pets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/customers'] });
      
      // Reset form and close dialog
      form.reset();
      setSelectedPhoto(null);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
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

  const onSubmit = async (data: PatientFormData) => {
    const cleanData = {
      name: data.name,
      type: data.type,
      patientWeight: data.patientWeight,
      ageYear: data.ageYear && data.ageYear !== '' ? data.ageYear : undefined,
      ageMonth: data.ageMonth && data.ageMonth !== '' ? data.ageMonth : undefined,
      ageDay: data.ageDay && data.ageDay !== '' ? data.ageDay : undefined,
      photo: data.photo || undefined,
      birthdate: data.birthdate || undefined,
    };
    addPatientMutation.mutate(cleanData);
  };

  const isRTL = getDirection(language) === 'rtl';
  const textAlign = getTextAlign(language);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col" dir={getDirection(language)}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive' }}>
            {language === 'ar' ? 'إضافة حيوان أليف جديد' : 'Add New Patient'}
          </DialogTitle>
          <p className="text-sm text-gray-600" style={{ textAlign }}>
            {language === 'ar' ? 'للعميل:' : 'For customer:'} {userName}
          </p>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 pr-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
            
            {/* Pet Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'اسم الأليف' : 'Pet Name'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...form.register('name')}
                className="border-2 border-purple-600 focus:border-purple-600 rounded-lg"
                placeholder={language === 'ar' ? 'أدخل اسم الأليف' : 'Enter pet name'}
                autoFocus
                data-testid="input-pet-name"
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Pet Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'نوع الأليف' : 'Pet Type'} <span className="text-red-500">*</span>
              </Label>
              <Select
                onValueChange={(value) => form.setValue('type', value as 'Cat' | 'Dog' | 'Bird')}
                defaultValue={form.watch('type')}
              >
                <SelectTrigger className="border-2 border-purple-600 focus:border-purple-600 rounded-lg" data-testid="select-pet-type">
                  <SelectValue placeholder={language === 'ar' ? 'اختر نوع الأليف' : 'Select pet type'} />
                </SelectTrigger>
                <SelectContent>
                  {(['Cat', 'Dog', 'Bird'] as const).map((type) => {
                    const IconComponent = animalIcons[type];
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-purple-600" />
                          <span>{language === 'ar' ? (type === 'Cat' ? 'قطة' : type === 'Dog' ? 'كلب' : 'طير') : type}</span>
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

            {/* Pet Weight */}
            <div className="space-y-2">
              <Label htmlFor="patientWeight" className="text-sm font-medium text-gray-700" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'وزن الأليف' : 'Pet Weight'} <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="patientWeight"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  {...form.register('patientWeight')}
                  className="border-2 border-purple-600 focus:border-purple-600 rounded-lg pr-12"
                  placeholder={language === 'ar' ? 'أدخل الوزن (مثل: 5.3)' : 'Enter weight (e.g., 5.3)'}
                  data-testid="input-pet-weight"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-sm text-gray-500 font-medium">kg</span>
                </div>
              </div>
              {form.formState.errors.patientWeight && (
                <p className="text-red-500 text-sm">{form.formState.errors.patientWeight.message}</p>
              )}
            </div>

            {/* Pet Age */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'عمر الأليف' : 'Pet Age'} <span className="text-gray-400 text-xs">(Optional)</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="ageYear" className="text-xs text-gray-500">
                    {language === 'ar' ? 'سنة' : 'Year'}
                  </Label>
                  <Input
                    id="ageYear"
                    type="number"
                    min="0"
                    max="50"
                    {...form.register('ageYear')}
                    className="border rounded-lg"
                    placeholder="0"
                    data-testid="input-pet-age-year"
                  />
                </div>
                <div>
                  <Label htmlFor="ageMonth" className="text-xs text-gray-500">
                    {language === 'ar' ? 'شهر' : 'Month'}
                  </Label>
                  <Input
                    id="ageMonth"
                    type="number"
                    min="0"
                    max="11"
                    {...form.register('ageMonth')}
                    className="border rounded-lg"
                    placeholder="0"
                    data-testid="input-pet-age-month"
                  />
                </div>
                <div>
                  <Label htmlFor="ageDay" className="text-xs text-gray-500">
                    {language === 'ar' ? 'يوم' : 'Day'}
                  </Label>
                  <Input
                    id="ageDay"
                    type="number"
                    min="0"
                    max="30"
                    {...form.register('ageDay')}
                    className="border rounded-lg"
                    placeholder="0"
                    data-testid="input-pet-age-day"
                  />
                </div>
              </div>
            </div>

            {/* Birthdate */}
            <div className="space-y-2">
              <Label htmlFor="birthdate" className="text-sm font-medium text-gray-700" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'تاريخ الميلاد' : 'Birthdate'} <span className="text-gray-400 text-xs">(Optional)</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute top-3 w-4 h-4 text-gray-400" style={{ [isRTL ? 'right' : 'left']: '12px' }} />
                <Input
                  id="birthdate"
                  type="date"
                  {...form.register('birthdate')}
                  className={`border-2 border-purple-600 focus:border-purple-600 rounded-lg ${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
                  data-testid="input-pet-birthdate"
                />
              </div>
            </div>

            {/* Pet Photo */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700" style={{
                fontFamily: language === 'ar' ? '"Delius", cursive' : '"Comic Relief", cursive'
              }}>
                {language === 'ar' ? 'صورة الأليف' : 'Pet Photo'} <span className="text-gray-400 text-xs">(Optional)</span>
              </Label>
              <div className="flex flex-col items-center gap-4">
                {selectedPhoto ? (
                  <div className="relative">
                    <img
                      src={selectedPhoto}
                      alt="Pet"
                      className="w-32 h-32 object-cover rounded-full border-2 border-gray-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="absolute -bottom-2 -right-2 bg-purple-600 hover:bg-purple-600 rounded-full p-2"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                      data-testid="button-change-pet-photo"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    data-testid="button-upload-pet-photo"
                  >
                    <div className="text-center">
                      <Camera className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-purple-600">{language === 'ar' ? 'تحميل صورة' : 'Upload Photo'}</p>
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

            {/* Save Button */}
            <div className="pt-4 flex gap-3">
              <Button
                type="submit"
                disabled={addPatientMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-600 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                data-testid="button-save-patient"
              >
                {addPatientMutation.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={addPatientMutation.isPending}
                data-testid="button-cancel-add-patient"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
