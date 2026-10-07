import * as ImagePicker from 'expo-image-picker';
import { Camera, UserRound, X } from 'lucide-react-native';
import * as React from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { Text } from '@components/ui/text';
import { uploadAvatar } from '@/shared/lib/avatarStorage';
import { toast } from '@/shared/lib/feedback';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';
import { cn } from '@/shared/lib/utils';

type AvatarUploaderProps = {
  /** Current avatar URL ('' / undefined when none). */
  value?: string;
  /** Initials shown when there is no photo. */
  fallback?: string;
  onChange?: (url: string) => void;
  /** Diameter in px. */
  size?: number;
  className?: string;
};

/**
 * Tap-to-pick avatar control — native port of the web `AvatarUploader`.
 *
 * The web version uses a hidden `<input type=file>`; here we open the system
 * photo library via `expo-image-picker.launchImageLibraryAsync` (images only,
 * full quality — `uploadAvatar` does the square-crop + downscale), request
 * permission on demand, then upload through the shared `uploadAvatar` helper and
 * hand the public URL back via `onChange`.
 *
 * Shows the photo when present, otherwise the `fallback` initials (or a person
 * glyph), plus a camera overlay hint and a spinner while uploading. A small ×
 * badge clears the selection.
 */
export function AvatarUploader({
  value,
  fallback,
  onChange,
  size = 96,
  className,
}: AvatarUploaderProps) {
  const theme = useResolvedTheme();
  const [uploading, setUploading] = React.useState(false);

  const pick = React.useCallback(async () => {
    if (uploading) return;

    // Ask for library access on demand; bail with a friendly toast if denied.
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.error('Нет доступа к фото', {
        description: 'Разрешите доступ к галерее в настройках.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: false,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    setUploading(true);
    try {
      const url = await uploadAvatar({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileSize: asset.fileSize,
      });
      onChange?.(url);
    } catch (err) {
      toast.error('Не удалось загрузить фото', {
        description: (err as Error).message,
      });
    } finally {
      setUploading(false);
    }
  }, [onChange, uploading]);

  const remove = React.useCallback(() => onChange?.(''), [onChange]);

  const radius = size / 2;
  const hasPhoto = Boolean(value);

  return (
    <View className={cn('relative', className)} style={{ width: size, height: size }}>
      <Pressable
        onPress={pick}
        disabled={uploading}
        accessibilityRole="button"
        accessibilityLabel="Загрузить фото"
        className="overflow-hidden bg-primary/[0.12]"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        {({ pressed }) => (
          <View className="size-full items-center justify-center">
            {hasPhoto ? (
              <Image
                source={{ uri: value }}
                style={{ width: size, height: size }}
                resizeMode="cover"
              />
            ) : fallback ? (
              <Text
                weight="bold"
                className="text-primary"
                style={{ fontSize: size * 0.32 }}
              >
                {fallback}
              </Text>
            ) : (
              <UserRound
                size={size * 0.4}
                color={tokenColor('primary', theme)}
                strokeWidth={2}
              />
            )}

            {/* Camera hint overlay on press (mirrors the web hover state). */}
            {pressed && !uploading ? (
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ backgroundColor: tokenColor('foreground', theme, 0.45) }}
              >
                <Camera size={size * 0.3} color="#ffffff" strokeWidth={2} />
              </View>
            ) : null}

            {uploading ? (
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ backgroundColor: tokenColor('background', theme, 0.65) }}
              >
                <ActivityIndicator color={tokenColor('primary', theme)} />
              </View>
            ) : null}
          </View>
        )}
      </Pressable>

      {hasPhoto && !uploading ? (
        <Pressable
          onPress={remove}
          accessibilityRole="button"
          accessibilityLabel="Удалить фото"
          hitSlop={8}
          className="absolute -right-1 -top-1 size-7 items-center justify-center rounded-full border border-border bg-card"
        >
          <X size={15} color={tokenColor('muted-foreground', theme)} strokeWidth={2.5} />
        </Pressable>
      ) : null}
    </View>
  );
}
