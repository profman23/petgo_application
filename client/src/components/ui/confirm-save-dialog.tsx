import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmSaveDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  language: string;
}

export function ConfirmSaveDialog({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  language 
}: ConfirmSaveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 text-amber-600 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <AlertTriangle className="h-5 w-5" />
            {language === 'ar' ? 'تأكيد الحفظ' : 'Confirm Save'}
          </DialogTitle>
        </DialogHeader>
        
        <div className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          <p className="text-sm text-gray-600">
            {language === 'ar' 
              ? 'هل أنت متأكد من أنك تريد حفظ هذه البيانات؟ لن تتمكن من تعديلها بعد الحفظ.'
              : 'Are you sure you want to save this data? You will not be able to modify it after saving.'
            }
          </p>
          
          <div className={`flex gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'} justify-end`}>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              data-testid="button-cancel-save"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              data-testid="button-confirm-save"
            >
              {language === 'ar' ? 'تأكيد الحفظ' : 'Confirm Save'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}