-- Демо-данные для просмотра UI: для каждого пользователя из auth.users,
-- у которого ещё нет счетов, создаются кошельки, категории, цели и транзакции.
-- Повторный запуск миграции не дублирует данные для тех, у кого уже есть счета.
--
-- Важно: если на момент применения миграции в auth.users никого нет, данные не
-- появятся — зарегистрируйте пользователя и выполните скрипт вручную в SQL Editor
-- или сделайте supabase db reset после появления тестового пользователя.

DO $seed$
DECLARE
  uid uuid;
  acc_rub uuid;
  acc_usd uuid;
  acc_eur uuid;
  acc_byn uuid;
  c_salary uuid;
  c_freelance uuid;
  c_cashback uuid;
  c_food uuid;
  c_transport uuid;
  c_fun uuid;
  c_sub uuid;
  c_rest uuid;
  c_health uuid;
  c_clothes uuid;
  c_home uuid;
  d date;
  i int;
  acc_pick uuid;
  cat_exp uuid;
  cat_inc uuid;
  amt numeric;
  users_total int;
  users_seeded int := 0;
  users_skipped int := 0;
  note_idx int;
  has_budget_goals boolean;
  expense_notes text[] := ARRAY[
    'Пятёрочка',
    'Перекрёсток',
    'Метро',
    'Яндекс Go',
    'Кинотеатр',
    'Netflix',
    'Spotify',
    'Кофе с собой',
    'Обед в офисе',
    'Аптека',
    'Ozon',
    'Wildberries',
    'Бензин',
    'Сервис Apple',
    'ChatGPT Plus',
    'Обед с коллегами',
    'Стрижка',
    'Спортзал',
    'Книги',
    'Цветы'
  ];
  income_notes text[] := ARRAY[
    'Аванс',
    'Фриланс — проект',
    'Кэшбэк по карте',
    'Продажа на Авито',
    'Подарок',
    'Возврат налога',
    'Премия'
  ];
  sal_date date;
  today_utc date;
