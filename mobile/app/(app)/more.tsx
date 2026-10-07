import { router } from 'expo-router';
import {
  ChevronRight,
  Landmark,
  PieChart,
  PiggyBank,
  Settings,
  Tags,
  type LucideIcon,
} from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@components/ui/card';
import { Heading, Text } from '@components/ui/text';
import { useToken } from '@/shared/theme/tokens';

type MoreLink = {
  href: '/analytics' | '/categories' | '/budget' | '/credits' | '/settings';
  label: string;
  description: string;
  icon: LucideIcon;
};

/** Secondary destinations surfaced from the "Ещё" hub. */
const LINKS: MoreLink[] = [
  {
    href: '/analytics',
    label: 'Аналитика',
    description: 'Доходы и расходы, динамика',
    icon: PieChart,
  },
  {
    href: '/categories',
    label: 'Категории',
    description: 'Доходы и расходы по группам',
    icon: Tags,
  },
  {
    href: '/budget',
    label: 'Бюджет',
    description: 'Лимиты и планирование',
    icon: PiggyBank,
  },
  {
    href: '/credits',
    label: 'Кредиты',
    description: 'Займы и графики платежей',
    icon: Landmark,
  },
  {
    href: '/settings',
    label: 'Настройки',
    description: 'Профиль, валюта, тема',
    icon: Settings,
  },
];

function MoreRow({ link, divider }: { link: MoreLink; divider: boolean }) {
  const iconColor = useToken('foreground');
  const chevronColor = useToken('muted-foreground');
  const Icon = link.icon;

  return (
    <Fragment>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={link.label}
        onPress={() => router.push(link.href)}
        className="flex-row items-center gap-3 px-5 py-4 active:bg-surface-2"
      >
        <View className="size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        <View className="min-w-0 flex-1">
          <Text weight="semibold" className="text-base text-foreground">
            {link.label}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {link.description}
          </Text>
        </View>
        <ChevronRight size={20} color={chevronColor} strokeWidth={2} />
      </Pressable>
      {divider ? <View className="ml-[68px] h-px bg-border" /> : null}
    </Fragment>
  );
}

/**
 * "Ещё" hub — links to the secondary sections that don't have a dedicated tab
 * (categories, budget, credits, settings). Built inline rather than as a screen
 * module since it's navigation chrome specific to this tab group.
 */
export default function More() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}
      >
        <Heading className="mb-5 text-3xl text-foreground">Ещё</Heading>
        <Card flat className="overflow-hidden">
          {LINKS.map((link, i) => (
            <MoreRow key={link.href} link={link} divider={i < LINKS.length - 1} />
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
