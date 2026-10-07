import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/store/authStore';

const BUCKET = 'avatars';
/** Max side of the stored avatar in px — keeps files small and uniform. */
const MAX_DIM = 512;
/** Reject originals larger than this before processing. */
export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/** Center-crop to a square and downscale to at most MAX_DIM, as a JPEG blob. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const target = Math.min(side, MAX_DIM);

  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas не поддерживается');
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, target, target);
  bitmap.close?.();

  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Не удалось обработать изображение'))),
      'image/jpeg',
      0.85
    )
  );
}

/**
 * Resize an image and upsert it to `avatars/{uid}/avatar.jpg`.
 * Returns a public URL with a cache-busting query (the path is fixed per user).
 */
export async function uploadAvatar(file: File): Promise<string> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Не авторизованы');

  const blob = await toSquareJpeg(file);
  const path = `${user.id}/avatar.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
