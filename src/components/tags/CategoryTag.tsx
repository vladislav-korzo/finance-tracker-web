import { CategoryIcon } from '@/components/CategoryIcon';
import { cn } from '@/shared/lib/utils';

type Props = {
  name: string;
  color: string;
  icon?: string;
  className?: string;
};

export function CategoryTag({ name, color, icon, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full border py-0.5 pl-0.5 pr-2 text-xs font-semibold',
        className
      )}
      style={{
        backgroundColor: `${color}22`,
        color,
        borderColor: `${color}55`,
      }}
    >
      {icon ? (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}33` }}
        >
          <CategoryIcon name={icon} className="size-3" />
        </span>
      ) : null}
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}
