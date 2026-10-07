import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvatarUploader } from '@/components/AvatarUploader';
import { ACCOUNT_CURRENCY_OPTIONS } from '@/shared/constants/accountCurrencies';
import { celebrate, toast } from '@/shared/lib/feedback';
import { cn } from '@/shared/lib/utils';
import { getProfile } from '@/shared/lib/profile';
import { useAccountStore } from '@/shared/store/accountStore';
import { useAuthStore } from '@/shared/store/authStore';
import { useSettingsStore } from '@/shared/store/settingsStore';

export function OnboardingScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const setDefaultCurrency = useSettingsStore((s) => s.setDefaultCurrency);
  const { accounts, fetchAccounts, createAccount } = useAccountStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currencies, setCurrencies] = useState<string[]>(['BYN']);
  const [primary, setPrimary] = useState('BYN');
  const [walletName, setWalletName] = useState('Основной счёт');
  const [walletCurrency, setWalletCurrency] = useState('BYN');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  const hasAccounts = accounts.length > 0;
  const steps = useMemo(
    () => ['profile', 'currencies', ...(hasAccounts ? [] : ['wallet'])],
    [hasAccounts]
  );
  const isLast = step === steps.length - 1;
  const avatarInitial = firstName.trim().charAt(0).toUpperCase();

  // Already onboarded → straight to the app.
  if (initialized && user && getProfile(user).onboarded) {
    return <Navigate to="/" replace />;
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
    (steps[step] === 'profile' && firstName.trim().length > 0) ||
    (steps[step] === 'currencies' && currencies.length > 0) ||
    steps[step] === 'wallet';

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
      navigate('/', { replace: true });
    } catch (e) {
      toast.error('Не удалось сохранить', { description: (e as Error).message });
      setSubmitting(false);
    }
  };

  const skip = async () => {
    setSubmitting(true);
    try {
      await updateProfile({ onboarded: true });
      navigate('/', { replace: true });
    } catch {
      navigate('/', { replace: true });
    }
  };

  const next = () => {
    if (isLast) void finish();
    else setStep((s) => s + 1);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary-gradient shadow-glow">
              <Wallet className="size-[18px] text-primary-foreground" strokeWidth={2.4} />
            </div>
            <span className="text-base font-extrabold tracking-tight text-foreground">Учёт</span>
          </div>
          <button
            type="button"
            onClick={() => void skip()}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Пропустить
          </button>
        </div>

        {/* Progress segments */}
        <div className="mb-6 flex gap-2">
          {steps.map((_, i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-card sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={steps[step]}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {steps[step] === 'profile' ? (
                <div className="space-y-5">
                  <Header
                    icon={Sparkles}
                    title="Давайте познакомимся"
                    subtitle="Как к вам обращаться и какой аватар выбрать?"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <AvatarUploader
                      url={avatarUrl}
                      fallback={avatarInitial}
                      onChange={setAvatarUrl}
                      size={88}
                    />
                    <p className="text-xs text-muted-foreground">
                      {avatarUrl ? 'Нажмите, чтобы заменить' : 'Загрузите фото профиля'}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Имя</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Влад"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Фамилия
                      </label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Необязательно"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {steps[step] === 'currencies' ? (
                <div className="space-y-5">
                  <Header
                    icon={Wallet}
                    title="Какими валютами пользуетесь?"
                    subtitle="Выберите валюты и отметьте основную — в ней будет сводка."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {ACCOUNT_CURRENCY_OPTIONS.map((opt) => {
                      const active = currencies.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleCurrency(opt.value)}
                          className={cn(
                            'flex items-center justify-between rounded-xl border p-4 text-left transition-all',
                            active
                              ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                              : 'border-border/70 bg-surface-2 hover:border-muted-foreground/40'
                          )}
                        >
                          <div>
                            <p className="font-semibold text-foreground">{opt.value}</p>
                            <p className="text-xs text-muted-foreground">{opt.label}</p>
                          </div>
                          {active ? (
                            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check className="size-3.5" strokeWidth={3} />
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Основная валюта</p>
                    <div className="flex flex-wrap gap-2">
                      {currencies.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => choosePrimary(code)}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
                            primary === code
                              ? 'bg-primary text-primary-foreground shadow-glow'
                              : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {steps[step] === 'wallet' ? (
                <div className="space-y-5">
                  <Header
                    icon={Wallet}
                    title="Создайте первый кошелёк"
                    subtitle="Счёт, к которому будут привязаны операции. Это можно изменить позже."
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Название
                    </label>
                    <Input
                      value={walletName}
                      onChange={(e) => setWalletName(e.target.value)}
                      placeholder="Основной счёт"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Валюта</p>
                    <div className="flex flex-wrap gap-2">
                      {currencies.map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => setWalletCurrency(code)}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-sm font-semibold transition-all',
                            walletCurrency === code
                              ? 'bg-primary text-primary-foreground shadow-glow'
                              : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-between gap-3">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} className="gap-1.5">
                <ArrowLeft className="size-4" />
                Назад
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" onClick={next} disabled={!canNext || submitting} className="gap-1.5">
              {isLast ? (submitting ? 'Сохранение…' : 'Поехали') : 'Далее'}
              {!isLast ? <ArrowRight className="size-4" /> : null}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Wallet;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
