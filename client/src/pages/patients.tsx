import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation, getDirection } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, Heart, Calendar, PawPrint, Cat, Dog, Bird, Bell } from 'lucide-react';
import { PatientForm } from '@/components/patient-form';
import { EditPatientForm } from '@/components/edit-patient-form';
import { useLocation } from 'wouter';
import logoImage from "@assets/IMG-20250415-WA0047_1750708739645.jpg";
import { FixedFooter } from '@/components/fixed-footer';
import { LanguageSelector } from '@/components/language-selector';

interface Patient {
  id: number;
  name: string;
  type: 'Cat' | 'Dog' | 'Bird';
  ageYear?: number;
  ageMonth?: number;
  ageDay?: number;
  photo?: string;
  createdAt: string;
}

const animalIcons = {
  Cat: Cat,
  Dog: Dog,
  Bird: Bird,
};

export default function Patients() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
  });

  const handleBack = () => {
    if (showAddForm) {
      setShowAddForm(false);
    } else if (selectedPatient) {
      setSelectedPatient(null);
    } else {
      setLocation('/account');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLocation('/login');
  };

  const handleAddPatient = () => {
    setShowAddForm(true);
  };

  const handlePatientAdded = () => {
    setShowAddForm(false);
  };

  const handlePatientEdit = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handlePatientUpdated = () => {
    setSelectedPatient(null);
  };

  const formatAge = (patient: Patient) => {
    const parts = [];
    if (patient.ageYear) parts.push(`${patient.ageYear} ${t('year')}`);
    if (patient.ageMonth) parts.push(`${patient.ageMonth} ${t('month')}`);
    if (patient.ageDay) parts.push(`${patient.ageDay} ${t('day')}`);
    return parts.join(', ') || t('noAge');
  };

  const isRTL = getDirection(language) === 'rtl';

  if (showAddForm) {
    return (
      <PatientForm
        onBack={handleBack}
        onSuccess={handlePatientAdded}
      />
    );
  }

  if (selectedPatient) {
    return (
      <EditPatientForm
        patient={selectedPatient}
        onBack={handleBack}
        onSuccess={handlePatientUpdated}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir={getDirection(language)}>
      <div className="max-w-md mx-auto bg-white shadow-sm overflow-hidden">
        {/* Header - Exact same design as home.tsx */}
        <div className="bg-white text-gray-800 px-3 py-2 h-10 border-b shadow-sm">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-2">
              <div className="h-8 bg-white rounded-lg border-2 border-purple-600 px-2 py-1 shadow-sm hover:shadow-md transition-all duration-300">
                <img 
                  src={logoImage} 
                  alt="VETS VAN Logo" 
                  className="h-full w-auto object-contain"
                  style={{ 
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    maxWidth: '120px'
                  }}
                />
              </div>
              <div className="text-lg font-bold text-gray-800">
                {language === 'ar' ? 'حيواناتي الأليفة' : 'My Pets'}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              <Bell className="w-5 h-5 cursor-pointer text-gray-600 hover:text-gray-800" />
              <Button
                onClick={handleAddPatient}
                className="bg-purple-600 hover:bg-purple-600 text-white rounded-full p-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="bg-purple-600 text-white hover:bg-purple-600 px-3 py-1 h-8 rounded-md font-medium transition-colors"
              >
                {language === 'ar' ? 'خروج' : 'Logout'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-20">

        {/* Patients List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-2 border-purple-600 animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : patients.length === 0 ? (
            <Card className="border-2 border-purple-600 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center">
                    <PawPrint className="h-12 w-12 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {t('noPatients')}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {t('addFirstPatient')}
                  </p>
                  <Button
                    onClick={handleAddPatient}
                    className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    {t('addPatient')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((patient) => {
                const IconComponent = animalIcons[patient.type];
                return (
                  <Card 
                    key={patient.id} 
                    className="border-2 border-purple-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:border-purple-600 cursor-pointer"
                    onClick={() => handlePatientEdit(patient)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        
                        {/* Patient Photo or Icon */}
                        <div className="flex-shrink-0">
                          {patient.photo ? (
                            <img
                              src={patient.photo}
                              alt={patient.name}
                              className="w-16 h-16 object-cover rounded-full border-2 border-purple-600"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-600">
                              <IconComponent className="h-8 w-8 text-purple-600" />
                            </div>
                          )}
                        </div>

                        {/* Patient Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">
                            {patient.name}
                          </h3>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <IconComponent className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-gray-600">
                              {t(patient.type.toLowerCase() as 'cat' | 'dog' | 'bird')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-gray-600">
                              {formatAge(patient)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-gray-500">
                              {new Date(patient.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Add Button for non-empty list */}
        {patients.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <Button
              onClick={handleAddPatient}
              className="bg-gradient-to-r from-purple-600 to-purple-600 hover:from-purple-600 hover:to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}
        </div>
        
        {/* Fixed Footer */}
        <FixedFooter />
      </div>
    </div>
  );
}