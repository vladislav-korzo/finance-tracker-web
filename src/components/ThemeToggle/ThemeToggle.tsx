import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { useThemeStore } from '@/shared/theme/themeStore';

type ThemeToggleProps = {
  className?: string;
};

/** Compact icon button that flips between light and dark with a morphing icon. */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const resolved = useThemeStore((s) => s.resolved);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = resolved === 'dark';

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      title={isDark ? 'Светлая тема' : 'Тёмная тема'}
      className={cn(
        'relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-muted',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ y: 14, opacity: 0, rotate: -40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -14, opacity: 0, rotate: 40 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute"
          >
            <Moon className="size-[18px] text-primary" strokeWidth={2.2} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ y: 14, opacity: 0, rotate: 40 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -14, opacity: 0, rotate: -40 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute"
          >
            <Sun className="size-[18px] text-amber-500" strokeWidth={2.2} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
