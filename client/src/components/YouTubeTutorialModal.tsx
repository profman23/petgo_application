import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Smartphone, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface YouTubeTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YouTubeTutorialModal({ isOpen, onClose }: YouTubeTutorialModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { language } = useLanguage();

  const translations = {
    ar: {
      title: 'تعلم كيفية تفعيل الموقع على Safari',
      description: 'هذا الفيديو يوضح كيفية تفعيل خدمات الموقع على متصفح Safari لضمان عمل التطبيق بشكل مثالي',
      dontShowAgain: 'عدم إظهار هذه الرسالة مرة أخرى',
      close: 'إغلاق',
      watchVideo: 'مشاهدة الفيديو',
      importantNote: 'ملاحظة مهمة',
      noteContent: 'يجب تفعيل خدمات الموقع للحصول على أفضل تجربة استخدام'
    },
    en: {
      title: 'Learn How to Enable Location on Safari',
      description: 'This video shows how to enable location services on Safari browser to ensure the app works perfectly',
      dontShowAgain: 'Don\'t show this message again',
      close: 'Close',
      watchVideo: 'Watch Video',
      importantNote: 'Important Note',
      noteContent: 'Location services must be enabled for the best user experience'
    }
  };

  const t = translations[language];

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideTutorialVideo', 'true');
    }
    onClose();
  };

  // Get YouTube video ID from URL
  const videoUrl = 'https://youtube.com/shorts/KczqUnPUrzI';
  const videoId = 'KczqUnPUrzI';
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className={`max-w-lg mx-auto ${language === 'ar' ? 'text-right' : 'text-left'}`}
        aria-labelledby="tutorial-dialog-title"
        aria-describedby="tutorial-dialog-description"
      >
        <DialogHeader className="relative">
          <button
            onClick={handleClose}
            className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
          
          <DialogTitle id="tutorial-dialog-title" className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Smartphone className="h-6 w-6" />
              <MapPin className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">{t.title}</span>
          </DialogTitle>
          <DialogDescription id="tutorial-dialog-description" className="sr-only">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Important Note */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800">{t.importantNote}</span>
            </div>
            <p className="text-purple-700 text-sm">{t.noteContent}</p>
          </div>

          {/* Video Description */}
          <p className="text-gray-600 text-sm leading-relaxed">
            {t.description}
          </p>

          {/* YouTube Video Embed */}
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=0&modestbranding=1&rel=0`}
              title="Safari Location Tutorial"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Don't Show Again Checkbox */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t.dontShowAgain}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => window.open(videoUrl, '_blank')}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              {t.watchVideo}
            </Button>
            
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              {t.close}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}