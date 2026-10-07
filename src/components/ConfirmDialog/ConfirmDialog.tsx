import { AlertTriangle } from 'lucide-react';

import { useConfirmStore } from '@/components/ConfirmDialog/confirmStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** Global, promise-based confirmation dialog. Mounted once at the app root. */
export function ConfirmDialog() {
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const resolveWith = useConfirmStore((s) => s.resolveWith);
  const destructive = options?.destructive ?? true;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : resolveWith(false))}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div
            className={
              destructive
                ? 'mb-1 flex size-11 items-center justify-center rounded-xl bg-destructive/12 text-destructive'
                : 'mb-1 flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary'
            }
          >
            <AlertTriangle className="size-5" strokeWidth={2.2} />
          </div>
          <DialogTitle>{options?.title ?? 'Подтвердите действие'}</DialogTitle>
          {options?.description ? (
            <DialogDescription>{options.description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => resolveWith(false)}>
            {options?.cancelText ?? 'Отмена'}
          </Button>
          <Button
            type="button"
            variant={destructive ? 'destructive' : 'default'}
            onClick={() => resolveWith(true)}
            autoFocus
          >
            {options?.confirmText ?? 'Удалить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
