import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import {
  registerSchema,
  type RegisterFormValues,
} from '@/screens/RegisterScreen/RegisterScreen.formConfig';
import { RegisterScreen } from '@/screens/RegisterScreen/RegisterScreen';
import { useAuthStore } from '@/shared/store/authStore';

export function RegisterScreenContainer() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  });

  useEffect(() => {
    if (initialized && user) {
      navigate('/', { replace: true });
    }
  }, [initialized, user, navigate]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signUp(values.email, values.password);
      navigate('/login', { replace: true });
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

  return <RegisterScreen form={form} onSubmit={onSubmit} />;
}
