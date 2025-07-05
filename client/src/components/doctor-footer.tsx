import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Activity, User } from 'lucide-react';
import { useTranslation, useLanguage } from '@/lib/i18n';

export function DoctorFooter() {
  const [location] = useLocation();
  const t = useTranslation();
  const { language } = useLanguage();

  const navItems = [
    {
      icon: Home,
      label: language === 'ar' ? 'الرئيسية' : 'Home',
      path: '/doctor-dashboard',
      isActive: location === '/doctor-dashboard'
    },
    {
      icon: Activity,
      label: language === 'ar' ? 'النشاط' : 'Activity',
      path: '/doctor-activity',
      isActive: location === '/doctor-activity'
    },
    {
      icon: User,
      label: language === 'ar' ? 'الحساب' : 'Account',
      path: '/doctor-account',
      isActive: location === '/doctor-account'
    }
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                item.isActive
                  ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
                <IconComponent className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}