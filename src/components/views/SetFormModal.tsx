import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FC, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SetFormValues } from "@/types";

type SetFormMode = "create" | "edit";

interface SetFormModalProps {
  error: string | null;
  initialValues: SetFormValues;
  isOpen: boolean;
  loading: boolean;
  mode: SetFormMode;
  onClose: () => void;
  onSubmit: (values: SetFormValues) => Promise<boolean>;
}

const getTitle = (mode: SetFormMode) => (mode === "create" ? "Dodaj nowy zestaw" : "Edytuj zestaw");
const getSubmitLabel = (mode: SetFormMode) => (mode === "create" ? "Utwórz zestaw" : "Zapisz zmiany");

const SetFormModal: FC<SetFormModalProps> = ({ error, initialValues, isOpen, loading, mode, onClose, onSubmit }) => {
  const [mounted, setMounted] = useState(false);
  const [values, setValues] = useState<SetFormValues>(initialValues);
  const [localError, setLocalError] = useState<string | null>(null);
  const contentLength = values.content.length;
  const CONTENT_LIMIT = 2000;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

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
      return;
    }

    setValues(initialValues);
    setLocalError(null);
  }, [initialValues, isOpen]);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedName = values.name.trim();
      const trimmedContent = values.content.trim();

      if (!trimmedName) {
        setLocalError("Nazwa zestawu jest wymagana.");
        return;
      }

      setLocalError(null);

      const payload: SetFormValues = {
        name: trimmedName,
        content: trimmedContent,
      };

      const isSuccess = await onSubmit(payload);
      if (!isSuccess && !error) {
        setLocalError("Nie udało się zapisać zestawu. Spróbuj ponownie.");
      }
    },
    [error, onSubmit, values.content, values.name]
  );

  const combinedError = useMemo(() => error || localError, [error, localError]);

  if (!mounted || !isOpen) {
    return null;
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="set-form-modal-title"
    >
      <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-2xl">
        <header className="flex items-center justify-between">
          <h2 id="set-form-modal-title" className="text-lg font-semibold text-neutral-900">
            {getTitle(mode)}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Zamknij
          </Button>
        </header>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col gap-2">
            <Label htmlFor="set-name">Nazwa zestawu</Label>
            <Input
              id="set-name"
              name="name"
              placeholder="np. 29 Niedziela Zwykła (rok C)"
              autoComplete="off"
              value={values.name}
              onChange={handleChange}
              disabled={loading}
              className="font-mono"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="set-content">Opis lub spis pieśni</Label>
              <span className="text-xs text-neutral-500">
                {contentLength}/{CONTENT_LIMIT}
              </span>
            </div>
            <Textarea
              id="set-content"
              name="content"
              placeholder="np. We: Spojrzyj z nieba wysokiego (1-2)"
              value={values.content}
              onChange={handleChange}
              disabled={loading}
              className="font-mono"
              maxLength={CONTENT_LIMIT}
            />
            <p className="text-xs text-neutral-500">
              Opisz przeznaczenie zestawu lub wypisz pieśni, które powinny się w nim znaleźć.
            </p>
          </div>

          {combinedError ? <p className="text-sm text-destructive">{combinedError}</p> : null}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Anuluj
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Zapisywanie..." : getSubmitLabel(mode)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default SetFormModal;
