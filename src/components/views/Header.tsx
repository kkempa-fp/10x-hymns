import type { FC } from "react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { messages } from "@/components/messages";
import ThemeToggle from "@/components/ui/theme-toggle";

interface HeaderProps {
  onLoginClick: () => void;
  onLogoutClick: () => void;
  user: User | null;
}

const headerLinkClass =
  "inline-flex items-center gap-1 text-[0.9375rem] font-medium text-primary transition-colors underline decoration-transparent underline-offset-4 hover:text-primary/90 hover:decoration-current focus-visible:outline-none focus-visible:[box-shadow:var(--md-sys-focus-ring)]";

const Header: FC<HeaderProps> = ({ onLoginClick, onLogoutClick, user }) => {
  return (
    <header className="surface-raised flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-[2.5rem] font-semibold leading-tight tracking-[-0.01em]">{messages.app.name}</h1>
        <p className="flex flex-col gap-1 text-[0.9375rem] text-muted-foreground">
          <span className="uppercase">{messages.app.subtitle}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground/90">
            <span>{messages.app.authorLabel}</span>
            <a href={`mailto:${messages.app.authorEmail}`} className={headerLinkClass}>
              {messages.app.authorName}
            </a>
            <span aria-hidden="true" className="text-muted-foreground/60">
              •
            </span>
            <a
              href="https://www.future-processing.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={headerLinkClass}
            >
              {messages.app.authorOrganization}
            </a>
            <span aria-hidden="true" className="text-muted-foreground/60">
              •
            </span>
            <a href="https://www.10xdevs.pl/" target="_blank" rel="noopener noreferrer" className={headerLinkClass}>
              {messages.app.partnerName}
            </a>
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user ? (
          <>
            <span className="text-[0.9375rem] text-muted-foreground">{user.email}</span>
            <Button type="button" variant="outline" onClick={onLogoutClick} data-test-id="header-logout-button">
              {messages.app.logoutButton}
            </Button>
          </>
        ) : (
          <Button type="button" variant="tonal" onClick={onLoginClick} data-test-id="header-login-button">
            {messages.app.loginButton}
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
