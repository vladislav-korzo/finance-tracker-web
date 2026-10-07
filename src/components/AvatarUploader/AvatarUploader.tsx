import { Camera, Loader2, User as UserIcon, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';

import { MAX_AVATAR_BYTES, uploadAvatar } from '@/shared/lib/avatarStorage';
import { toast } from '@/shared/lib/feedback';
import { cn } from '@/shared/lib/utils';

type AvatarUploaderProps = {
  /** Current avatar URL ('' when none). */
  url: string;
  /** Initials shown when there is no photo. */
  fallback?: string;
  onChange: (url: string) => void;
  /** Diameter in px. */
  size?: number;
  className?: string;
};

export function AvatarUploader({
  url,
  fallback,
  onChange,
  size = 96,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Файл слишком большой', { description: 'Максимум 10 МБ' });
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadAvatar(file));
    } catch (err) {
      toast.error('Не удалось загрузить фото', { description: (err as Error).message });
    } finally {
      setUploading(false);
    }
  };

  // Just clear the selection; the file lives at a fixed path and is overwritten
  // on the next upload, so eager deletion would only risk a dangling reference.
  const onRemove = () => onChange('');

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative size-full overflow-hidden rounded-full bg-primary/12 outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Загрузить фото"
      >
        {url ? (
          <img src={url} alt="Аватар" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-2xl font-bold text-primary">
            {fallback ? fallback : <UserIcon className="size-2/5" strokeWidth={2} />}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/45 text-white opacity-0 transition group-hover:opacity-100">
          <Camera className="size-1/3" strokeWidth={2} />
        </span>
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/65">
            <Loader2 className="size-1/3 animate-spin text-primary" />
          </span>
        ) : null}
      </button>

      {url && !uploading ? (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -right-0.5 -top-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:text-destructive"
          aria-label="Удалить фото"
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      ) : null}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
