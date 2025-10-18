import { useState, type ChangeEvent, type FC, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormValues } from "@/types";

interface LoginFormProps {
  error: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<boolean>;
}

const INITIAL_VALUES: AuthFormValues = {
  email: "",
  password: "",
};

const LoginForm: FC<LoginFormProps> = ({ error, loading, onSubmit }) => {
  const [values, setValues] = useState<AuthFormValues>(INITIAL_VALUES);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setLocalError(null);
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.email.trim() || !values.password.trim()) {
      setLocalError("Podaj adres e-mail oraz hasło.");
      return;
    }

    setLocalError(null);
    const isSuccess = await onSubmit(values);

    if (isSuccess) {
      setValues(INITIAL_VALUES);
    }
  };

  const activeError = localError ?? error;
  const isSubmitDisabled = loading || !values.email.trim() || !values.password.trim();

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Adres e-mail</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="jan.kowalski@example.com"
          value={values.email}
          onChange={handleChange}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Hasło</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          minLength={6}
          required
        />
      </div>

      {activeError ? <p className="text-sm text-destructive">{activeError}</p> : null}

      <Button type="submit" disabled={isSubmitDisabled} className="w-full">
        {loading ? "Logowanie..." : "Zaloguj się"}
      </Button>
    </form>
  );
};

export default LoginForm;
