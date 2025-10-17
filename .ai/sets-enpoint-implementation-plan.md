# API Endpoint Implementation Plan: Create Set Endpoint (/api/sets)

## 1. Przegląd punktu końcowego

Endpoint POST `/api/sets` pozwala uwierzytelnionemu użytkownikowi stworzyć nowy zestaw pieśni. Dane zestawu (`name`, `content`) są zapisywane w tabeli `sets` z powiązaniem do `user_id` w `auth.users`.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Ścieżka: `/api/sets`
- Nagłówki:
  - `Content-Type: application/json`
  - `Authorization: Bearer <supabase-jwt>` — wymagane
- Parametry w body (JSON):
  - Wymagane:
    - `name` (string) — nazwa zestawu, niepusty ciąg
  - Opcjonalne:
    - `content` (string) — pole tekstowe z propozycjami pieśni (domyślnie pusty ciąg)

### Przykładowy Zod schema

```ts
const createSetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().optional().default(""),
});
```

## 3. Wykorzystywane typy

- CreateSetCommand:
  ```ts
  type CreateSetCommand = Pick<SetInsert, "name" | "content">;
  ```
- SetDto:
  ```ts
  type SetDto = Pick<Set, "id" | "name" | "content" | "created_at" | "updated_at">;
  ```
- CreateSetResponseDto:
  ```ts
  interface CreateSetResponseDto {
    data: SetDto;
  }
  ```

## 4. Szczegóły odpowiedzi

- Statusy:
  - `201 Created` — zestaw utworzony pomyślnie.
  - `400 Bad Request` — błąd walidacji inputu.
  - `401 Unauthorized` — brak lub nieprawidłowy token.
  - `409 Conflict` — konflikt unikalności nazwy (`sets_user_name_ci_idx`).
  - `500 Internal Server Error` — błąd serwera lub bazy.
- Struktura odpowiedzi:
  ```json
  {
    "data": {
      "id": "uuid",
      "name": "string",
      "content": "string",
      "created_at": "timestamptz",
      "updated_at": "timestamptz"
    }
  }
  ```

## 5. Przepływ danych

1. Handler w `src/pages/api/sets.ts`:

- Parsowanie i walidacja body przez `createSetSchema`.
- Odczyt `user` z `Astro.locals` (middleware Supabase).
- Wywołanie serwisu.

2. Service (`src/lib/services/sets.service.ts`):

- Metoda `create(userId: string, cmd: CreateSetCommand)`:
  1. Wywołanie Supabase client:

  ```ts
  const { data, error } = await supabase
    .from("sets")
    .insert([{ user_id: userId, ...cmd }])
    .single();
  ```

  2. Obsługa błędów unikalności i propagacja.
  3. Mapowanie `data` na `SetDto`.

3. Zwrócenie obiektu `CreateSetResponseDto` w handlerze.

## 6. Względy bezpieczeństwa

- Autoryzacja: middleware `src/middleware/index.ts` zapewnia `401` dla nieautoryzowanych.
- RLS w bazie wymusza, że użytkownik może czytać/edytować tylko swoje rekordy.
- Walidacja inputu w Zod zapobiega wstrzyknięciom.
- Użycie Prepared Statements przez Supabase JS SDK.

## 7. Obsługa błędów

- 400 Bad Request:
  - Błędna struktura JSON lub brak wymaganych pól.
- 401 Unauthorized:
  - Brak `Authorization` lub wygaśnięty token.
- 409 Conflict:
  - Błąd `error.code === '23505'` z Postgresa przy duplikacie nazwy.
- 500 Internal Server Error:
  - Inne wyjątki lub błąd bazy danych.

> **Logowanie**: Krytyczne błędy (500) logować w konsoli.

## 8. Rozważania dotyczące wydajności

- Index na kolumnie `user_id` w tabeli `sets`.
- Ograniczenie długości `name` (np. 200 znaków) oraz `content` (np. 2000 znaków) w Zod. Pole `content` jest opcjonalne i domyślnie puste.

## 9. Kroki implementacji

1. Utworzyć plik `src/pages/api/sets.ts` z handlerem POST.
2. Dodać Zod schema `createSetSchema` w tym pliku lub w `src/lib/schemas/sets.ts`.
3. Utworzyć lub zaktualizować serwis `src/lib/services/sets.service.ts`:
   - Metoda `create(userId, cmd)`.
4. W handlerze zaimportować `supabase` z `Astro.locals`, schema i serwis.
5. Mapować błędy na odpowiednie statusy (23505 → 409).
