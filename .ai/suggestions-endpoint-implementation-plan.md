# API Endpoint Implementation Plan: Suggestions Endpoint (/api/suggestions)

## 1. Przegląd endpointa

Endpoint POST `/api/suggestions` przyjmuje tekst liturgiczny i generuje listę propozycji pieśni na podstawie podobieństwa ich wektorów osadzających (embeddings). Aplikacja wysyła embedding tekstu do zewnętrznej usługi AI, a następnie wykonuje zapytanie similarity search w tabeli `hymns` z wykorzystaniem rozszerzenia `pgvector`.

Wersja produkcyjna wspiera dwa tryby pracy:

- **full** – dostępny dla zalogowanych użytkowników; wykorzystuje prawdziwe embeddingi Gemini.
- **demo** – dostępny dla gości; wykorzystuje deterministyczne wektory mockujące, aby pokazać działanie bez kosztów API.

## 2. Szczegóły żądania

- Metoda HTTP: POST
- Ścieżka: `/api/suggestions`
- Nagłówki:
  - `Content-Type: application/json`
- Parametry żądania w body:
  - Wymagane:
    - `text` (string) — treść liturgiczna, na podstawie której generujemy suggestion embeddings.
  - Opcjonalne:
    - `count` (integer) — liczba wyników do zwrócenia, domyślnie 3.

### Zod schema (przykład)

```ts
const generateSuggestionsSchema = z.object({
  text: z.string().min(1, "Text must be non-empty"),
  count: z.number().int().positive().optional().default(3),
});
```

## 3. Wykorzystywane typy

- GenerateSuggestionsCommand (DTO input):
  ```ts
  interface GenerateSuggestionsCommand {
    text: string;
    count?: number;
  }
  ```
- SuggestionDto (DTO pojedynczej propozycji):
  ```ts
  type SuggestionDto = Pick<Hymn, "number" | "name" | "category">;
  ```
- GenerateSuggestionsResponseDto (DTO output):

  ```ts
  type SuggestionsMode = "full" | "demo";

  interface GenerateSuggestionsResponseDto {
    data: SuggestionDto[];
    meta: {
      mode: SuggestionsMode;
    };
  }
  ```

## 4. Szczegóły odpowiedzi

- Statusy:
  - `200 OK` — poprawne zwrócenie listy propozycji.
  - `400 Bad Request` — niepoprawne lub brakujące pola (np. puste `text`).
  - `500 Internal Server Error` — błąd generowania embeddingów lub zapytania do bazy.
- Struktura odpowiedzi (JSON):
  ```json
  {
    "data": [
      { "number": "string", "name": "string", "category": "string" }
      // ...
    ],
    "meta": {
      "mode": "full" | "demo"
    }
  }
  ```
  Klient może na podstawie `meta.mode` komunikować użytkownikowi, czy wynik pochodzi z prawdziwego modelu AI, czy z wersji demonstracyjnej.

## 5. Przepływ danych

1. API route w `src/pages/api/suggestions.ts`:

- Parsowanie i walidacja żądania za pomocą Zod.
- Odczyt `locals.user?.id`, przekazanie go do serwisu.
- Wywołanie serwisu `suggestions.service`.

2. Service (`src/lib/services/suggestions.service.ts`):

- Funkcja `generate(command: GenerateSuggestionsCommand, options?: { userId?: string | null })`:
  1. Dla zalogowanych (`options.userId`) – pobranie embeddingu z Gemini.
  2. Dla gości – wygenerowanie deterministycznego wektora mockującego (`createMockEmbeddingVector`).
  3. Zapytanie do Supabase/PostgreSQL:
     ```sql
     SELECT number, name, category
     FROM hymns
     ORDER BY embedding <=> $1
     LIMIT $2;
     ```
  4. Mapowanie wyniku na `SuggestionDto[]`.
- Zwraca `GenerateSuggestionsResponseDto`.

3. Obsluga błędów w serwisie i propagacja wyjątków do API route.

## 6. Względy bezpieczeństwa

- Autoryzacja:
  - Endpoint jest publiczny, ale tylko zalogowani użytkownicy wywołują kosztowne embeddingi.
  - Middleware Supabase dostarcza `locals.user`; jego brak powoduje przełączenie w tryb demo bez błędu.
  - Programistyczne integracje mogą nadal wysyłać token w nagłówku `Authorization`.
- Walidacja:
  - Wczesne zwrócenie `400` przy niepoprawnych danych wejściowych.
- Uwierzytelnianie zewnętrznej usługi AI:
  - Przechowywać klucze API jako `import.meta.env.AI_API_KEY`.
  - Obsługiwać limity i błędy sieciowe w serwisie.

## 7. Obsługa błędów

- 400 Bad Request:
  - Brak `text` albo pusty string.
  - `count` nie jest liczbą dodatnią.
- 401 Unauthorized:
  - Nie dotyczy domyślnej wersji (goście trafiają do trybu demo), ale może wystąpić, jeśli wymusimy autoryzację w przyszłości.
- 500 Internal Server Error:
  - Błąd generowania embeddingu (timeout, niepoprawna odpowiedź).
  - Błąd zapytania SQL (np. błąd bazy, brak rozszerzenia `pgvector`).

> **Logowanie**: Błędy krytyczne (500) logować w konsoli serwera.

## 8. Rozważania dotyczące wydajności

- Indeks wektora (`ANN index`) na kolumnie `embedding` w tabeli `hymns` dla szybkiego similarity search.
- Ograniczenie maksymalnego `count` (np. do 10) by uniknąć nadmiernych obciążeń.
- Asynchroniczne przetwarzanie embeddingu z timeouts i retry.

## 9. Kroki implementacji

1. Utworzyć plik route: `src/pages/api/suggestions.ts`.
2. Zdefiniować i wyeksportować Zod schema (`generateSuggestionsSchema`).
3. Stworzyć DTO w `src/types.ts` (sprawdzić, czy już istnieją i ewentualnie dodać).
4. Utworzyć serwis: `src/lib/services/suggestion.service` z metodą `generate`:
   - Konfiguracja klienta AI API.
   - Metoda do pobierania embeddingów i zapytania do bazy.
5. W route zaimportować schema, serwis i zaprogramować handler:
   - Walidacja input
   - Wywołanie serwisu
   - Zwrócenie JSON z kodem 200
   - Obsługa wyjątków i mapping kodów stanu
6. Dodać mechanizm uwierzytelniania poprzez Supabase Auth.
