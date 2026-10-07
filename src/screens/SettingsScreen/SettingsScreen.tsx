import { Download, LogOut, Monitor, Moon, Palette, Sun, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AvatarUploader } from '@/components/AvatarUploader';
import { SectionCard } from '@/components/blocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ACCOUNT_CURRENCY_OPTIONS } from '@/shared/constants/accountCurrencies';
import { downloadCsv } from '@/shared/lib/exportCsv';
import { toast } from '@/shared/lib/feedback';
import { getProfile } from '@/shared/lib/profile';
import { cn } from '@/shared/lib/utils';
import { useAccountStore } from '@/shared/store/accountStore';
import { useAuthStore } from '@/shared/store/authStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { type ThemePreference, useThemeStore } from '@/shared/theme/themeStore';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
import { formatDate } from '@/shared/utils/format';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
];

export function SettingsScreen() {
  const navigate = useNavigate();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const defaultCurrency = useSettingsStore((s) => s.defaultCurrency);
  const setDefaultCurrency = useSettingsStore((s) => s.setDefaultCurrency);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const { transactions, fetchTransactions } = useTransactionStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    void fetchTransactions();
    void fetchAccounts();
    void fetchCategories();
  }, [fetchTransactions, fetchAccounts, fetchCategories]);

  const profile = getProfile(user);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [savingProfile, setSavingProfile] = useState(false);

  // Keep the form in sync once the user/profile resolves.
  useEffect(() => {
    const p = getProfile(user);
    setFirstName(p.firstName);
    setLastName(p.lastName);
    setAvatarUrl(p.avatarUrl);
  }, [user]);

  const avatarInitial = (firstName.trim().charAt(0) || user?.email?.charAt(0) || '').toUpperCase();
  const profileDirty =
    firstName.trim() !== profile.firstName ||
    lastName.trim() !== profile.lastName ||
    avatarUrl !== profile.avatarUrl;

  const onSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl,
      });
      toast.success('Профиль обновлён');
    } catch (e) {
      toast.error('Не удалось сохранить', { description: (e as Error).message });
    } finally {
      setSavingProfile(false);
    }
  };

  const onExport = () => {
    if (transactions.length === 0) {
      toast.error('Нет транзакций для экспорта');
      return;
    }
    const accById = new Map(accounts.map((a) => [a.id, a]));
    const catById = new Map(categories.map((c) => [c.id, c.name]));
    const rows = transactions.map((t) => [
      formatDate(t.occurred_at),
      t.type === 'income' ? 'Доход' : 'Расход',
      t.amount,
      accById.get(t.account_id)?.currency ?? '',
      t.category_id ? (catById.get(t.category_id) ?? '') : '',
      accById.get(t.account_id)?.name ?? '',
      t.note ?? '',
    ]);
    downloadCsv(
      `transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Дата', 'Тип', 'Сумма', 'Валюта', 'Категория', 'Счёт', 'Заметка'],
      rows
    );
    toast.success('Экспорт готов', { description: `Выгружено операций: ${transactions.length}` });
  };

  const onSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Stagger className="mx-auto max-w-3xl space-y-6">
      {/* Profile */}
      <StaggerItem>
        <SectionCard icon={User} title="Профиль" description="Имя и аватар в приложении">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <AvatarUploader
                url={avatarUrl}
                fallback={avatarInitial}
                onChange={setAvatarUrl}
                size={72}
              />
              <p className="text-sm text-muted-foreground">
                Загрузите фото профиля. Лучше всего подойдёт квадратное изображение — мы уменьшим
                его автоматически.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Имя</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Влад"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Фамилия</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Необязательно"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => void onSaveProfile()}
                disabled={!profileDirty || savingProfile}
              >
                {savingProfile ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </SectionCard>
      </StaggerItem>

      {/* Appearance */}
      <StaggerItem>
        <SectionCard icon={Palette} title="Внешний вид" description="Тема оформления приложения">
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const active = preference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPreference(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-all',
                    active
                      ? 'border-primary bg-primary/10 text-foreground shadow-xs ring-2 ring-primary/30'
                      : 'border-border/70 bg-surface-2 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <opt.icon className={cn('size-5', active && 'text-primary')} strokeWidth={2} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </SectionCard>
      </StaggerItem>

      {/* Default currency */}
      <StaggerItem>
        <SectionCard
          icon={Sun}
          title="Валюта по умолчанию"
          description="В этой валюте дашборд показывает сводку"
          action={
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger className="h-10 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        >
          <p className="text-sm text-muted-foreground">
            Суммы со счетов в других валютах пересчитываются по курсам к USD.
          </p>
        </SectionCard>
      </StaggerItem>

      {/* Data */}
      <StaggerItem>
        <SectionCard icon={Download} title="Данные" description="Экспорт ваших операций">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Сохранить все транзакции в CSV
              {transactions.length > 0 ? ` (${transactions.length})` : ''} для Excel или Google Sheets.
            </p>
            <Button type="button" variant="outline" onClick={onExport} className="gap-2">
              <Download className="size-4" />
              Экспорт в CSV
            </Button>
          </div>
        </SectionCard>
      </StaggerItem>

      {/* Account */}
      <StaggerItem>
        <SectionCard icon={User} title="Аккаунт" description={user?.email ?? ''}>
          <Button
            type="button"
            variant="outline"
            onClick={() => void onSignOut()}
            className="gap-2 text-destructive hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Выйти из аккаунта
          </Button>
        </SectionCard>
      </StaggerItem>
    </Stagger>
  );
}
