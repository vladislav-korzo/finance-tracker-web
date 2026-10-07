import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

import { NAV_ITEMS } from '@/components/MainLayout/navItems';
import { cn } from '@/shared/lib/utils';

type SidebarNavProps = {
  onNavigate?: () => void;
};

/** Primary nav with a single active pill that slides between items via layoutId. */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
      <p className="px-3.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        Меню
      </p>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className="group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl bg-primary shadow-glow"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              ) : null}
              <item.icon
                className={cn(
                  'relative z-10 size-5 shrink-0 transition-colors',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
                strokeWidth={2}
              />
              <span
                className={cn(
                  'relative z-10 truncate transition-colors',
                  isActive
                    ? 'font-semibold text-primary-foreground'
                    : 'font-medium text-muted-foreground group-hover:text-foreground'
                )}
              >
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
