import { useEffect, type FC } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages } from "@/lib/messages";
import type { AuthFormValues } from "@/types";

const passwordSchema = z
  .string()
  .min(8, messages.auth.validation.passwordMin)
  .regex(/[A-Z]/, messages.auth.validation.passwordUppercase)
  .regex(/[0-9]/, messages.auth.validation.passwordDigit);

const registerFormSchema = z
  .object({
    email: z.string().min(1, messages.auth.validation.emailRequired).email(messages.auth.validation.emailInvalid),
    password: passwordSchema,
    confirmPassword: z.string().min(1, messages.auth.validation.confirmPasswordRequired),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: messages.auth.validation.passwordsMismatch,
        path: ["confirmPassword"],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

interface RegisterFormProps {
  error: string | null;
  loading: boolean;
  onSubmit: (values: AuthFormValues) => Promise<boolean>;
}

const RegisterForm: FC<RegisterFormProps> = ({ error, loading, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
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
  };

  const isBusy = loading || isSubmitting;
  const rootError = errors.root?.message;

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(submitHandler)} noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-email">{messages.auth.register.emailLabel}</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder={messages.common.placeholders.email}
          {...register("email")}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="register-password">{messages.auth.register.passwordLabel}</Label>
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
        <Label htmlFor="register-password-confirm">{messages.auth.register.confirmPasswordLabel}</Label>
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

      <Button type="submit" disabled={isBusy} className="w-full">
        {isBusy ? messages.common.loading.registering : messages.auth.register.submit}
      </Button>

      <p className="text-sm text-muted-foreground">{messages.auth.register.footer}</p>
    </form>
  );
};

export default RegisterForm;
