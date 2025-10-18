import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState, type FC } from "react";

import { Button } from "@/components/ui/button";
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
  const setName = useMemo(() => targetSet?.name ?? "wybrany zestaw", [targetSet]);

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
      setLocalError("Nie udało się usunąć zestawu. Spróbuj ponownie.");
    }
  }, [error, onConfirm]);

  const combinedError = error || localError;

  if (!mounted || !isOpen) {
    return null;
  }

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-set-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 id="delete-set-dialog-title" className="text-lg font-semibold text-neutral-900">
          Usuń zestaw
        </h2>
        <p className="mt-3 text-sm text-neutral-700">
          Czy na pewno chcesz usunąć zestaw <span className="font-mono font-semibold">{setName}</span>? Tej operacji nie
          można cofnąć.
        </p>

        {combinedError ? <p className="mt-3 text-sm text-destructive">{combinedError}</p> : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Anuluj
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Usuwanie..." : "Usuń"}
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
};

export default DeleteSetDialog;
