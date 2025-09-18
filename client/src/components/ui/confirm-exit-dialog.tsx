import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmExitDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  language: 'ar' | 'en';
  title?: string;
  description?: string;
}

export function ConfirmExitDialog({ 
  isOpen, 
  onCancel, 
  onConfirm, 
  language,
  title,
  description 
}: ConfirmExitDialogProps) {
  const defaultTitle = language === 'ar' 
    ? 'تحذير - بيانات غير محفوظة' 
    : 'Warning - Unsaved Changes';
    
  const defaultDescription = language === 'ar'
    ? 'لديك تغييرات غير محفوظة. هل أنت متأكد من أنك تريد الخروج بدون حفظ؟'
    : 'You have unsaved changes. Are you sure you want to exit without saving?';

  const cancelText = language === 'ar' ? 'إلغاء' : 'Cancel';
  const confirmText = language === 'ar' ? 'تأكيد الخروج' : 'Confirm Exit';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 text-amber-600 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <AlertTriangle className="h-5 w-5" />
            {title || defaultTitle}
          </DialogTitle>
          <DialogDescription className={`${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={`gap-2 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="min-w-[100px]"
            data-testid="button-cancel-exit"
          >
            {cancelText}
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            className="min-w-[100px]"
            data-testid="button-confirm-exit"
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}