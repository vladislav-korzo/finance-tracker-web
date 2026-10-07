import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';

import { AvatarUploader } from '@components/AvatarUploader';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Heading, Text } from '@components/ui/text';
import { ACCOUNT_CURRENCY_OPTIONS } from '@/shared/constants/accountCurrencies';
import { celebrate, toast } from '@/shared/lib/feedback';
import { cn } from '@/shared/lib/utils';
import { getProfile } from '@/shared/lib/profile';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';
import { useAccountStore } from '@/shared/store/accountStore';
import { useAuthStore } from '@/shared/store/authStore';
import { useSettingsStore } from '@/shared/store/settingsStore';

type StepKey = 'profile' | 'currencies' | 'wallet';

/**
 * First-run wizard — native port of the web OnboardingScreen. Three steps
 * (profile → currencies → optional first wallet); the wallet step is skipped
 * when the account already has wallets. On finish it writes the profile
 * (marking `onboarded: true`), sets the default currency, optionally creates the
 * first wallet, then lets the root gate redirect into the app.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const setDefaultCurrency = useSettingsStore((s) => s.setDefaultCurrency);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const createAccount = useAccountStore((s) => s.createAccount);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currencies, setCurrencies] = useState<string[]>(['BYN']);
  const [primary, setPrimary] = useState('BYN');
  const [walletName, setWalletName] = useState('Основной счёт');
  const [walletCurrency, setWalletCurrency] = useState('BYN');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Lucide strokes ignore NativeWind classes; resolve glyph colours from the
  // active theme (hooks must stay unconditional — keep this above any return).
  const theme = useResolvedTheme();
  const foregroundColor = tokenColor('foreground', theme);
  const onPrimaryColor = tokenColor('primary-foreground', theme);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const hasAccounts = accounts.length > 0;
  const steps = useMemo<StepKey[]>(
    () => ['profile', 'currencies', ...(hasAccounts ? [] : (['wallet'] as StepKey[]))],
    [hasAccounts],
  );
  const current = steps[step];
  const isLast = step === steps.length - 1;
  const avatarInitial = firstName.trim().charAt(0).toUpperCase();

  // Already onboarded → the root gate sends us into the app; render nothing.
  if (user && getProfile(user).onboarded) {
    return null;
  }

  const toggleCurrency = (code: string) => {
    setCurrencies((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      const safe = next.length > 0 ? next : [code];
      if (!safe.includes(primary)) {
        setPrimary(safe[0]);
        setWalletCurrency(safe[0]);
      }
      return safe;
    });
  };

  const choosePrimary = (code: string) => {
    setPrimary(code);
    setWalletCurrency(code);
  };

  const canNext =
    (current === 'profile' && firstName.trim().length > 0) ||
    (current === 'currencies' && currencies.length > 0) ||
    current === 'wallet';

  const finish = async () => {
    setSubmitting(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl,
        currencies,
        onboarded: true,
      });
      setDefaultCurrency(primary);
      if (!hasAccounts && walletName.trim()) {
        await createAccount(walletName.trim(), walletCurrency, { silent: true });
      }
      celebrate('big');
      toast.success(`Готово${firstName ? `, ${firstName}` : ''}! Добро пожаловать 🎉`);
      // Root gate redirects to the app now that `onboarded` is true.
      router.replace('/');
    } catch (e) {
      toast.error('Не удалось сохранить', { description: (e as Error).message });
      setSubmitting(false);
    }
  };

  const skip = async () => {
    setSubmitting(true);
    try {
      await updateProfile({ onboarded: true });
    } finally {
      router.replace('/');
    }
  };

  const next = () => {
    if (isLast) void finish();
    else setStep((s) => s + 1);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <View className="flex-1 px-4 py-4">
        {/* Top bar */}
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="size-9 items-center justify-center rounded-xl bg-primary">
              <Wallet size={18} color={onPrimaryColor} strokeWidth={2.4} />
            </View>
            <Heading className="text-base text-foreground">Lumen</Heading>
          </View>
          <Pressable hitSlop={8} onPress={() => void skip()} disabled={submitting}>
            <Text weight="medium" className="text-sm text-muted-foreground">
              Пропустить
            </Text>
          </Pressable>
        </View>

        {/* Progress segments */}
        <View className="mb-6 flex-row gap-2">
          {steps.map((key, i) => (
            <View key={key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <View
                className={cn('h-full rounded-full', i <= step ? 'bg-primary' : 'bg-transparent')}
              />
            </View>
          ))}
        </View>

        {/* Step body */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="rounded-2xl border border-border bg-card p-6">
            {current === 'profile' ? (
              <View className="gap-5">
                <StepHeader
                  icon={Sparkles}
                  title="Давайте познакомимся"
                  subtitle="Как к вам обращаться и какой аватар выбрать?"
                />
                <View className="items-center gap-2">
                  <AvatarUploader
                    value={avatarUrl}
                    fallback={avatarInitial}
                    onChange={setAvatarUrl}
                    size={88}
                  />
                  <Text className="text-xs text-muted-foreground">
                    {avatarUrl ? 'Нажмите, чтобы заменить' : 'Загрузите фото профиля'}
                  </Text>
                </View>
                <View className="gap-3">
                  <View className="gap-1.5">
                    <Label>Имя</Label>
                    <Input value={firstName} onChangeText={setFirstName} placeholder="Влад" />
                  </View>
                  <View className="gap-1.5">
                    <Label>Фамилия</Label>
                    <Input
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Необязательно"
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {current === 'currencies' ? (
              <View className="gap-5">
                <StepHeader
                  icon={Wallet}
                  title="Какими валютами пользуетесь?"
                  subtitle="Выберите валюты и отметьте основную — в ней будет сводка."
                />
                <View className="flex-row flex-wrap gap-3">
                  {ACCOUNT_CURRENCY_OPTIONS.map((opt) => {
                    const active = currencies.includes(opt.value);
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => toggleCurrency(opt.value)}
                        className={cn(
                          'min-w-[47%] flex-1 flex-row items-center justify-between rounded-xl border p-4',
                          active
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-surface-2',
                        )}
                      >
                        <View className="flex-1 pr-2">
                          <Text weight="semibold" className="text-foreground">
                            {opt.value}
                          </Text>
                          <Text numberOfLines={1} className="text-xs text-muted-foreground">
                            {opt.label}
                          </Text>
                        </View>
                        {active ? (
                          <View className="size-5 items-center justify-center rounded-full bg-primary">
                            <Check size={14} color={onPrimaryColor} strokeWidth={3} />
                          </View>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
                <View className="gap-2">
                  <Text weight="medium" className="text-sm text-foreground">
                    Основная валюта
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {currencies.map((code) => (
                      <CurrencyChip
                        key={code}
                        code={code}
                        selected={primary === code}
                        onPress={() => choosePrimary(code)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {current === 'wallet' ? (
              <View className="gap-5">
                <StepHeader
                  icon={Wallet}
                  title="Создайте первый кошелёк"
                  subtitle="Счёт, к которому будут привязаны операции. Это можно изменить позже."
                />
                <View className="gap-1.5">
                  <Label>Название</Label>
                  <Input
                    value={walletName}
                    onChangeText={setWalletName}
                    placeholder="Основной счёт"
                  />
                </View>
                <View className="gap-2">
                  <Text weight="medium" className="text-sm text-foreground">
                    Валюта
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {currencies.map((code) => (
                      <CurrencyChip
                        key={code}
                        code={code}
                        selected={walletCurrency === code}
                        onPress={() => setWalletCurrency(code)}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="mt-4 flex-row items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" onPress={() => setStep((s) => s - 1)} disabled={submitting}>
              <ArrowLeft size={16} color={foregroundColor} />
              <Text weight="semibold" className="text-sm text-foreground">
                Назад
              </Text>
            </Button>
          ) : (
            <View />
          )}
          <Button onPress={next} disabled={!canNext || submitting} loading={submitting}>
            <Text weight="semibold" className="text-sm text-primary-foreground">
              {isLast ? 'Поехали' : 'Далее'}
            </Text>
            {!isLast ? <ArrowRight size={16} color={onPrimaryColor} /> : null}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StepHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  const theme = useResolvedTheme();
  return (
    <View className="items-center">
      <View className="mb-3 size-11 items-center justify-center rounded-xl bg-primary/[0.12]">
        <Icon size={20} color={tokenColor('primary', theme)} strokeWidth={2} />
      </View>
      <Heading className="text-center text-xl text-foreground">{title}</Heading>
      <Text className="mt-1.5 max-w-sm text-center text-sm text-muted-foreground">{subtitle}</Text>
    </View>
  );
}

function CurrencyChip({
  code,
  selected,
  onPress,
}: {
  code: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-lg px-3 py-1.5',
        selected ? 'bg-primary' : 'bg-surface-2',
      )}
    >
      <Text
        weight="semibold"
        className={cn('text-sm', selected ? 'text-primary-foreground' : 'text-muted-foreground')}
      >
        {code}
      </Text>
    </Pressable>
  );
}
