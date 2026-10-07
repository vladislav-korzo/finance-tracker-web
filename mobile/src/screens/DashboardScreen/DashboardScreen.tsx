import { useRouter } from 'expo-router';
import { ChevronRight, Receipt, Wallet } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { CategoryIcon } from '@components/CategoryIcon';
import { EmptyState } from '@components/blocks';
import { Button } from '@components/ui/button';
import { Skeleton } from '@components/ui/skeleton';
import { Heading, Text } from '@components/ui/text';
import {
  computeBalances,
  type AccountBalanceRow,
} from '@screens/DashboardScreen/DashboardScreen.utils';
import { cn } from '@/shared/lib/utils';
import { profileDisplayName, profileInitials } from '@/shared/lib/profile';
import { useAccountStore } from '@/shared/store/accountStore';
import { useAuthStore } from '@/shared/store/authStore';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useTransactionStore } from '@/shared/store/transactionStore';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';
import { AnimatedNumber } from '@/shared/ui/motion';
import { formatAmount, formatMoney, formatTxDate } from '@/shared/utils/format';
import type { Account, Category, Transaction } from '@/shared/types/entities';

const SCREEN_PADDING = 20;
const SCREEN_WIDTH = Dimensions.get('window').width;

const CARD_GAP = 14;
const CARD_WIDTH = SCREEN_WIDTH - 76;
const CARD_SNAP = CARD_WIDTH + CARD_GAP;
const CARD_HEIGHT = 184;

/** Vivid gradient per card (by index) — physical-card feel; pops off the dark bg. */
const CARD_GRADIENTS: [string, string][] = [
  ['#4F46E5', '#7C3AED'],
  ['#0D9488', '#10B981'],
  ['#2563EB', '#0EA5E9'],
  ['#DB2777', '#F97316'],
  ['#7C3AED', '#DB2777'],
  ['#0EA5E9', '#6366F1'],
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Доброй ночи,';
  if (h < 12) return 'Доброе утро,';
  if (h < 18) return 'Добрый день,';
  return 'Добрый вечер,';
}

/**
 * Home — kept simple: a swipeable carousel of account cards + the latest
 * operations for the selected account. No charts / insight tiles (those live in
 * Аналитика / Бюджет / Кредиты). Adding an operation is the central tab-bar "+".
 */
