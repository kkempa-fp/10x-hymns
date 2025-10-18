import type { FC } from "react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  onLoginClick: () => void;
  onLogoutClick: () => void;
  user: User | null;
}

const Header: FC<HeaderProps> = ({ onLoginClick, onLogoutClick, user }) => {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold">10x Hymns</h1>
        <p className="text-sm text-neutral-500">
          <span>Generator propozycji pieśni i menedżer zestawów liturgicznych</span>
          <span className="block">Autor: Krzysztof Kempa | Future Processing | 10x Devs</span>
        </p>
      </div>
      {user ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-600">{user.email}</span>
          <Button type="button" variant="outline" onClick={onLogoutClick}>
            Wyloguj się
          </Button>
        </div>
      ) : (
        <Button type="button" onClick={onLoginClick}>
          Zaloguj się
        </Button>
      )}
    </header>
  );
};

export default Header;
