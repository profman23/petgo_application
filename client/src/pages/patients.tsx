import { useState, useRef } from 'react';
import { useTranslation, getDirection, getTextAlign } from '@/lib/i18n';
import { ArrowLeft, ArrowRight, Plus, PawPrint, User, Calendar, Heart } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import logoPath from '@assets/10773561_1751295833176.png';

export default function Patients() {
  const { t, language } = useTranslation();
  const direction = getDirection(language);
  const textAlign = getTextAlign(language);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Form states for adding new patient
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientType, setPatientType] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientCondition, setPatientCondition] = useState('');

  // Arrow icon based on language direction
  const ArrowIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Fetch user's patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['/api/patients'],
    retry: false,
  });

  // Add patient mutation
  const addPatientMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/patients', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      showToast(t('success'), 'success');
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      setShowAddPatientDialog(false);
      setPatientName('');
      setPatientType('');
      setPatientAge('');
      setPatientCondition('');
    },
    onError: (error: Error) => {
      showToast(error.message || t('error'), 'error');
    },
  });

  const handleBack = () => {
    setLocation('/account');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    console.log(`${type}: ${message}`);
  };

  const handleAddPatient = () => {
    if (!patientName || !patientType) {
      showToast('اسم المريض ونوعه مطلوبان', 'error');
      return;
    }

    addPatientMutation.mutate({
      name: patientName,
      type: patientType,
      age: patientAge,
      condition: patientCondition,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white" dir={direction}>
      {/* Header with Logo and Back Button */}
      <div className="bg-white shadow-sm border-b border-purple-100 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-lg transition-colors"
          >
            <ArrowIcon size={16} />
            <span className="text-sm font-medium">{t('back')}</span>
          </button>
          
          <img 
            src={logoPath} 
            alt="VETS VAN Logo" 
            className="h-8 w-auto"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between" style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
            <div className="flex items-center gap-3" style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <PawPrint size={24} className="text-purple-600" />
              </div>
              <div style={{ textAlign }}>
                <h1 className="text-xl font-bold text-gray-800">{t('patients')}</h1>
                <p className="text-purple-600 text-sm">{t('myPatients')}</p>
              </div>
            </div>
            
            {/* Add Patient Button */}
            <button
              onClick={() => setShowAddPatientDialog(true)}
              className="w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-purple-600">{t('loading')}</div>
            </div>
          ) : patients.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6 text-center">
              <PawPrint size={48} className="text-purple-300 mx-auto mb-4" />
              <p className="text-gray-600">{t('noPatients')}</p>
            </div>
          ) : (
            patients.map((patient: any) => (
              <div key={patient.id} className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-4">
                <div className="flex items-center gap-3" style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Heart size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1" style={{ textAlign }}>
                    <h3 className="font-semibold text-gray-800">{patient.name}</h3>
                    <p className="text-sm text-purple-600">{patient.type}</p>
                    {patient.age && <p className="text-sm text-gray-500">{patient.age} سنة</p>}
                    {patient.condition && <p className="text-sm text-gray-500">{patient.condition}</p>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Patient Dialog */}
        {showAddPatientDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir={direction}>
            <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800" style={{ textAlign }}>
                {t('addPatient')}
              </h3>

              {/* Patient Name */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
                  {t('patientName')}
                </label>
                <div className="relative">
                  <User className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                    placeholder={t('patientName')}
                  />
                </div>
              </div>

              {/* Patient Type */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
                  {t('patientType')}
                </label>
                <div className="relative">
                  <PawPrint className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                  <input
                    type="text"
                    value={patientType}
                    onChange={(e) => setPatientType(e.target.value)}
                    className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                    placeholder={t('patientType')}
                  />
                </div>
              </div>

              {/* Patient Age */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
                  {t('patientAge')}
                </label>
                <div className="relative">
                  <Calendar className="absolute top-3 w-4 h-4 text-gray-400" style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className={`w-full h-10 rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 ${direction === 'rtl' ? 'pr-10 text-right' : 'pl-10'}`}
                    placeholder={t('patientAge')}
                  />
                </div>
              </div>

              {/* Patient Condition */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700" style={{ textAlign }}>
                  {t('patientCondition')}
                </label>
                <textarea
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value)}
                  rows={3}
                  className={`w-full rounded-md border border-purple-200 bg-white px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                  placeholder={t('patientCondition')}
                />
              </div>

              {/* Dialog Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddPatientDialog(false)}
                  className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2 rounded-md transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleAddPatient}
                  disabled={addPatientMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-2 rounded-md transition-colors"
                >
                  {addPatientMutation.isPending ? t('loading') : t('addPatient')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}