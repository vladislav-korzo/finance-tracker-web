import type { LucideProps } from 'lucide-react';

import { CATEGORY_ICON_MAP } from '@/shared/constants/categoryIconMap';
import type { CategoryIconName } from '@/shared/constants/categoryAppearance';

type Props = LucideProps & {
  name: string;
};

export function CategoryIcon({ name, className, style, ...rest }: Props) {
  const Cmp =
    CATEGORY_ICON_MAP[name as CategoryIconName] ?? CATEGORY_ICON_MAP.Circle;
  return <Cmp className={className} style={style} {...rest} />;
}
