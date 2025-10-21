import type { FC } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages } from "@/lib/messages";
import type { AuthFormValues } from "@/types";

const loginFormSchema = z
  .object({
    email: z.string().min(1, messages.auth.validation.emailRequired).email(messages.auth.validation.emailInvalid),
    password: z.string().min(1, messages.auth.validation.passwordRequired),
  })
  .strict();

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  error: string | null;
  info: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<boolean>;
}

const LoginForm: FC<LoginFormProps> = ({ error, info, loading, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const submitHandler = async (values: LoginFormValues) => {
    const isSuccess = await onSubmit({ email: values.email, password: values.password });
    if (!isSuccess) {
      return;
    }

    reset();
  };

  const isBusy = loading || isSubmitting;
  const rootError = errors.root?.message ?? error;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submitHandler)} noValidate data-test-id="login-form">
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-email">{messages.auth.login.emailLabel}</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={messages.common.placeholders.email}
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
          data-test-id="login-email-input"
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">{messages.auth.login.passwordLabel}</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
          aria-invalid={Boolean(errors.password)}
          data-test-id="login-password-input"
        />
        {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
      </div>
      {rootError ? <p className="text-sm text-destructive">{rootError}</p> : null}
      {info ? (
        <div className="rounded-[var(--md-sys-shape-corner-medium)] border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
          {info}
        </div>
      ) : null}

      <Button type="submit" disabled={isBusy} className="w-full" data-test-id="login-submit-button">
        {isBusy ? messages.common.loading.loggingIn : messages.auth.login.submit}
      </Button>

      <p className="text-sm text-muted-foreground">{messages.auth.login.disclaimer}</p>
    </form>
  );
};

export default LoginForm;
