import { View } from 'react-native';

import { Text } from '@components/ui/text';
import { cn } from '@/shared/lib/utils';
import { CATEGORY_ICON_MAP } from '@/shared/constants/categoryIconMap';
import type { CategoryIconName } from '@/shared/constants/categoryAppearance';

type Props = {
  name: string;
  color: string;
  icon?: string;
  className?: string;
};

/**
 * Pill tagged with a category's color: soft tinted fill (~13%), a tinted border
 * (~33%), and the color used for the icon glyph and label text. The category
 * color is arbitrary per-category, so it's applied inline rather than via tokens.
 */
export function CategoryTag({ name, color, icon, className }: Props) {
  const Icon = icon
    ? (CATEGORY_ICON_MAP[icon as CategoryIconName] ?? CATEGORY_ICON_MAP.Circle)
    : null;

  return (
    <View
      className={cn(
        'max-w-full flex-row items-center gap-1.5 self-start rounded-full border py-0.5 pl-0.5 pr-2',
        className
      )}
      style={{
        backgroundColor: `${color}22`,
        borderColor: `${color}55`,
      }}
    >
      {Icon ? (
        <View
          className="h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}33` }}
        >
          <Icon size={12} color={color} />
        </View>
      ) : null}
      <Text
        weight="semibold"
        numberOfLines={1}
        className="min-w-0 shrink text-xs"
        style={{ color }}
      >
        {name}
      </Text>
    </View>
  );
}
