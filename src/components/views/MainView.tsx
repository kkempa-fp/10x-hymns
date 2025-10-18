import { useCallback, useState } from "react";
import type { FC } from "react";

import type { AuthFormValues } from "@/types";

import useAuth from "../hooks/useAuth";

import AuthModal from "./AuthModal";
import Header from "./Header";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import SetsManager from "./SetsManager";
import SuggestionGenerator from "./SuggestionGenerator";

const MainView: FC = () => {
  const { error: authError, loading: authLoading, resetError, signIn, signOut, signUp, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"generator" | "sets">("generator");
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const handleLoginClick = useCallback(() => {
    resetError();
    setAuthModalTab("login");
    setAuthModalOpen(true);
  }, [resetError]);

  const handleLogoutClick = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const closeAuthModal = useCallback(() => {
    resetError();
    setAuthModalOpen(false);
  }, [resetError]);

  const handleAuthTabChange = useCallback(
    (tab: "login" | "register") => {
      resetError();
      setAuthModalTab(tab);
    },
    [resetError]
  );

  const handleLoginSubmit = useCallback(
    async (values: AuthFormValues) => {
      const isSuccess = await signIn(values);
      if (isSuccess) {
        setAuthModalOpen(false);
      }

      return isSuccess;
    },
    [signIn]
  );

  const handleRegisterSubmit = useCallback(
    async (values: AuthFormValues) => {
      const isSuccess = await signUp(values);
      if (isSuccess) {
        setAuthModalTab("login");
        setAuthModalOpen(false);
      }

      return isSuccess;
    },
    [signUp]
  );

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <Header onLoginClick={handleLoginClick} onLogoutClick={handleLogoutClick} user={user} />
      <main className="flex flex-1 flex-col gap-6 px-4 py-6">
        {user ? (
          <section className="flex flex-col gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                className={`cursor-pointer ${activeTab === "generator" ? "font-semibold" : "text-neutral-600"}`}
                onClick={() => setActiveTab("generator")}
              >
                Generator
              </button>
              <button
                type="button"
                className={`cursor-pointer ${activeTab === "sets" ? "font-semibold" : "text-neutral-600"}`}
                onClick={() => setActiveTab("sets")}
              >
                Zestawy
              </button>
            </div>
            {activeTab === "generator" ? <SuggestionGenerator /> : <SetsManager />}
          </section>
        ) : (
          <SuggestionGenerator />
        )}
      </main>
      <AuthModal
        activeTab={authModalTab}
        isOpen={isAuthModalOpen}
        loginForm={<LoginForm error={authError} loading={authLoading} onSubmit={handleLoginSubmit} />}
        onClose={closeAuthModal}
        onTabChange={handleAuthTabChange}
        registerForm={<RegisterForm error={authError} loading={authLoading} onSubmit={handleRegisterSubmit} />}
      />
    </div>
  );
};

export default MainView;
