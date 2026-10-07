import { LinearGradient } from 'expo-linear-gradient';
import { Wallet } from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Heading, Text } from '@components/ui/text';
import { tokenColor, useResolvedTheme } from '@/shared/theme/tokens';

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Bottom link slot (e.g. "Нет аккаунта? Зарегистрироваться"). */
  footer?: ReactNode;
};

/**
 * Mobile auth shell — a clean, branded, keyboard-aware centered card.
 *
 * The web counterpart (`src/components/AuthLayout`) is a desktop split-screen
 * with a showcase panel; on a phone that doesn't fit, so this is rebuilt as a
 * single centered column: the Lumen brand mark, a title + subtitle, the form
 * (children), and a footer link slot. Backgrounded on `bg-background` with a
 * soft brand glow up top for warmth.
 *
 * Keyboard handling: a `KeyboardAvoidingView` + `ScrollView` keeps inputs and
 * the submit button reachable when the keyboard is up, and the content stays
 * vertically centered while it fits.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const insets = useSafeAreaInsets();
  const theme = useResolvedTheme();

  return (
    <View className="flex-1 bg-background">
      {/* Soft brand glow behind the card (purely decorative). */}
      <LinearGradient
        colors={[tokenColor('primary', theme, 0.14), 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(420).springify().damping(18)}
            className="w-full self-center"
            style={{ maxWidth: 440 }}
          >
            {/* Brand mark */}
            <View className="mb-9 flex-row items-center gap-3">
              <LinearGradient
                colors={[
                  tokenColor('primary', theme),
                  tokenColor('chart-2', theme),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet
                  size={24}
                  color={tokenColor('primary-foreground', theme)}
                  strokeWidth={2.4}
                />
              </LinearGradient>
              <Text weight="bold" className="text-xl tracking-tight text-foreground">
                Lumen
              </Text>
            </View>

            <Heading className="text-[28px] leading-tight tracking-tight text-foreground">
              {title}
            </Heading>
            <Text className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {subtitle}
            </Text>

            <View className="mt-8">{children}</View>

            {footer ? (
              <View className="mt-7 flex-row flex-wrap items-center justify-center gap-1">
                {footer}
              </View>
            ) : null}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
