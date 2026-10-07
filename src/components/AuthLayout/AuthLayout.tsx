import { motion } from 'framer-motion';
import { PieChart, Sparkles, Wallet } from 'lucide-react';
import type { ReactNode } from 'react';

import { Sparkline } from '@/components/blocks/Sparkline';

const FEATURES = [
  { icon: Wallet, title: 'Мультивалютные счета', text: 'BYN, USD, EUR — баланс в одном месте.' },
  { icon: PieChart, title: 'Наглядная аналитика', text: 'Категории, тренды и денежный поток.' },
  { icon: Sparkles, title: 'Приятный интерфейс', text: 'Плавные анимации и тёмная тема.' },
];

const DEMO_SPARK = [12, 18, 14, 22, 19, 28, 24, 33, 30, 38];

/** Split-screen auth shell: branded showcase panel + the form. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / showcase panel */}
      <div className="relative hidden overflow-hidden bg-hero p-10 text-hero-foreground lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-hero-sheen" aria-hidden />
        <motion.div
          className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-primary/25 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
        <motion.div
          className="pointer-events-none absolute -right-16 bottom-24 size-80 rounded-full bg-chart-3/25 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />

        <div className="relative flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-gradient shadow-glow">
            <Wallet className="size-6 text-primary-foreground" strokeWidth={2.4} />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Учёт</span>
        </div>

        <div className="relative mt-auto">
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md text-3xl font-bold leading-tight tracking-tight xl:text-4xl"
          >
            Финансы под контролем — <span className="text-gradient-primary">красиво и просто</span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 w-fit rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
          >
            <p className="text-sm text-hero-foreground/60">Общий баланс</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">8 683,97 BYN</p>
            <Sparkline data={DEMO_SPARK} color="hsl(var(--primary))" width={220} height={44} />
          </motion.div>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-3"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="size-[18px]" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-sm text-hero-foreground/60">{f.text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary-gradient shadow-glow">
              <Wallet className="size-5 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-foreground">Учёт</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">{title}</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </motion.div>
      </div>
    </div>
  );
}
