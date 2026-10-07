---
description: React Native (Expo) — stack, StyleSheet, Reanimated, React Navigation, RNTL. Use with project-structure.shared.md.
globs:
  - "HabitFlow/**/*.ts"
  - "HabitFlow/**/*.tsx"
  - "**/apps/mobile/**/*.ts"
  - "**/apps/mobile/**/*.tsx"
---

# React Native project structure

**Prerequisite:** `.cursor/rules/project-structure.shared.md`.

## Tech stack (React Native / Expo)

- **Navigation**: React Navigation v6 — native stack; param lists in `src/app/navigation/types.ts`.
- **State**: Zustand (avoid Redux/Context for global app state).
- **Animations**: React Native Reanimated 3 — avoid `Animated` from `react-native` for non-trivial motion.
- **Gestures**: React Native Gesture Handler.
- **Persistence**: AsyncStorage or secure storage for sensitive tokens (see `.cursor/rules/supabase.md` if using Supabase).
- **Styling**: `StyleSheet.create` in `[Name].styles.ts` + theme tokens.
- **Testing**: Jest + **React Native Testing Library**.

## `[Name].styles.ts` (React Native)

- **Only** `StyleSheet.create(...)`; import theme from `@shared/theme` and numbers from `.constants.ts` when needed.
- **Never** export non-style values.

## Animation + gesture pattern (Reanimated)

Use `.hooks.ts` + `.config.ts` + `.constants.ts` + `.types.ts` + `.container.tsx` + `.tsx`:

```
[Name].hooks.ts     ← useXxxAnimation({ ... }) → { animatedStyle, gesture, ... }
[Name].config.ts    ← SPRING_CONFIG, TIMING_CONFIG (Easing, duration, …)
[Name].constants.ts ← thresholds, layout numbers
[Name].types.ts     ← AnimatedStyle, gesture types on props
[Name].container.tsx ← calls hook, passes props
[Name].tsx          ← pure JSX, GestureDetector + Animated.View
```

**Example:**

```typescript
// [Name].config.ts
import { Easing } from 'react-native-reanimated';
export const SLIDE_SPRING = { damping: 18, stiffness: 90, mass: 0.9 };
export const BUTTON_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };

// [Name].hooks.ts
export const useNameAnimation = ({ isActive, onNext }: UseNameAnimationProps) => {
  const opacity = useSharedValue(isActive ? 1 : 0);
  const gesture = Gesture.Tap().onEnd(() => { runOnJS(onNext)(); });
  return { animatedStyle: useAnimatedStyle(() => ({ opacity: opacity.value })), gesture };
};

// [Name].types.ts
import type { AnimatedStyle } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import type { ExclusiveGesture } from 'react-native-gesture-handler';
export interface NameProps {
  animatedStyle: AnimatedStyle<ViewStyle>;
  gesture: ExclusiveGesture;
}

// [Name].container.tsx
const { animatedStyle, gesture } = useNameAnimation({ isActive, onNext: handleNextClick });
return <Name animatedStyle={animatedStyle} gesture={gesture} ... />;

// [Name].tsx
export const Name = ({ animatedStyle, gesture, ...rest }: NameProps) => (
  <GestureDetector gesture={gesture}>
    <Animated.View style={animatedStyle}>...</Animated.View>
  </GestureDetector>
);
```

## Import order — example (React Native)

```typescript
import React, { useState, useCallback } from 'react';

import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNavigation } from '@react-navigation/native';
import Animated from 'react-native-reanimated';

import { AuthStackParamList } from '@app/navigation';

import { HabitCard } from '@components/HabitCard';

import { useAuthStore } from '@shared/store';
import { formatDate } from '@shared/utils';

import { Button, Input } from '@shared/components';
import { colors, spacing } from '@shared/theme';

import { Logo } from '@assets/icons';

import { useLoginForm } from './LoginScreen.hooks';
import { VALIDATION_RULES } from './LoginScreen.constants';

import { styles } from './LoginScreen.styles';

import type { LoginScreenProps } from './LoginScreen.types';
```

## New screen — React Navigation checklist

1. Register the screen in the relevant `*Navigator.tsx`.
2. Add params to `src/app/navigation/types.ts` (or your centralized navigation types file).

## Hard rules (React Native)

- Never use Reanimated gesture/animation logic inline in `.tsx` — use `.hooks.ts` and pass props.
- Never put Reanimated **config objects** (`withSpring`, `withTiming` options) inline in `.tsx` / `.container.tsx` — `.config.ts`.
- Never put gesture thresholds / magic layout numbers inline — `.constants.ts`.
- Prefer **RNTL** for component tests; mock native modules (`reanimated`, `gesture-handler`, etc.) per project `jestSetup`.

## Monorepo globs

If your mobile app lives elsewhere, add its path to the `globs` frontmatter of this file (e.g. `packages/native/**/*`).
