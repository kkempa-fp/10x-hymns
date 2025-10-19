import { createPortal } from "react-dom";
import { useEffect, useState, type FC, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthModalView = "login" | "register";

interface AuthModalProps {
  activeView: AuthModalView;
  isOpen: boolean;
  loginForm: ReactNode;
  onClose: () => void;
  onViewChange: (view: AuthModalView) => void;
  registerForm: ReactNode;
}

const AuthModal: FC<AuthModalProps> = ({ activeView, isOpen, loginForm, onClose, onViewChange, registerForm }) => {
  const [mounted, setMounted] = useState(false);

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

  if (!mounted || !isOpen) {
    return null;
  }

  const currentTab = activeView;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface/70 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl rounded-[var(--md-sys-shape-corner-extra-large)] border border-border bg-background/95 p-6 shadow-[var(--md-sys-elevation-level-3)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.375rem] font-semibold leading-tight">Zaloguj się lub zarejestruj</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        <Tabs value={currentTab} onValueChange={(value) => onViewChange(value as AuthModalView)} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="login">Logowanie</TabsTrigger>
            <TabsTrigger value="register">Rejestracja</TabsTrigger>
          </TabsList>
          <TabsContent value="login">{loginForm}</TabsContent>
          <TabsContent value="register">{registerForm}</TabsContent>
        </Tabs>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AuthModal;