export default function DashboardScreen() {
  const router = useRouter();
  const theme = useResolvedTheme();

  const { accounts, fetchAccounts, loading: accountsLoading } = useAccountStore();
  const { transactions, fetchTransactions, loading: txLoading } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const user = useAuthStore((s) => s.user);

  const refetch = useCallback(() => {
    void fetchAccounts();
    void fetchTransactions();
    void fetchCategories();
  }, [fetchAccounts, fetchTransactions, fetchCategories]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const withBalances = useMemo(
    () => computeBalances(accounts, transactions),
    [accounts, transactions]
  );
  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const [activeIndex, setActiveIndex] = useState(0);
  const lastIndex = useRef(0);
  useEffect(() => {
    if (activeIndex > withBalances.length - 1) {
      setActiveIndex(Math.max(0, withBalances.length - 1));
    }
  }, [withBalances.length, activeIndex]);

  const onCarouselScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_SNAP);
    if (idx !== lastIndex.current) {
      lastIndex.current = idx;
      setActiveIndex(idx);
    }
  }, []);

  const activeAccount = withBalances[activeIndex] ?? withBalances[0] ?? null;
  const activeOperations = useMemo(() => {
    if (!activeAccount) return [] as Transaction[];
    return transactions.filter((t) => t.account_id === activeAccount.id).slice(0, 8);
  }, [transactions, activeAccount]);

  const loading = accountsLoading || txLoading;
  const name = profileDisplayName(user).split(' ')[0] || 'Привет';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={loading && accounts.length > 0}
            onRefresh={refetch}
            tintColor={tokenColor('muted-foreground', theme)}
          />
        }
      >
        {/* Header: greeting + avatar */}
        <View
          className="flex-row items-center justify-between gap-3 pb-4 pt-1"
          style={{ paddingHorizontal: SCREEN_PADDING }}
        >
          <View className="min-w-0 flex-1">
            <Text className="text-[13px] text-muted-foreground">{greeting()}</Text>
            <Heading className="text-[26px] text-foreground" numberOfLines={1}>
              {name}
            </Heading>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Профиль"
            onPress={() => router.push('/more')}
            className="size-11 items-center justify-center rounded-full bg-secondary active:opacity-80"
          >
            <Text weight="semibold" className="text-[15px] text-foreground">
              {profileInitials(user)}
            </Text>
          </Pressable>
        </View>

        {loading && accounts.length === 0 ? (
          <HomeSkeleton />
        ) : accounts.length === 0 ? (
          <View style={{ paddingHorizontal: SCREEN_PADDING }}>
            <EmptyState
              icon={Wallet}
              title="Пока нет счетов"
              description="Создайте первый счёт, чтобы вести финансы."
              action={<Button onPress={() => router.push('/wallets')}>Создать счёт</Button>}
            />
          </View>
        ) : (
          <>
            <AccountCarousel rows={withBalances} activeIndex={activeIndex} onScroll={onCarouselScroll} />
            {withBalances.length > 1 ? (
              <PageDots count={withBalances.length} active={activeIndex} />
            ) : (
              <View style={{ height: 18 }} />
            )}

            <View style={{ paddingHorizontal: SCREEN_PADDING, marginTop: 10 }} className="gap-3">
              <View className="flex-row items-center justify-between gap-3 px-0.5">
                <Text weight="semibold" className="min-w-0 flex-1 text-[17px] tracking-tight text-foreground" numberOfLines={1}>
                  Операции
                  {activeAccount ? (
                    <Text weight="medium" className="text-[17px] text-muted-foreground">
                      {`  ·  ${activeAccount.name}`}
                    </Text>
                  ) : null}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/transactions')}
                  hitSlop={8}
                  className="flex-row items-center gap-0.5 active:opacity-70"
                >
                  <Text weight="medium" className="text-[14px] text-muted-foreground">
                    Все
                  </Text>
                  <ChevronRight size={16} color={tokenColor('muted-foreground', theme)} />
                </Pressable>
              </View>

              {activeOperations.length === 0 ? (
                <View className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-7">
                  <Text className="text-center text-[14px] text-muted-foreground">
                    По этому счёту пока нет операций
                  </Text>
                </View>
              ) : (
                <View className="overflow-hidden rounded-2xl border border-border bg-card">
                  {activeOperations.map((t, i) => (
                    <OperationRow
                      key={t.id}
                      tx={t}
                      currency={activeAccount?.currency ?? 'BYN'}
                      category={t.category_id ? categoryById.get(t.category_id) ?? null : null}
                      divider={i > 0}
                      theme={theme}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AccountCarousel({
  rows,
  activeIndex,
  onScroll,
}: {
  rows: AccountBalanceRow[];
  activeIndex: number;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_SNAP}
      decelerationRate="fast"
      disableIntervalMomentum
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingHorizontal: SCREEN_PADDING, gap: CARD_GAP }}
    >
      {rows.map((row, i) => (
        <AccountCard key={row.id} row={row} index={i} active={i === activeIndex} />
      ))}
    </ScrollView>
  );
}

function AccountCard({
  row,
  index,
  active,
}: {
  row: AccountBalanceRow;
  index: number;
  active: boolean;
}) {
  const [c1, c2] = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 26,
        opacity: active ? 1 : 0.5,
        shadowColor: c2,
        shadowOpacity: active ? 0.5 : 0.2,
        shadowRadius: active ? 20 : 12,
        shadowOffset: { width: 0, height: active ? 12 : 6 },
        elevation: active ? 9 : 3,
      }}
    >
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, borderRadius: 26, padding: 20, justifyContent: 'space-between', overflow: 'hidden' }}
      >
        <View style={{ position: 'absolute', top: -52, right: -38, width: 156, height: 156, borderRadius: 78, backgroundColor: 'rgba(255,255,255,0.13)' }} />
        <View style={{ position: 'absolute', bottom: -64, left: -34, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)' }} />

        <View className="flex-row items-center justify-between gap-3">
          <Text weight="semibold" className="min-w-0 flex-1 text-[15px]" style={{ color: '#FFFFFF' }} numberOfLines={1}>
            {row.name}
          </Text>
          <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.22)' }}>
            <Text weight="semibold" className="text-[11px] uppercase tracking-wider" style={{ color: '#FFFFFF' }}>
              {row.currency}
            </Text>
          </View>
        </View>

        {/* Caption + balance grouped and bottom-anchored (currency lives in the
            chip above, so the number itself is bare — no doubled code). */}
        <View className="gap-1">
          <Text
            weight="medium"
            className="text-[12px] uppercase"
            style={{ color: 'rgba(255,255,255,0.72)', letterSpacing: 1.5 }}
          >
            Баланс
          </Text>
          <AnimatedNumber
            value={row.balance}
            format={formatAmount}
            weight="extrabold"
            className="text-[32px] tracking-tight"
            style={{ color: '#FFFFFF', fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          />
        </View>
      </LinearGradient>
    </View>
  );
}

function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <View className="mb-1 mt-5 flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) =>
        i === active ? (
          <View key={i} className="h-2 w-7 rounded-full bg-primary" />
        ) : (
          <View key={i} className="size-2 rounded-full bg-muted-foreground/45" />
        )
      )}
    </View>
  );
}

function OperationRow({
  tx,
  currency,
  category,
  divider,
  theme,
}: {
  tx: Transaction;
  currency: string;
  category: Category | null;
  divider: boolean;
  theme: 'light' | 'dark';
}) {
  const income = tx.type === 'income';
  const title = tx.note || category?.name || 'Операция';
  const dateStr = formatTxDate(tx.occurred_at);
  // Always surface the date. Show the category alongside it only when it isn't
  // already the title (i.e. the title is a note), to avoid repeating it.
  const subtitle = tx.note && category ? `${category.name} · ${dateStr}` : dateStr;
  return (
    <View className={cn('flex-row items-center gap-3 px-4 py-3.5', divider && 'border-t border-border')}>
      {category ? (
        <CategoryIcon iconName={category.icon} color={category.color} size={20} />
      ) : (
        <View className="size-10 items-center justify-center rounded-full bg-secondary">
          <Receipt size={18} color={tokenColor('muted-foreground', theme)} strokeWidth={2} />
        </View>
      )}
      <View className="min-w-0 flex-1">
        <Text weight="medium" className="text-[15px] text-foreground" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-[12px] text-muted-foreground" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Text
        weight="semibold"
        className="text-[15px]"
        numberOfLines={1}
        style={{
          color: income ? tokenColor('income', theme) : tokenColor('foreground', theme),
          fontVariant: ['tabular-nums'],
        }}
      >
        {income ? '+' : '−'}
        {formatMoney(tx.amount, currency)}
      </Text>
    </View>
  );
}

function HomeSkeleton() {
  return (
    <View style={{ paddingHorizontal: SCREEN_PADDING }} className="gap-4">
      <Skeleton className="h-[184px] w-full rounded-3xl" />
      <View className="mt-2 gap-3">
        <Skeleton className="h-5 w-40 rounded-md" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </View>
    </View>
  );
}
