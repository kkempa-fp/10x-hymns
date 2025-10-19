import { useEffect, type FC } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginFormSchema, type AuthFormValues, type LoginFormValues } from "@/types";

interface LoginFormProps {
  error: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<boolean>;
}

const LoginForm: FC<LoginFormProps> = ({ error, loading, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (error) {
      setError("root", { message: error });
      return;
    }

    clearErrors("root");
  }, [clearErrors, error, setError]);

  const submitHandler = async (values: LoginFormValues) => {
    const isSuccess = await onSubmit({ email: values.email, password: values.password });
    if (!isSuccess) {
      return;
    }

    reset();
  };

  const isBusy = loading || isSubmitting;
  const rootError = errors.root?.message;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">Adres e-mail</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="jan.kowalski@example.com"
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">Hasło</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>

      {rootError ? <p className="text-sm text-destructive">{rootError}</p> : null}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={isBusy} className="w-full">
          {isBusy ? "Logowanie..." : "Zaloguj się"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Logując się, akceptujesz regulamin i politykę prywatności aplikacji 10x Hymns.
      </p>
    </form>
  );
};

export default LoginForm;