BEGIN
  SET LOCAL search_path = public, auth, pg_temp;

  today_utc := timezone('utc', now())::date;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'budget_goals'
  )
  INTO has_budget_goals;

  IF NOT has_budget_goals THEN
    RAISE NOTICE 'seed_demo_finance_data: таблица public.budget_goals отсутствует — демо-цели пропущены. Добавьте миграцию 20260419120000_budget_goals.sql или создайте таблицу.';
  END IF;

  SELECT count(*)::int INTO users_total FROM auth.users;

  IF users_total = 0 THEN
    RAISE NOTICE 'seed_demo_finance_data: в auth.users нет пользователей — демо-данные не созданы.';
    RETURN;
  END IF;

  FOR uid IN
    SELECT u.id
    FROM auth.users AS u
    WHERE u.id IS NOT NULL
    ORDER BY u.created_at
  LOOP
    IF EXISTS (SELECT 1 FROM public.accounts AS a WHERE a.user_id = uid LIMIT 1) THEN
      users_skipped := users_skipped + 1;
      CONTINUE;
    END IF;

    -- Четыре валюты как в ACCOUNT_CURRENCY_CODES (см. src/shared/constants/accountCurrencies.ts)
    INSERT INTO public.accounts (user_id, name, currency)
    VALUES (uid, 'Основной счёт', 'BYN')
    RETURNING id INTO acc_rub;

    INSERT INTO public.accounts (user_id, name, currency)
    VALUES (uid, 'Долларовая карта', 'USD')
    RETURNING id INTO acc_usd;

    INSERT INTO public.accounts (user_id, name, currency)
    VALUES (uid, 'Евро-счёт', 'EUR')
    RETURNING id INTO acc_eur;

    INSERT INTO public.accounts (user_id, name, currency)
    VALUES (uid, 'Рублёвый резерв', 'RUB')
    RETURNING id INTO acc_byn;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Зарплата', 'income')
    RETURNING id INTO c_salary;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Фриланс', 'income')
    RETURNING id INTO c_freelance;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Кэшбэк', 'income')
    RETURNING id INTO c_cashback;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Продукты', 'expense')
    RETURNING id INTO c_food;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Транспорт', 'expense')
    RETURNING id INTO c_transport;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Развлечения', 'expense')
    RETURNING id INTO c_fun;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Подписки', 'expense')
    RETURNING id INTO c_sub;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Рестораны', 'expense')
    RETURNING id INTO c_rest;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Здоровье', 'expense')
    RETURNING id INTO c_health;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Одежда', 'expense')
    RETURNING id INTO c_clothes;

    INSERT INTO public.categories (user_id, name, type)
    VALUES (uid, 'Дом и быт', 'expense')
    RETURNING id INTO c_home;

    IF has_budget_goals THEN
      INSERT INTO public.budget_goals (user_id, name, target_amount, saved_amount)
      VALUES
        (uid, 'Отпуск в Турции', 200000, 45200),
        (uid, 'Новый MacBook', 180000, 112500),
        (uid, 'Резервный фонд', 500000, 198400),
        (uid, 'Ремонт кухни', 350000, 67000);
    END IF;

    -- Зарплата: 1-е число каждого месяца за последние 6 месяцев (дата в UTC, как в default occurred_at)
    FOR sal_date IN
      SELECT (
        date_trunc('month', timezone('utc', now())::timestamp)
        + (n * interval '1 month')
      )::date
      FROM generate_series(-5, 0) AS n
    LOOP
      INSERT INTO public.transactions (
        user_id,
        account_id,
        category_id,
        amount,
        type,
        occurred_at,
        note
      )
      VALUES (
        uid,
        acc_rub,
        c_salary,
        round((150000 + random() * 25000)::numeric, 2),
        'income',
        sal_date,
        'Зарплата (' || to_char(sal_date, 'YYYY-MM-DD') || ')'
      );
    END LOOP;

    -- Дополнительные доходы (без дублирования слова «Зарплата» в заметках — она уже отдельными проводками)
    FOR i IN 1..14 LOOP
      d := today_utc - (floor(random() * 85))::int;
      cat_inc := (ARRAY [c_freelance, c_cashback, c_freelance, c_cashback, c_freelance]) [1 + (floor(random() * 5)::int)];
      note_idx := 1 + (floor(random() * cardinality(income_notes)))::int;
      CASE floor(random() * 6)
        WHEN 0 THEN
          acc_pick := acc_usd;
          amt := round((80 + random() * 2500)::numeric, 2);
        WHEN 1 THEN
          acc_pick := acc_eur;
          amt := round((70 + random() * 2200)::numeric, 2);
        ELSE
          acc_pick := acc_rub;
          amt := round((2000 + random() * 45000)::numeric, 2);
      END CASE;
      INSERT INTO public.transactions (
        user_id,
        account_id,
        category_id,
        amount,
        type,
        occurred_at,
        note
      )
      VALUES (
        uid,
        acc_pick,
        cat_inc,
        amt,
        'income',
        d,
        income_notes [note_idx]
      );
    END LOOP;

    -- Расходы
    FOR i IN 1..85 LOOP
      d := today_utc - (floor(random() * 100))::int;
      cat_exp := (ARRAY [c_food, c_transport, c_fun, c_sub, c_rest, c_health, c_clothes, c_home]) [1 + (floor(random() * 8)::int)];
      note_idx := 1 + (floor(random() * cardinality(expense_notes)))::int;
      CASE floor(random() * 20)
        WHEN 0 THEN
          acc_pick := acc_usd;
          amt := round((3 + random() * 180)::numeric, 2);
        WHEN 1 THEN
          acc_pick := acc_eur;
          amt := round((3 + random() * 160)::numeric, 2);
        WHEN 2 THEN
          acc_pick := acc_byn;
          amt := round((40 + random() * 900)::numeric, 2);
        ELSE
          acc_pick := acc_rub;
          amt := round((120 + random() * 8500)::numeric, 2);
      END CASE;
      INSERT INTO public.transactions (
        user_id,
        account_id,
        category_id,
        amount,
        type,
        occurred_at,
        note
      )
      VALUES (
        uid,
        acc_pick,
        cat_exp,
        amt,
        'expense',
        d,
        expense_notes [note_idx]
      );
    END LOOP;

    -- Явные операции: категории согласованы с описанием
    INSERT INTO public.transactions (
      user_id,
      account_id,
      category_id,
      amount,
      type,
      occurred_at,
      note
    )
    VALUES
      (uid, acc_usd, c_clothes, 1099.00, 'expense', today_utc - 12, 'iPhone 15 — Apple'),
      (uid, acc_usd, c_sub, 15.00, 'expense', today_utc - 5, 'Figma Professional'),
      (uid, acc_eur, c_sub, 14.99, 'expense', today_utc - 20, 'Netflix — годовая подписка'),
      (uid, acc_rub, c_transport, 45000.00, 'expense', today_utc - 45, 'Шины и сезонная смена');

    users_seeded := users_seeded + 1;
    RAISE NOTICE 'seed_demo_finance_data: созданы демо-данные для пользователя %', uid;
  END LOOP;

  IF users_seeded = 0 AND users_skipped > 0 THEN
    RAISE NOTICE 'seed_demo_finance_data: пропущено пользователей (уже есть счета): %', users_skipped;
  ELSIF users_seeded > 0 THEN
    RAISE NOTICE 'seed_demo_finance_data: готово — заполнено пользователей: %, пропущено: %', users_seeded, users_skipped;
  END IF;
END;
$seed$;
