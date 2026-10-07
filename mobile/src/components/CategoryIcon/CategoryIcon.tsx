import { View } from 'react-native';

import { cn } from '@/shared/lib/utils';
import { CATEGORY_ICON_MAP } from '@/shared/constants/categoryIconMap';
import type { CategoryIconName } from '@/shared/constants/categoryAppearance';

type Props = {
  /** Lucide icon name (PascalCase). Mirrors the web `name` prop. */
  iconName: string;
  /** Arbitrary category color (hex). Used for both the icon and its soft chip. */
  color: string;
  /** Pixel size of the rendered glyph. Defaults to 16. */
  size?: number;
  className?: string;
};

/**
 * Renders a Lucide category glyph inside a rounded chip whose background is the
 * category color at low opacity and whose icon is the full color — matching the
 * web treatment. The color is dynamic per-category, so it can't be expressed via
 * design tokens and is applied inline.
 */
export function CategoryIcon({ iconName, color, size = 16, className }: Props) {
  const Icon =
    CATEGORY_ICON_MAP[iconName as CategoryIconName] ?? CATEGORY_ICON_MAP.Circle;

  // Chip is sized to comfortably contain the glyph with even padding.
  const box = Math.round(size * 1.75);

  return (
    <View
      className={cn('items-center justify-center rounded-xl', className)}
      style={{
        width: box,
        height: box,
        backgroundColor: `${color}1f`, // ~12% — soft fill
      }}
    >
      <Icon size={size} color={color} />
    </View>
  );
}
