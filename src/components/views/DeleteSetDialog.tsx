import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState, type FC } from "react";

import { Button } from "@/components/ui/button";
import { messages } from "@/components/messages";
import type { SetDto } from "@/types";

interface DeleteSetDialogProps {
  error: string | null;
  isOpen: boolean;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<boolean>;
  targetSet: SetDto | null;
}

const DeleteSetDialog: FC<DeleteSetDialogProps> = ({ error, isOpen, loading, onCancel, onConfirm, targetSet }) => {
  const [mounted, setMounted] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const setName = useMemo(() => targetSet?.name ?? messages.common.fallback.setName, [targetSet]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setLocalError(null);
      return;
    }

    setLocalError(null);
  }, [isOpen, targetSet]);

  const handleConfirm = useCallback(async () => {
    const isSuccess = await onConfirm();
    if (!isSuccess && !error) {
      setLocalError(messages.common.errors.deleteSetFailed);
    }
  }, [error, onConfirm]);

  const combinedError = error || localError;

  if (!mounted || !isOpen) {
    return null;
  }

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-set-dialog-title"
    >
      <div className="w-full max-w-lg rounded-[var(--md-sys-shape-corner-extra-large)] border border-border bg-background/95 p-6 shadow-[var(--md-sys-elevation-level-4)]">
        <h2 id="delete-set-dialog-title" className="text-[1.375rem] font-semibold leading-tight">
          {messages.deleteSetDialog.title}
        </h2>
        <p className="mt-3 text-[0.9375rem] text-muted-foreground">
          {messages.deleteSetDialog.prompt.prefix}{" "}
          <span className="font-mono font-semibold text-foreground">{setName}</span>
          {messages.deleteSetDialog.prompt.suffix}
        </p>

        {combinedError ? <p className="mt-3 text-sm text-destructive">{combinedError}</p> : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            {messages.common.buttons.cancel}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? messages.common.loading.deleting : messages.common.buttons.delete}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default DeleteSetDialog;
