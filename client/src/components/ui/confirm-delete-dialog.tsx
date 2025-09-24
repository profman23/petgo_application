import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  language: 'ar' | 'en';
  title?: string;
  description?: string;
  confirmText?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({ 
  isOpen, 
  onCancel, 
  onConfirm, 
  language,
  title,
  description,
  confirmText,
  isLoading = false
}: ConfirmDeleteDialogProps) {
  const defaultTitle = language === 'ar' 
    ? 'تحذير - حذف الحساب' 
    : 'Warning - Delete Account';
    
  const defaultDescription = language === 'ar'
    ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً. هل أنت متأكد من أنك تريد حذف حسابك؟'
    : 'This action cannot be undone. All your data will be permanently deleted. Are you sure you want to delete your account?';

  const cancelText = language === 'ar' ? 'إلغاء' : 'Cancel';
  const deleteText = confirmText || (language === 'ar' ? 'حذف الحساب' : 'Delete Account');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md" dir="ltr">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 text-left">
            <AlertTriangle className="h-5 w-5" />
            {title || defaultTitle}
          </DialogTitle>
          <DialogDescription className="text-left">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row justify-start gap-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="min-w-[100px]"
            data-testid="button-cancel-delete"
          >
            {cancelText}
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
            data-testid="button-confirm-delete"
          >
            {isLoading ? (language === 'ar' ? 'جاري الحذف...' : 'Deleting...') : deleteText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}