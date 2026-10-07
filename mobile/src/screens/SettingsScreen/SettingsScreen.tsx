import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, LogOut, Palette, User, Wallet } from 'lucide-react-native';

import { AvatarUploader } from '@components/AvatarUploader';
import { ScreenHeader, SectionCard } from '@components/blocks';
import { ThemeSegmented } from '@components/ThemeToggle/ThemeSegmented';
import { confirm } from '@components/ConfirmDialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select } from '@components/ui/select';
import { Text } from '@components/ui/text';
import { ACCOUNT_CURRENCY_OPTIONS } from '@/shared/constants/accountCurrencies';
import { downloadCsv } from '@/shared/lib/exportCsv';
import { toast } from '@/shared/lib/feedback';
import { getProfile } from '@/shared/lib/profile';
import { useAccountStore } from '@/shared/store/accountStore';
import { useAuthStore } from '@/shared/store/authStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { Stagger, StaggerItem } from '@/shared/ui/motion';
import { formatDate } from '@/shared/utils/format';

/**
 * Settings — native redesign of the web SettingsScreen. A vertical stack of
 * SectionCards: profile (avatar + name), appearance (theme segmented control),
 * default currency, CSV data export, and the account / sign-out block.
 *
 * Feature parity with web: same profile-dirty save gating, same CSV columns
 * (date, type, amount, currency, category, account, note) and filename pattern,
 * and a destructive sign-out behind a confirm dialog. The root gate redirects to
 * /login once `signOut` clears the session, so no manual navigation is needed.
 */
export default function SettingsScreen() {
  const defaultCurrency = useSettingsStore((s) => s.defaultCurrency);
  const setDefaultCurrency = useSettingsStore((s) => s.setDefaultCurrency);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const transactions = useTransactionStore((s) => s.transactions);
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const accounts = useAccountStore((s) => s.accounts);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const categories = useCategoryStore((s) => s.categories);
  const fetchCategories = useCategoryStore((s) => s.fetchCategories);

  const refreshAll = () =>
    Promise.all([fetchTransactions(), fetchAccounts(), fetchCategories()]);

  useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTransactions, fetchAccounts, fetchCategories]);

  const profile = getProfile(user);
  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [savingProfile, setSavingProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Re-sync the form whenever the user/profile resolves or changes elsewhere.
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setRefreshing(false);
    }
  };

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
      rows,
    );
    toast.success('Экспорт готов', {
      description: `Выгружено операций: ${transactions.length}`,
    });
  };

  const onSignOut = async () => {
    const ok = await confirm({
      title: 'Выйти?',
      description: 'Понадобится снова войти, чтобы вернуться к данным.',
      confirmText: 'Выйти',
      destructive: true,
    });
    if (!ok) return;
    await signOut();
    // The root gate observes the cleared session and redirects to /login.
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <ScreenHeader title="Настройки" subtitle="Профиль, валюта и оформление." />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Stagger className="gap-4">
          {/* Profile */}
          <StaggerItem>
            <SectionCard icon={User} title="Профиль" description="Имя и аватар в приложении">
              <View className="gap-5">
                <View className="flex-row items-center gap-4">
                  <AvatarUploader
                    value={avatarUrl}
                    fallback={avatarInitial}
                    onChange={setAvatarUrl}
                    size={72}
                  />
                  <Text className="flex-1 text-sm text-muted-foreground">
                    Загрузите фото профиля. Лучше всего подойдёт квадратное изображение — мы
                    уменьшим его автоматически.
                  </Text>
                </View>

                <View className="gap-4">
                  <View className="gap-1.5">
                    <Label>Имя</Label>
                    <Input
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Влад"
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  <View className="gap-1.5">
                    <Label>Фамилия</Label>
                    <Input
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Необязательно"
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  </View>
                </View>

                <Button
                  onPress={() => void onSaveProfile()}
                  disabled={!profileDirty || savingProfile}
                  loading={savingProfile}
                >
                  Сохранить
                </Button>
              </View>
            </SectionCard>
          </StaggerItem>

          {/* Appearance */}
          <StaggerItem>
            <SectionCard
              icon={Palette}
              title="Внешний вид"
              description="Тема оформления приложения"
            >
              <ThemeSegmented />
            </SectionCard>
          </StaggerItem>

          {/* Default currency */}
          <StaggerItem>
            <SectionCard
              icon={Wallet}
              title="Валюта по умолчанию"
              description="В этой валюте дашборд показывает сводку"
            >
              <View className="gap-3">
                <Select
                  value={defaultCurrency}
                  onValueChange={setDefaultCurrency}
                  options={ACCOUNT_CURRENCY_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  title="Валюта по умолчанию"
                  placeholder="Выберите валюту"
                />
                <Text className="text-sm text-muted-foreground">
                  Суммы со счетов в других валютах пересчитываются по курсам к USD.
                </Text>
              </View>
            </SectionCard>
          </StaggerItem>

          {/* Data export */}
          <StaggerItem>
            <SectionCard icon={Download} title="Данные" description="Экспорт ваших операций">
              <View className="gap-4">
                <Text className="text-sm text-muted-foreground">
                  Сохранить все транзакции
                  {transactions.length > 0 ? ` (${transactions.length})` : ''} в CSV для Excel или
                  Google Sheets.
                </Text>
                <Button variant="outline" onPress={onExport} disabled={transactions.length === 0}>
                  <View className="flex-row items-center gap-2">
                    <Download size={16} className="text-foreground" />
                    <Text weight="semibold" className="text-sm text-foreground">
                      Экспорт в CSV
                    </Text>
                  </View>
                </Button>
              </View>
            </SectionCard>
          </StaggerItem>

          {/* Account */}
          <StaggerItem>
            <SectionCard icon={User} title="Аккаунт" description={user?.email ?? ''}>
              <Button variant="outline" onPress={() => void onSignOut()}>
                <View className="flex-row items-center gap-2">
                  <LogOut size={16} className="text-destructive" />
                  <Text weight="semibold" className="text-sm text-destructive">
                    Выйти из аккаунта
                  </Text>
                </View>
              </Button>
            </SectionCard>
          </StaggerItem>
        </Stagger>
      </ScrollView>
    </SafeAreaView>
  );
}
