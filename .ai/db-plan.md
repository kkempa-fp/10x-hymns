# Schemat bazy danych - 10x-hymns

## 1. Lista tabel

### hymns

- `id` uuid primary key default gen_random_uuid()
- `number` varchar(10) not null unique
- `category` varchar(100) not null
- `name` varchar(200) not null
- `text` text not null
- `embedding` vector(768) not null
- _Uwagi:_ wymaga rozszerzenia `pgvector`.

### sets

- `id` uuid primary key default gen_random_uuid()
- `user_id` uuid not null references auth.users(id) on delete cascade
- `name` varchar(200) not null
- `entrance` varchar(200) not null default ''
- `offertory` varchar(200) not null default ''
- `communion` varchar(200) not null default ''
- `adoration` varchar(200) not null default ''
- `recessional` varchar(200) not null default ''
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()
- _Uwagi:_ kolumna `updated_at` aktualizowana przez trigger (patrz sekcja 5) przy każdej modyfikacji rekordu.

### ratings

- `id` uuid primary key default gen_random_uuid()
- `user_id` uuid references auth.users(id) on delete set null
- `proposed_hymn_numbers` integer[] not null default '{}'
- `rating` text not null check (rating in ('up', 'down'))
- `created_at` timestamptz not null default now()
- `client_fingerprint` text not null
- _Uwagi:_ brak klucza obcego do `hymns` zgodnie z decyzją MVP.

## 2. Relacje między tabelami

- `sets.user_id` → `auth.users.id` (relacja wiele-do-jednego; jeden użytkownik ma wiele zestawów).
- `ratings.user_id` → `auth.users.id` (relacja wiele-do-jednego opcjonalna; ocena może być powiązana z użytkownikiem lub anonimowa).
- Pozostałe kolumny przechowywane są jako dane tekstowe lub tablice zgodnie z ustaleniami (brak relacji do `hymns` dla propozycji).

## 3. Indeksy

- `CREATE INDEX hymns_embedding_hnsw_idx ON public.hymns USING hnsw (embedding vector_l2_ops);`
- `CREATE INDEX hymns_name_trgm_idx ON public.hymns USING gin (name gin_trgm_ops);`
- `CREATE UNIQUE INDEX sets_user_name_ci_idx ON public.sets (user_id, lower(name));`
- `CREATE INDEX sets_name_trgm_idx ON public.sets USING gin (name gin_trgm_ops);`
- `CREATE INDEX ratings_user_idx ON public.ratings (user_id);`

## 4. Zasady RLS (Row-Level Security)

- `ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY sets_select_own ON public.sets FOR SELECT USING (auth.uid() = user_id);`
  - `CREATE POLICY sets_insert_own ON public.sets FOR INSERT WITH CHECK (auth.uid() = user_id);`
  - `CREATE POLICY sets_update_own ON public.sets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
  - `CREATE POLICY sets_delete_own ON public.sets FOR DELETE USING (auth.uid() = user_id);`

- `ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY ratings_insert_all ON public.ratings FOR INSERT WITH CHECK (true);`
  - `CREATE POLICY ratings_owner_select_update ON public.ratings FOR SELECT USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
  - `CREATE POLICY ratings_owner_delete ON public.ratings FOR DELETE USING (auth.uid() = user_id);`

- `ALTER TABLE public.hymns DISABLE ROW LEVEL SECURITY;` (tabela publiczna tylko do odczytu)

## 5. Dodatkowe uwagi

- Wymagane rozszerzenia: `CREATE EXTENSION IF NOT EXISTS pgvector;`, `CREATE EXTENSION IF NOT EXISTS pg_trgm;`, `CREATE EXTENSION IF NOT EXISTS pgcrypto;` (dla `gen_random_uuid()`).
- Trigger automatycznie aktualizujący `sets.updated_at` (prosty wariant ustawiający zawsze now()):

  ```sql
  CREATE OR REPLACE FUNCTION public.sets_touch_updated_at()
  RETURNS trigger AS $$
  BEGIN
    NEW.updated_at := now();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER sets_touch_updated_at
  BEFORE UPDATE ON public.sets
  FOR EACH ROW
  EXECUTE FUNCTION public.sets_touch_updated_at();
  ```

- Pola `proposed_hymn_numbers` w tabeli `ratings` przechowują identyfikatory numeryczne pieśni zaproponowanych w pojedynczym wyniku wyszukiwania; pozostają jako dane referencyjne bez wymuszania integralności z `hymns` w MVP.
- Kolumna `client_fingerprint` umożliwia heurystyczne ograniczenie wielokrotnych ocen z jednej sesji przeglądarki przez użytkowników niezalogowanych.
- Indeksy trigramowe (`gin_trgm_ops`) wspierają wyszukiwanie przybliżone po `hymns.name` oraz `sets.name`, zgodnie z wymaganiami filtrowania.
- Ujednolicenie typu kluczy głównych na `uuid` (zamiast mieszanki bigint/uuid) upraszcza typy DTO, serializację i potencjalną replikację; koszt dodatkowy UUID jest pomijalny dla skali MVP.
- Unikalność `hymns.number` zapewnia implicit indeks btree używany do szybkich wyszukiwań po numerze; brak potrzeby tworzenia dodatkowego indeksu.
