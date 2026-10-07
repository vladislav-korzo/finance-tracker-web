import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, Search, Settings, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { SidebarNav } from '@/components/MainLayout/SidebarNav';
import {
  contentClassName,
  headerClassName,
  mainColumnClassName,
  shellClassName,
  sidebarInnerClassName,
} from '@/components/MainLayout/MainLayout.styles';
import type { MainLayoutProps } from '@/components/MainLayout/MainLayout.types';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppShortcuts } from '@/shared/hooks/useAppShortcuts';
import { useMenuEvents } from '@/shared/hooks/useMenuEvents';
import { cn } from '@/shared/lib/utils';
import { isDesktop } from '@/shared/platform';
import { useUIStore } from '@/shared/store/uiStore';

function userInitials(email: string): string {
  const local = email.split('@')[0] ?? '?';
  return (local.slice(0, 2) || '?').toUpperCase();
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link to="/" onClick={onNavigate} className="flex items-center gap-3 px-2 outline-none">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-gradient shadow-glow">
        <Wallet className="size-[20px] text-primary-foreground" strokeWidth={2.4} />
      </div>
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold tracking-tight text-foreground">Учёт</p>
        <p className="text-[11px] font-medium text-muted-foreground">личные финансы</p>
      </div>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className={sidebarInnerClassName}>
      <Brand onNavigate={onNavigate} />
      <SidebarNav onNavigate={onNavigate} />
    </div>
  );
}

export function MainLayout(props: MainLayoutProps) {
  const { userEmail, userDisplayName, avatarUrl, pageTitle, headerActions, children, onSignOut } =
    props;
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const setCommandOpen = useUIStore((s) => s.setCommandOpen);
  useAppShortcuts();
  useMenuEvents();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className={shellClassName}>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 h-screen w-[270px] md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className={mainColumnClassName}>
        <header className={headerClassName}>
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
              aria-label="Открыть меню"
            >
              <Menu className="size-5" />
            </button>
            <AnimatePresence mode="wait">
              <motion.h1
                key={pageTitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl"
              >
                {pageTitle}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-muted-foreground/40 hover:text-foreground lg:flex"
            >
              <Search className="size-4" />
              <span>Поиск…</span>
              <kbd className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Поиск"
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:text-foreground lg:hidden"
            >
              <Search className="size-4" />
            </button>

            {headerActions}
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full p-0.5 pr-1 outline-none transition-colors hover:bg-muted sm:pr-2"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      title={userEmail}
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
                      title={userEmail}
                    >
                      {userInitials(userEmail)}
                    </span>
                  )}
                  <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground sm:block">
                    {userDisplayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{userDisplayName}</span>
                  <span className="truncate text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer gap-2">
                    <Settings className="size-4" />
                    Настройки
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => void onSignOut()}
                  className={cn(
                    'cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive'
                  )}
                >
                  <LogOut className="size-4" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={contentClassName}>
          <div className={cn('mx-auto w-full', !isDesktop && 'max-w-[1200px]')}>{children}</div>
        </main>
      </div>

      <CommandPalette onSignOut={onSignOut} />
    </div>
  );
}
