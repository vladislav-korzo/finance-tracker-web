import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';

import { AuthLayout } from '@components/AuthLayout';
import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Text } from '@components/ui/text';
import { toast } from '@/shared/lib/feedback';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';
import { useAuthStore } from '@/shared/store/authStore';

import { registerSchema, type RegisterFormValues } from './RegisterScreen.formConfig';

/**
 * Account creation. Mirrors the web RegisterScreen (email + password + confirm)
 * and its validation. On success we route back to /login — Supabase may require
 * email confirmation, so we don't assume an immediate session.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const theme = useResolvedTheme();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirm: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signUp(values.email, values.password);
      toast.success('Аккаунт создан', { description: 'Войдите, чтобы продолжить.' });
      router.replace('/login');
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const rootError = form.formState.errors.root?.message;
  const submitting = form.formState.isSubmitting;

  const eyeToggle = (
    <Pressable
      onPress={() => setShowPassword((v) => !v)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
    >
      {showPassword ? (
        <EyeOff size={18} color={tokenColor('muted-foreground', theme)} />
      ) : (
        <Eye size={18} color={tokenColor('muted-foreground', theme)} />
      )}
    </Pressable>
  );

  return (
    <AuthLayout
      title="Создать аккаунт"
      subtitle="Начните вести финансы за пару минут."
      footer={
        <>
          <Text className="text-[15px] text-muted-foreground">Уже есть аккаунт?</Text>
          <Link href="/login" replace asChild>
            <Text weight="semibold" className="text-[15px] text-foreground">
              Войти
            </Text>
          </Link>
        </>
      }
    >
      <Form {...form}>
        <View className="gap-4">
          <FormField
            control={form.control}
            name="email"
            render={() => (
              <FormItem>
                <FormLabel>Электронная почта</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={() => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Минимум 6 символов"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    right={eyeToggle}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={() => (
              <FormItem>
                <FormLabel>Подтверждение пароля</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {rootError ? (
            <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
              <Text weight="medium" className="text-sm text-destructive">
                {rootError}
              </Text>
            </View>
          ) : null}
          <Button size="lg" className="mt-1 w-full" onPress={onSubmit} loading={submitting}>
            {submitting ? 'Создание…' : 'Создать аккаунт'}
          </Button>
        </View>
      </Form>
    </AuthLayout>
  );
}
