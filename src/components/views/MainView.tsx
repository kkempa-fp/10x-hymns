import { useCallback, useState } from "react";
import type { FC } from "react";

import type { AuthFormValues } from "@/types";
import { cn } from "@/lib/utils";

import useAuth from "../hooks/useAuth";

import AuthModal from "./AuthModal";
import Header from "./Header";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import SetsManager from "./SetsManager";
import SuggestionGenerator from "./SuggestionGenerator";

type AuthModalView = "login" | "register";

const MainView: FC = () => {
  const { error: authError, loading: authLoading, resetError, signIn, signOut, signUp, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"generator" | "sets">("generator");
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthModalView>("login");

  const handleLoginClick = useCallback(() => {
    resetError();
    setAuthModalView("login");
    setAuthModalOpen(true);
  }, [resetError]);

  const handleLogoutClick = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const closeAuthModal = useCallback(() => {
    resetError();
    setAuthModalView("login");
    setAuthModalOpen(false);
  }, [resetError]);

  const handleAuthTabChange = useCallback(
    (view: AuthModalView) => {
      resetError();
      setAuthModalView(view);
    },
    [resetError]
  );

  const handleLoginSubmit = useCallback(
    async (values: AuthFormValues) => {
      const isSuccess = await signIn(values);
      if (isSuccess) {
        setAuthModalOpen(false);
        setAuthModalView("login");
      }

      return isSuccess;
    },
    [signIn]
  );

  const handleRegisterSubmit = useCallback(
    async (values: AuthFormValues) => {
      const isSuccess = await signUp(values);
      if (isSuccess) {
        setAuthModalView("login");
        setAuthModalOpen(false);
      }

      return isSuccess;
    },
    [signUp]
  );

  return (
    <div className="surface-primary flex min-h-screen flex-col">
      <Header onLoginClick={handleLoginClick} onLogoutClick={handleLogoutClick} user={user} />
      <main className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8">
        {user ? (
          <section className="flex flex-col gap-6">
            <div className="inline-flex w-full max-w-xs items-center justify-start gap-2 rounded-[var(--md-sys-shape-corner-extra-large)] bg-accent/30 p-[var(--md-sys-spacing-4)]">
              {(
                [
                  { id: "generator", label: "Generator" },
                  { id: "sets", label: "Zestawy" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={cn(
                    "flex-1 rounded-[var(--md-sys-shape-corner-large)] px-[var(--md-sys-spacing-16)] py-[var(--md-sys-spacing-12)] text-center text-[0.9375rem] font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-[var(--md-sys-elevation-level-1)]"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={activeTab === tab.id}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === "generator" ? <SuggestionGenerator /> : <SetsManager />}
          </section>
        ) : (
          <SuggestionGenerator />
        )}
      </main>
      <AuthModal
        activeView={authModalView}
        isOpen={isAuthModalOpen}
        loginForm={<LoginForm error={authError} loading={authLoading} onSubmit={handleLoginSubmit} />}
        onClose={closeAuthModal}
        onViewChange={handleAuthTabChange}
        registerForm={<RegisterForm error={authError} loading={authLoading} onSubmit={handleRegisterSubmit} />}
      />
    </div>
  );
};

export default MainView;
