import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type FC } from "react";

import { Button } from "@/components/ui/button";
import { messages } from "@/lib/messages";
import type { SetDto } from "@/types";

interface SetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  set: SetDto | null;
}

const SetPreviewModal: FC<SetPreviewModalProps> = ({ isOpen, onClose, set }) => {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

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

    const handlePointerDown = (event: PointerEvent) => {
      if (!contentRef.current) {
        return;
      }

      if (!contentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
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

  if (!mounted || !isOpen || !set) {
    return null;
  }

  const content = set.content?.trim();

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 px-4 py-6 backdrop-blur-sm">
      <div
        ref={contentRef}
        className="w-full max-w-3xl rounded-[var(--md-sys-shape-corner-extra-large)] border border-border bg-background/95 p-6 shadow-[var(--md-sys-elevation-level-4)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-preview-modal-title"
      >
        <header className="flex items-center justify-between">
          <h2 id="set-preview-modal-title" className="text-[1.375rem] font-semibold leading-tight">
            {set.name}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            {messages.common.buttons.close}
          </Button>
        </header>

        <div className="mt-6 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground">{messages.sets.preview.descriptionHeading}</h3>
            <div className="mt-2 max-h-[60vh] overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-foreground/80">
                {content ? content : messages.common.fallback.noDescription}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default SetPreviewModal;
