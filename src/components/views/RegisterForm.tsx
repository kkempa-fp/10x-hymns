import { useState, type ChangeEvent, type FC, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormValues } from "@/types";

interface RegisterFormProps {
  error: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<boolean>;
}

const INITIAL_VALUES: AuthFormValues = {
  email: "",
  password: "",
};

const RegisterForm: FC<RegisterFormProps> = ({ error, loading, onSubmit }) => {
  const [values, setValues] = useState<AuthFormValues>(INITIAL_VALUES);
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (values.password.length < 6) {
      setLocalError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    if (values.password !== confirmPassword) {
      setLocalError("Hasła muszą być identyczne.");
      return;
    }

    setLocalError(null);
    const isSuccess = await onSubmit(values);

    if (isSuccess) {
      setValues(INITIAL_VALUES);
      setConfirmPassword("");
    }
  };

  const activeError = localError ?? error;
  const isSubmitDisabled =
    loading || !values.email.trim() || !values.password.trim() || values.password !== confirmPassword;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-email">Adres e-mail</Label>
        <Input
          id="register-email"
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
        <Label htmlFor="register-password">Hasło</Label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={handleChange}
          minLength={6}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-password-confirm">Powtórz hasło</Label>
        <Input
          id="register-password-confirm"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setLocalError(null);
            setConfirmPassword(event.target.value);
          }}
          minLength={6}
          required
        />
      </div>

      {activeError ? <p className="text-sm text-destructive">{activeError}</p> : null}

      <Button type="submit" disabled={isSubmitDisabled} className="w-full">
        {loading ? "Rejestracja..." : "Załóż konto"}
      </Button>
    </form>
  );
};

export default RegisterForm;
