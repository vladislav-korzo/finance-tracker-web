import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
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
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';
import { useAuthStore } from '@/shared/store/authStore';

import { loginSchema, type LoginFormValues } from './LoginScreen.formConfig';

/**
 * Email/password sign-in. Mirrors the web LoginScreen copy and validation, but
 * is self-contained (form state + submit live here) since the expo-router route
 * file is a thin wrapper. On success the root gate (app/_layout) redirects into
 * the app once `user` lands, so there is no manual navigation here.
 */
export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const theme = useResolvedTheme();
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await signIn(values.email, values.password);
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const rootError = form.formState.errors.root?.message;
  const submitting = form.formState.isSubmitting;

  return (
    <AuthLayout
      title="С возвращением"
      subtitle="Войдите по электронной почте и паролю."
      footer={
        <>
          <Text className="text-[15px] text-muted-foreground">Нет аккаунта?</Text>
          <Link href="/register" replace asChild>
            <Text weight="semibold" className="text-[15px] text-foreground">
              Зарегистрироваться
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
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                    right={
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
                    }
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
            {submitting ? 'Вход…' : 'Войти'}
          </Button>
        </View>
      </Form>
    </AuthLayout>
  );
}
