import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import {
  ArrowRightLeft,
  LayoutDashboard,
  Menu,
  Plus,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@components/ui/text';
import { useToken } from '@/shared/theme/tokens';
import { useUIStore } from '@/shared/store/uiStore';

/**
 * Four nav tabs flanking a central "+" action. The "+" is the middle slot of an
 * even five-slot bar (not a floating overlay), so it sits dead-centre and the
 * tabs stay evenly spaced. Analytics and the other secondary routes live under
 * "Ещё" (declared href:null below).
 */
const NAV_TABS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'index', label: 'Главная', icon: LayoutDashboard },
  { name: 'transactions', label: 'Операции', icon: ArrowRightLeft },
  { name: 'wallets', label: 'Кошельки', icon: Wallet },
  { name: 'more', label: 'Ещё', icon: Menu },
];

function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeColor = useToken('primary');
  const inactiveColor = useToken('muted-foreground');
  const primary = useToken('primary');
  const primaryFg = useToken('primary-foreground');
  const shadowColor = useToken('shadow-color');
  const focusedRouteName = state.routes[state.index]?.name;

  const renderTab = (tab: (typeof NAV_TABS)[number]) => {
    const route = state.routes.find((r) => r.name === tab.name);
    if (!route) return <View key={tab.name} className="flex-1" />;
    const isFocused = focusedRouteName === tab.name;
    const color = isFocused ? activeColor : inactiveColor;
    const Icon = tab.icon;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={tab.label}
        onPress={onPress}
        className="flex-1 items-center justify-center gap-1"
      >
        <Icon size={23} color={color} strokeWidth={isFocused ? 2.4 : 2} />
        <Text weight={isFocused ? 'semibold' : 'medium'} className="text-[11px]" style={{ color }} numberOfLines={1}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="flex-row items-center border-t border-border bg-card"
      style={{ paddingBottom: insets.bottom + 6, paddingTop: 10 }}
    >
      {renderTab(NAV_TABS[0])}
      {renderTab(NAV_TABS[1])}

      {/* Central add — even slot, raised so it reads as the primary action. */}
      <View className="flex-1 items-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Добавить операцию"
          onPress={() => useUIStore.getState().setQuickAddOpen(true)}
          className="items-center justify-center rounded-full active:opacity-90"
          style={{
            width: 56,
            height: 56,
            marginTop: -24,
            backgroundColor: primary,
            shadowColor,
            shadowOpacity: 0.3,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 5 },
            elevation: 8,
          }}
        >
          <Plus size={28} color={primaryFg} strokeWidth={2.6} />
        </Pressable>
      </View>

      {renderTab(NAV_TABS[2])}
      {renderTab(NAV_TABS[3])}
    </View>
  );
}

/**
 * Authenticated shell: bottom-tab navigator with a clean custom tab bar (four
 * tabs + central add). Screens render their own headers.
 */
export default function AppTabsLayout() {
  return (
    <View className="flex-1 bg-background">
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <TabBar {...props} />}
      >
        <Tabs.Screen name="index" options={{ title: 'Главная' }} />
        <Tabs.Screen name="transactions" options={{ title: 'Операции' }} />
        <Tabs.Screen name="wallets" options={{ title: 'Кошельки' }} />
        <Tabs.Screen name="more" options={{ title: 'Ещё' }} />
        {/* Hidden but navigable (reached from the "Ещё" hub via router.push). */}
        <Tabs.Screen name="analytics" options={{ href: null }} />
        <Tabs.Screen name="categories" options={{ href: null }} />
        <Tabs.Screen name="budget" options={{ href: null }} />
        <Tabs.Screen name="credits" options={{ href: null }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
