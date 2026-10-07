import { Toaster as SonnerToaster } from 'sonner';

import { useThemeStore } from '@/shared/theme/themeStore';

/** App-wide toast host, themed to the Lumen tokens. Mounted once at the root. */
export function Toaster() {
  const resolved = useThemeStore((s) => s.resolved);

  return (
    <SonnerToaster
      theme={resolved}
      position="top-right"
      closeButton
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            'group !rounded-xl !border !border-border/70 !bg-popover/95 !backdrop-blur-md !shadow-floating !text-foreground !font-sans',
          title: '!text-sm !font-semibold',
          description: '!text-muted-foreground !text-[13px]',
          actionButton: '!bg-primary !text-primary-foreground !rounded-md !font-semibold',
          cancelButton: '!bg-muted !text-muted-foreground !rounded-md',
          closeButton: '!bg-card !border-border !text-muted-foreground',
          success: '!text-foreground',
          error: '!text-foreground',
        },
      }}
      style={
        {
          '--normal-bg': 'hsl(var(--popover))',
          '--normal-text': 'hsl(var(--foreground))',
          '--normal-border': 'hsl(var(--border))',
        } as React.CSSProperties
      }
    />
  );
}
