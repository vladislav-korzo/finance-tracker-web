import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Check,
  CircleArrowDown,
  CircleArrowUp,
  Plus,
  Tags,
  Trash2,
} from 'lucide-react-native';
import * as React from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryIcon } from '@components/CategoryIcon';
import { CATEGORY_ICON_MAP } from '@/shared/constants/categoryIconMap';
import type { CategoryIconName } from '@/shared/constants/categoryAppearance';
import { confirm } from '@components/ConfirmDialog';
import { EmptyState, ScreenHeader, SectionCard } from '@components/blocks';
import { Button } from '@components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Text } from '@components/ui/text';
import { Skeleton } from '@components/ui/skeleton';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_ICON_NAMES,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  normalizeCategoryColor,
} from '@/shared/constants/categoryAppearance';
import { useCategoryStore } from '@/shared/store/categoryStore';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { useToken } from '@/shared/theme/tokens';
import { formatMoney } from '@/shared/utils/format';
import type { Category } from '@/shared/types/entities';

import {
  categoryFormSchema,
  type CategoryFormInput,
  type CategoryFormValues,
} from '@screens/CategoriesScreen/CategoriesScreen.formConfig';

const EMPTY_FORM: CategoryFormInput = {
  name: '',
  type: 'expense',
  icon: DEFAULT_CATEGORY_ICON,
  color: DEFAULT_CATEGORY_COLOR,
  monthlyLimit: '',
};

/* -------------------------------------------------------------------------- */
/* Category row — canonical anatomy: leading CategoryIcon + name + subtitle.    */
/* Whole row taps to edit; delete lives inside the edit sheet (no inline        */
/* pencil/trash), matching the Home / Transactions row anatomy.                 */
/* -------------------------------------------------------------------------- */

