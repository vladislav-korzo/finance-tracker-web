import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { loginSchema, type LoginFormValues } from '@/screens/LoginScreen/LoginScreen.formConfig';
import { LoginScreen } from '@/screens/LoginScreen/LoginScreen';
import { useAuthStore } from '@/shared/store/authStore';

export function LoginScreenContainer() {
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (initialized && user) {
      navigate('/', { replace: true });
    }
  }, [initialized, user, navigate]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn(values.email, values.password);
      navigate('/', { replace: true });
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Загрузка…</p>
      </div>
    );
  }

  return <LoginScreen form={form} onSubmit={onSubmit} />;
}
