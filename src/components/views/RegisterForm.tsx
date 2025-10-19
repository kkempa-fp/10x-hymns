import { useEffect, useState, type FC } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegisterFormSchema, type AuthFormValues, type RegisterFormValues } from "@/types";

interface RegisterFormProps {
  error: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<boolean>;
}

const RegisterForm: FC<RegisterFormProps> = ({ error, loading, onSubmit }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (error) {
      setError("root", { message: error });
      setIsSuccess(false);
      return;
    }

    clearErrors("root");
  }, [clearErrors, error, setError]);

  const submitHandler = async (values: RegisterFormValues) => {
    const isCompleted = await onSubmit({ email: values.email, password: values.password });
    if (!isCompleted) {
      return;
    }

    reset();
    setIsSuccess(true);
  };

  const isBusy = loading || isSubmitting;
  const rootError = errors.root?.message;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-email">Adres e-mail</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="jan.kowalski@example.com"
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-password">Hasło</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-password-confirm">Powtórz hasło</Label>
        <Input
          id="register-password-confirm"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
          aria-invalid={Boolean(errors.confirmPassword)}
        />
        {errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword.message}</p> : null}
      </div>

      {rootError ? <p className="text-sm text-destructive">{rootError}</p> : null}
      {isSuccess ? (
        <div className="rounded-[var(--md-sys-shape-corner-medium)] border border-accent/60 bg-accent/20 p-4 text-sm text-muted-foreground">
          Konto zostało utworzone i jest już aktywne. Możesz się zalogować, aby korzystać z aplikacji.
        </div>
      ) : null}

      <Button type="submit" disabled={isBusy} className="w-full">
        {isBusy ? "Rejestracja..." : "Załóż konto"}
      </Button>

      <p className="text-sm text-muted-foreground">
        Rejestracja działa natychmiast – od razu po utworzeniu konta możesz logować się i zarządzać zestawami.
      </p>
    </form>
  );
};

export default RegisterForm;
