import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Monitor, Moon, Plus, Sun } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { NAV_ITEMS } from '@/components/MainLayout/navItems';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useThemeStore } from '@/shared/theme/themeStore';
import { useUIStore } from '@/shared/store/uiStore';

type CommandPaletteProps = {
  onSignOut: () => void | Promise<void>;
};

/** ⌘K command palette: jump to any screen or run a quick action. */
export function CommandPalette({ onSignOut }: CommandPaletteProps) {
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const setQuickAddOpen = useUIStore((s) => s.setQuickAddOpen);
  const navigate = useNavigate();
  const setPreference = useThemeStore((s) => s.setPreference);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useUIStore.getState().toggleCommand();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const run = (fn: () => void) => {
    setOpen(false);
    // Let the close animation start before navigating/opening another dialog.
    window.setTimeout(fn, 80);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open ? (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-[3px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className="fixed left-1/2 top-[16%] z-50 w-[92vw] max-w-xl -translate-x-1/2 focus:outline-none"
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <DialogPrimitive.Title className="sr-only">Палитра команд</DialogPrimitive.Title>
                <DialogPrimitive.Description className="sr-only">
                  Быстрый переход и действия
                </DialogPrimitive.Description>
                <Command
                  loop
                  className="glass overflow-hidden rounded-2xl border border-border/70 shadow-floating"
                >
                  <CommandInput placeholder="Поиск страниц и действий…" />
                  <CommandList>
                    <CommandEmpty>Ничего не найдено.</CommandEmpty>
                    <CommandGroup heading="Навигация">
                      {NAV_ITEMS.map((item) => (
                        <CommandItem
                          key={item.to}
                          value={`${item.label} ${item.hint ?? ''}`}
                          onSelect={() => run(() => navigate(item.to))}
                        >
                          <item.icon className="text-muted-foreground" />
                          <span>{item.label}</span>
                          {item.hint ? (
                            <span className="ml-auto text-xs text-muted-foreground">{item.hint}</span>
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Действия">
                      <CommandItem
                        value="добавить транзакцию доход расход новая"
                        onSelect={() => run(() => setQuickAddOpen(true))}
                      >
                        <Plus className="text-primary" />
                        Добавить транзакцию
                      </CommandItem>
                      <CommandItem
                        value="светлая тема оформление light"
                        onSelect={() => run(() => setPreference('light'))}
                      >
                        <Sun className="text-amber-500" />
                        Светлая тема
                      </CommandItem>
                      <CommandItem
                        value="тёмная темная тема оформление dark"
                        onSelect={() => run(() => setPreference('dark'))}
                      >
                        <Moon className="text-primary" />
                        Тёмная тема
                      </CommandItem>
                      <CommandItem
                        value="системная тема авто system"
                        onSelect={() => run(() => setPreference('system'))}
                      >
                        <Monitor className="text-muted-foreground" />
                        Системная тема
                      </CommandItem>
                      <CommandItem
                        value="выйти выход logout аккаунт"
                        onSelect={() => run(() => void onSignOut())}
                        className="text-destructive data-[selected=true]:bg-destructive/10 data-[selected=true]:text-destructive"
                      >
                        <LogOut />
                        Выйти
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                  <div className="flex items-center gap-3 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Kbd>↑</Kbd>
                      <Kbd>↓</Kbd>
                      выбор
                    </span>
                    <span className="flex items-center gap-1">
                      <Kbd>↵</Kbd>
                      перейти
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      <Kbd>esc</Kbd>
                      закрыть
                    </span>
                  </div>
                </Command>
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        ) : null}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[18px] items-center justify-center rounded border border-border bg-muted px-1 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground">
      {children}
    </kbd>
  );
}