function CategoryRow({
  category,
  currency,
  divider,
  onEdit,
}: {
  category: Category;
  currency: string;
  divider: boolean;
  onEdit: (category: Category) => void;
}) {
  const hasLimit = category.type === 'expense' && category.monthly_limit != null;
  // Subtitle: the spend limit when set, otherwise the plain income/expense label.
  const subtitle = hasLimit
    ? `Лимит: ${formatMoney(category.monthly_limit as number, currency)}`
    : category.type === 'income'
      ? 'Доход'
      : 'Расход';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Изменить: ${category.name}`}
      onPress={() => onEdit(category)}
      className={
        divider
          ? 'flex-row items-center gap-3 border-t border-border px-4 py-3.5 active:opacity-70'
          : 'flex-row items-center gap-3 px-4 py-3.5 active:opacity-70'
      }
    >
      <CategoryIcon iconName={category.icon || 'Circle'} color={category.color} size={20} />
      <View className="min-w-0 flex-1">
        <Text weight="medium" numberOfLines={1} className="text-[15px] text-foreground">
          {category.name}
        </Text>
        <Text numberOfLines={1} className="mt-0.5 text-[12px] text-muted-foreground">
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* One typed group: a small section header + a clean card list of rows.         */
/* -------------------------------------------------------------------------- */

function CategoryGroup({
  kind,
  items,
  currency,
  onEdit,
}: {
  kind: 'income' | 'expense';
  items: Category[];
  currency: string;
  onEdit: (category: Category) => void;
}) {
  const isIncome = kind === 'income';
  return (
    <View className="gap-3">
      <Text weight="semibold" className="text-[17px] tracking-tight text-foreground">
        {isIncome ? 'Доходы' : 'Расходы'}
      </Text>
      {items.length === 0 ? (
        <EmptyState
          icon={isIncome ? CircleArrowUp : CircleArrowDown}
          title={isIncome ? 'Нет категорий доходов' : 'Нет категорий расходов'}
          description="Добавьте категорию, чтобы помечать операции этого типа."
          size="sm"
        />
      ) : (
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((c, i) => (
            <CategoryRow
              key={c.id}
              category={c}
              currency={currency}
              divider={i > 0}
              onEdit={onEdit}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading skeleton                                                            */
/* -------------------------------------------------------------------------- */

function CategoriesSkeleton() {
  return (
    <View className="gap-6">
      {[0, 1].map((group) => (
        <View key={group} className="gap-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          <View className="overflow-hidden rounded-2xl border border-border bg-card">
            {[0, 1, 2].map((row) => (
              <View
                key={row}
                className={
                  row > 0
                    ? 'flex-row items-center gap-3 border-t border-border px-4 py-3.5'
                    : 'flex-row items-center gap-3 px-4 py-3.5'
                }
              >
                <Skeleton className="size-9 rounded-xl" />
                <View className="flex-1 gap-2">
                  <Skeleton className="h-4 w-2/5 rounded-md" />
                  <Skeleton className="h-3 w-1/4 rounded-md" />
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Color & icon pickers (swatch grids)                                         */
/* -------------------------------------------------------------------------- */

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {CATEGORY_COLOR_PRESETS.map((hex) => {
        const selected = value === hex;
        return (
          <Pressable
            key={hex}
            accessibilityRole="button"
            accessibilityLabel={hex}
            accessibilityState={{ selected }}
            onPress={() => onChange(hex)}
            hitSlop={4}
            className="items-center justify-center rounded-full"
            style={{
              width: 36,
              height: 36,
              backgroundColor: hex,
              borderWidth: selected ? 3 : 0,
              borderColor: '#ffffff',
              transform: selected ? [{ scale: 1.06 }] : undefined,
            }}
          >
            {selected ? <Check size={16} color="#ffffff" strokeWidth={3} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function IconPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (name: string) => void;
}) {
  const mutedColor = useToken('muted-foreground');
  return (
    <View className="max-h-56 rounded-xl border border-border bg-surface-2 p-2.5">
      <ScrollView
        nestedScrollEnabled
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-row flex-wrap gap-2"
      >
        {CATEGORY_ICON_NAMES.map((iconName) => {
          const selected = value === iconName;
          return (
            <Pressable
              key={iconName}
              accessibilityRole="button"
              accessibilityLabel={iconName}
              accessibilityState={{ selected }}
              onPress={() => onChange(iconName)}
              className={
                selected
                  ? 'items-center justify-center rounded-lg border border-primary bg-card shadow-sm'
                  : 'items-center justify-center rounded-lg border border-transparent'
              }
              style={{ width: 46, height: 46 }}
            >
              <CategoryIconGlyph name={iconName} color={selected ? color : mutedColor} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/** Bare Lucide glyph (no chip) for the picker — reuses the shared icon map. */
function CategoryIconGlyph({ name, color }: { name: string; color: string }) {
  // CategoryIcon always wraps in a colored chip; for the picker we want the raw
  // glyph, so render the icon component from the shared map directly.
  const Icon = CATEGORY_ICON_MAP[name as CategoryIconName] ?? CATEGORY_ICON_MAP.Circle;
  return <Icon size={20} color={color} />;
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                       */
/* -------------------------------------------------------------------------- */

export default function CategoriesScreen() {
  const {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();
  const currency = useSettingsStore((s) => s.defaultCurrency);

  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // resolvers v5 narrows `icon` on output (type-guard refine), so the form is
  // typed with its input shape and CategoryFormValues as the transformed output.
  const form = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: EMPTY_FORM,
  });

  React.useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const incomeCategories = React.useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories],
  );
  const expenseCategories = React.useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories],
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCategories();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories]);

  const onOpenCreate = React.useCallback(() => {
    setEditing(null);
    form.reset(EMPTY_FORM);
    setSheetOpen(true);
  }, [form]);

  const onOpenEdit = React.useCallback(
    (category: Category) => {
      setEditing(category);
      form.reset({
        name: category.name,
        type: category.type,
        icon: category.icon || DEFAULT_CATEGORY_ICON,
        color: normalizeCategoryColor(category.color || DEFAULT_CATEGORY_COLOR),
        monthlyLimit: category.monthly_limit != null ? String(category.monthly_limit) : '',
      });
      setSheetOpen(true);
    },
    [form],
  );

  const onCloseSheet = React.useCallback(() => {
    setSheetOpen(false);
    setEditing(null);
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const parsedLimit =
        values.type === 'expense' && values.monthlyLimit && values.monthlyLimit.trim() !== ''
          ? Number(values.monthlyLimit)
          : null;
      const monthlyLimit = parsedLimit != null && parsedLimit > 0 ? parsedLimit : null;
      if (editing) {
        await updateCategory(
          editing.id,
          values.name,
          values.type,
          values.icon,
          values.color,
          monthlyLimit,
        );
      } else {
        await createCategory(values.name, values.type, values.icon, values.color, monthlyLimit);
      }
      onCloseSheet();
    } catch (e) {
      form.setError('root', { message: (e as Error).message });
    }
  });

  const onDelete = React.useCallback(async () => {
    if (!editing) return;
    const ok = await confirm({
      title: 'Удалить категорию?',
      description: `«${editing.name}». У связанных транзакций категория станет пустой.`,
      confirmText: 'Удалить',
      destructive: true,
    });
    if (!ok) return;
    await deleteCategory(editing.id);
    onCloseSheet();
  }, [editing, deleteCategory, onCloseSheet]);

  const isEmpty = !loading && categories.length === 0;
  const showSkeleton = loading && categories.length === 0;
  const type = form.watch('type');
  const submitting = form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.message;

  // Icon colors resolved once from the active theme (RN needs literal colors).
  const addIconColor = useToken('primary-foreground');
  const destructiveColor = useToken('destructive');
  const refreshTint = useToken('muted-foreground');

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <ScreenHeader
        title="Категории"
        subtitle="Группируйте доходы и расходы."
        action={
          <Button size="icon" accessibilityLabel="Добавить категорию" onPress={onOpenCreate}>
            <Plus size={20} color={addIconColor} />
          </Button>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-1 gap-6"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={refreshTint} />
        }
      >
        {error ? (
          <View className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5">
            <Text weight="medium" className="text-sm text-destructive">
              {error}
            </Text>
          </View>
        ) : null}

        {showSkeleton ? (
          <CategoriesSkeleton />
        ) : isEmpty ? (
          <SectionCard icon={Tags} title="Ваши категории" description="Всего: 0">
            <EmptyState
              icon={Tags}
              title="Пока нет категорий"
              description="Создайте первую категорию, чтобы помечать доходы и расходы."
              action={<Button onPress={onOpenCreate}>Создать категорию</Button>}
            />
          </SectionCard>
        ) : (
          <Stagger className="gap-6">
            <StaggerItem>
              <CategoryGroup
                kind="income"
                items={incomeCategories}
                currency={currency}
                onEdit={onOpenEdit}
              />
            </StaggerItem>
            <StaggerItem>
              <CategoryGroup
                kind="expense"
                items={expenseCategories}
                currency={currency}
                onEdit={onOpenEdit}
              />
            </StaggerItem>
          </Stagger>
        )}
      </ScrollView>

      {/* Create / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => (open ? setSheetOpen(true) : onCloseSheet())} snapPoints={['90%']}>
        <SheetHeader>
          <SheetTitle>{editing ? 'Редактировать категорию' : 'Новая категория'}</SheetTitle>
          <Text className="text-sm text-muted-foreground">
            Категории доходов и расходов раздельны при выборе в формах.
          </Text>
        </SheetHeader>

        <SheetContent contentContainerClassName="gap-5 pb-4">
          <Form {...form}>
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={() => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например, Продукты"
                      autoCapitalize="sentences"
                      autoCorrect={false}
                      returnKeyType="done"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList>
                      <TabsTrigger value="income">Доход</TabsTrigger>
                      <TabsTrigger value="expense">Расход</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цвет</FormLabel>
                  <ColorPicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Иконка</FormLabel>
                  <IconPicker
                    value={field.value}
                    color={form.watch('color')}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monthly limit (expense only) */}
            {type === 'expense' ? (
              <FormField
                control={form.control}
                name="monthlyLimit"
                render={() => (
                  <FormItem>
                    <FormLabel>Месячный лимит трат (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Без лимита"
                        keyboardType="numeric"
                        returnKeyType="done"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}

            {rootError ? (
              <Text weight="medium" className="text-sm text-destructive">
                {rootError}
              </Text>
            ) : null}

            {/* Delete lives in the edit sheet so the category rows stay clean. */}
            {editing ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Удалить категорию"
                onPress={onDelete}
                disabled={submitting}
                className="h-12 flex-row items-center justify-center gap-2 rounded-xl active:opacity-70"
              >
                <Trash2 size={18} color={destructiveColor} />
                <Text weight="semibold" className="text-destructive">
                  Удалить
                </Text>
              </Pressable>
            ) : null}
          </Form>
        </SheetContent>

        <SheetFooter>
          <Button variant="outline" onPress={onCloseSheet} disabled={submitting}>
            Отмена
          </Button>
          <Button onPress={onSubmit} loading={submitting}>
            {submitting ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </SheetFooter>
      </Sheet>
    </SafeAreaView>
  );
}
