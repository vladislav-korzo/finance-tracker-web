import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import { supabase } from '@/shared/lib/supabase';
import { useAuthStore } from '@/shared/store/authStore';

const BUCKET = 'avatars';
/** Max side of the stored avatar in px — keeps files small and uniform. */
const MAX_DIM = 512;
/** Reject originals larger than this before processing. */
export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/**
 * The subset of an `expo-image-picker` asset we need: a local `uri`, optional
 * intrinsic `width`/`height` (used to compute the center-crop without decoding),
 * and optional `fileSize` (to reject oversized originals up front).
 *
 * Pass an `ImagePickerAsset` straight from `ImagePicker.launch*Async(...).assets[0]`.
 */
export type AvatarSource = Pick<ImagePickerAsset, 'uri' | 'width' | 'height' | 'fileSize'>;

/**
 * Center-crop to a square and downscale to at most MAX_DIM, as a JPEG file.
 * Returns the local `file://` URI of the processed image.
 *
 * When the asset reports its dimensions we crop in a single pass. If they are
 * missing or zero (some Android content providers omit them), we render once to
 * read the real size, then crop+resize.
 */
async function toSquareJpeg(source: AvatarSource): Promise<string> {
  let width = source.width ?? 0;
  let height = source.height ?? 0;

  // Fall back to reading intrinsic dimensions off a native image reference.
  if (!width || !height) {
    const ref = await ImageManipulator.manipulate(source.uri).renderAsync();
    width = ref.width;
    height = ref.height;
  }

  const side = Math.min(width, height);
  const sx = (width - side) / 2;
  const sy = (height - side) / 2;
  const target = Math.min(side, MAX_DIM);

  const context = ImageManipulator.manipulate(source.uri)
    .crop({ originX: sx, originY: sy, width: side, height: side })
    .resize({ width: target, height: target });

  const ref = await context.renderAsync();
  const result = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.85 });
  return result.uri;
}

/** Read a local file URI into bytes — a reliable upload body for Supabase storage in RN. */
async function readBytes(uri: string): Promise<Uint8Array> {
  // `expo-file-system`'s new `File` implements `Blob` and exposes `bytes()`.
  const { File } = await import('expo-file-system');
  return new File(uri).bytes();
}

/**
 * Resize an image and upsert it to `avatars/{uid}/avatar.jpg`.
 * Returns a public URL with a cache-busting query (the path is fixed per user).
 */
export async function uploadAvatar(source: AvatarSource): Promise<string> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error('Не авторизованы');

  if (source.fileSize != null && source.fileSize > MAX_AVATAR_BYTES) {
    throw new Error('Файл слишком большой');
  }

  const jpegUri = await toSquareJpeg(source);
  const bytes = await readBytes(jpegUri);
  const path = `${user.id}/avatar.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}
