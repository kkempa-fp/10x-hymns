import { createPortal } from "react-dom";
import { useEffect, useState, type FC, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type AuthModalTab = "login" | "register";

interface AuthModalProps {
  activeTab: AuthModalTab;
  isOpen: boolean;
  loginForm: ReactNode;
  onClose: () => void;
  onTabChange: (tab: AuthModalTab) => void;
  registerForm: ReactNode;
}

const AuthModal: FC<AuthModalProps> = ({ activeTab, isOpen, loginForm, onClose, onTabChange, registerForm }) => {
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

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Zaloguj się lub zarejestruj</h2>
          <Button type="button" variant="ghost" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant={activeTab === "login" ? "default" : "outline"}
            onClick={() => onTabChange("login")}
            aria-pressed={activeTab === "login"}
            className="flex-1"
          >
            Logowanie
          </Button>
          <Button
            type="button"
            variant={activeTab === "register" ? "default" : "outline"}
            onClick={() => onTabChange("register")}
            aria-pressed={activeTab === "register"}
            className="flex-1"
          >
            Rejestracja
          </Button>
        </div>

        <div className="mt-6">{activeTab === "login" ? loginForm : registerForm}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AuthModal;
