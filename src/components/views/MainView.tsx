import { useCallback, useEffect, useState } from "react";
import type { FC } from "react";

import type { AuthFormValues } from "@/types";
import { messages } from "@/components/messages";
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
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const handleLoginClick = useCallback(() => {
    resetError();
    setAuthInfo(null);
    setAuthModalView("login");
    setAuthModalOpen(true);
  }, [resetError]);

  const handleLogoutClick = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const closeAuthModal = useCallback(() => {
    resetError();
    setAuthInfo(null);
    setAuthModalView("login");
    setAuthModalOpen(false);
  }, [resetError]);

  const handleAuthTabChange = useCallback(
    (view: AuthModalView) => {
      resetError();
      if (view === "register") {
        setAuthInfo(null);
      }
      setAuthModalView(view);
    },
    [resetError]
  );

  const handleLoginSubmit = useCallback(
    async (values: AuthFormValues) => {
      const isSuccess = await signIn(values);
      if (isSuccess) {
        setAuthInfo(null);
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
        setAuthInfo(messages.auth.info.verificationSent);
        setAuthModalView("login");
      }

      return isSuccess;
    },
    [signUp]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const hasVerificationCode = params.has("code");

    if (!hasVerificationCode) {
      return;
    }

    if (!user) {
      resetError();
      setAuthInfo(messages.auth.info.emailConfirmed);
      setAuthModalView("login");
      setAuthModalOpen(true);
    }

    params.delete("code");
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [resetError, user]);

  return (
    <div className="surface-primary flex min-h-screen flex-col">
      <Header onLoginClick={handleLoginClick} onLogoutClick={handleLogoutClick} user={user} />
      <main className="flex flex-1 flex-col gap-8 px-4 py-8 md:px-8">
        {user ? (
          <section className="flex flex-col gap-6">
            <div className="inline-flex w-full max-w-xs items-center justify-start gap-2 rounded-[var(--md-sys-shape-corner-extra-large)] bg-accent/30 p-[var(--md-sys-spacing-4)]">
              {(
                [
                  { id: "generator", label: messages.mainView.tabs.generator },
                  { id: "sets", label: messages.mainView.tabs.sets },
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
                  data-test-id={`main-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === "generator" ? (
              <SuggestionGenerator authLoading={authLoading} user={user} />
            ) : (
              <SetsManager />
            )}
          </section>
        ) : (
          <SuggestionGenerator authLoading={authLoading} user={user} />
        )}
      </main>
      <AuthModal
        activeView={authModalView}
        isOpen={isAuthModalOpen}
        loginForm={<LoginForm error={authError} info={authInfo} loading={authLoading} onSubmit={handleLoginSubmit} />}
        onClose={closeAuthModal}
        onViewChange={handleAuthTabChange}
        registerForm={<RegisterForm error={authError} loading={authLoading} onSubmit={handleRegisterSubmit} />}
      />
    </div>
  );
};

export default MainView;
