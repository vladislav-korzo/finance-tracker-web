import { motion } from 'framer-motion';
import { ArrowDownCircle, ArrowUpCircle, Check, Pencil, Tags, Trash2 } from 'lucide-react';

import { EmptyState, SectionCard } from '@/components/blocks';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { CategoriesSkeleton } from '@/screens/CategoriesScreen/CategoriesScreen.skeleton';
import { categoriesHeaderClassName } from '@/screens/CategoriesScreen/CategoriesScreen.styles';
import type { CategoriesScreenProps } from '@/screens/CategoriesScreen/CategoriesScreen.types';
import {
  CATEGORY_COLOR_PRESETS,
  CATEGORY_ICON_NAMES,
} from '@/shared/constants/categoryAppearance';
import { cn } from '@/shared/lib/utils';
import { Stagger, StaggerItem } from '@/shared/ui/motion/Stagger';

import type { Category } from '@/shared/types/entities';

/** A single category card with its colored icon chip and hover actions. */
function CategoryCard({
  category,
  index,
  onEdit,
  onDelete,
}: {
  category: Category;
  index: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const color = category.color;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex items-center gap-3 rounded-xl border border-border/70 bg-surface-2 p-3 transition-shadow hover:shadow-card-hover"
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}22`, color }}
      >
        <CategoryIcon name={category.icon ?? 'Circle'} className="size-5" />
      </span>
      <p className="min-w-0 flex-1 truncate pr-1 font-semibold text-foreground">{category.name}</p>
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-lg bg-surface-2/85 opacity-0 backdrop-blur-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Редактировать ${category.name}`}
          onClick={() => onEdit(category)}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Удалить ${category.name}`}
          onClick={() => onDelete(category)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}

/** One SectionCard grouping all categories of a given type. */
function CategoryGroup({
  kind,
  items,
  onOpenEdit,
  onDelete,
}: {
  kind: 'income' | 'expense';
  items: Category[];
  onOpenEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const isIncome = kind === 'income';
  return (
    <SectionCard
      className="h-full"
      title={isIncome ? 'Доходы' : 'Расходы'}
      description={`Категорий: ${items.length}`}
      icon={isIncome ? ArrowUpCircle : ArrowDownCircle}
    >
      {items.length === 0 ? (
        <EmptyState
          icon={isIncome ? ArrowUpCircle : ArrowDownCircle}
          title={isIncome ? 'Нет категорий доходов' : 'Нет категорий расходов'}
          description="Добавьте категорию, чтобы помечать операции этого типа."
          size="sm"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((c, i) => (
            <CategoryCard
              key={c.id}
              category={c}
              index={i}
              onEdit={onOpenEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function CategoriesScreen(props: CategoriesScreenProps) {
  const {
    embedded,
    categories,
    loading,
    error,
    dialogOpen,
    editing,
    form,
    onOpenCreate,
    onOpenEdit,
    onCloseDialog,
    onSubmit,
    onDelete,
  } = props;

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <>
      <Stagger className="space-y-6">
        {!embedded ? (
          <StaggerItem className={categoriesHeaderClassName}>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Категории</h1>
              <p className="mt-1 text-sm text-muted-foreground">Группируйте доходы и расходы.</p>
            </div>
            <Button type="button" onClick={onOpenCreate}>
              Добавить категорию
            </Button>
          </StaggerItem>
        ) : null}

        {error ? (
          <StaggerItem>
            <p className="text-sm text-destructive">{error}</p>
          </StaggerItem>
        ) : null}

        {embedded ? (
          <StaggerItem className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-foreground">
                <Tags className="size-5" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Категории
                </h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? 'Загрузка…' : `Всего: ${categories.length}`}
                </p>
              </div>
            </div>
            <Button type="button" onClick={onOpenCreate}>
              Добавить категорию
            </Button>
          </StaggerItem>
        ) : null}

        <StaggerItem>
          {loading ? (
            <CategoriesSkeleton />
          ) : categories.length === 0 ? (
            <SectionCard icon={Tags} title="Ваши категории" description="Всего: 0">
              <EmptyState
                icon={Tags}
                title="Пока нет категорий"
                description="Создайте первую категорию, чтобы помечать доходы и расходы."
                action={
                  <Button type="button" onClick={onOpenCreate}>
                    Создать категорию
                  </Button>
                }
              />
            </SectionCard>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <CategoryGroup
                kind="income"
                items={incomeCategories}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
              />
              <CategoryGroup
                kind="expense"
                items={expenseCategories}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
              />
            </div>
          )}
        </StaggerItem>
      </Stagger>

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && onCloseDialog()}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
            <DialogDescription>
              Категории доходов и расходов раздельны при выборе в формах.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" placeholder="Например, Продукты" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Доход</SelectItem>
                        <SelectItem value="expense">Расход</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цвет</FormLabel>
                    <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-9">
                      {CATEGORY_COLOR_PRESETS.map((hex) => {
                        const selected = field.value === hex;
                        return (
                          <button
                            key={hex}
                            type="button"
                            title={hex}
                            aria-label={hex}
                            aria-pressed={selected}
                            className={cn(
                              'relative flex aspect-square items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-primary',
                              selected ? 'scale-105 ring-primary' : 'ring-transparent'
                            )}
                            style={{ backgroundColor: hex }}
                            onClick={() => field.onChange(hex)}
                          >
                            {selected ? (
                              <Check className="size-4 text-white drop-shadow" strokeWidth={3} />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => {
                  const activeColor = form.watch('color');
                  return (
                    <FormItem>
                      <FormLabel>Иконка</FormLabel>
                      <div className="grid max-h-52 grid-cols-6 gap-2 overflow-y-auto rounded-xl border border-border/70 bg-surface-2 p-2.5 sm:grid-cols-8">
                        {CATEGORY_ICON_NAMES.map((iconName) => {
                          const selected = field.value === iconName;
                          return (
                            <button
                              key={iconName}
                              type="button"
                              title={iconName}
                              aria-label={iconName}
                              aria-pressed={selected}
                              className={cn(
                                'flex aspect-square items-center justify-center rounded-lg ring-2 transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-primary',
                                selected
                                  ? 'bg-card text-foreground shadow-card ring-primary'
                                  : 'text-muted-foreground ring-transparent'
                              )}
                              style={selected ? { color: activeColor } : undefined}
                              onClick={() => field.onChange(iconName)}
                            >
                              <CategoryIcon name={iconName} className="size-5" />
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {form.watch('type') === 'expense' ? (
                <FormField
                  control={form.control}
                  name="monthlyLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Месячный лимит трат (необязательно)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Без лимита"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
              {form.formState.errors.root?.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onCloseDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Сохранение…' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
