import { Ban, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PermissionDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function PermissionDeniedModal({ 
  isOpen, 
  onClose, 
  title = "Access Denied",
  description = "You do not have permission to access this resource."
}: PermissionDeniedModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto">
        <DialogHeader className="text-center">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <Ban className="h-8 w-8 text-red-600" />
          </div>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-6">
            {description}
          </p>
          
          <Button 
            onClick={onClose}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}