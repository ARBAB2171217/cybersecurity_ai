"use client";

import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Authorize Destruction Protocol?",
  description = "This action is permanent and cannot be reverted. The selected resources will be purged.",
  confirmLabel = "Confirm Action",
  cancelLabel = "Cancel",
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-xs text-muted-foreground leading-relaxed mb-6">{description}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isLoading} size="sm">
          {cancelLabel}
        </Button>
        <Button variant="destructive" onClick={onConfirm} isLoading={isLoading} size="sm">
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
export default ConfirmDialog;
