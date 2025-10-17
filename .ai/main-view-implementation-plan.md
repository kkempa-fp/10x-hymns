# Plan implementacji widoku Głównego

## 1. Przegląd

Widok główny jest centralnym punktem aplikacji, dostępnym pod głównym adresem URL (`/`). Jego zawartość i funkcjonalność dynamicznie dostosowują się w zależności od stanu uwierzytelnienia użytkownika. Dla gości, widok oferuje generator sugestii pieśni. Dla zalogowanych użytkowników, interfejs rozszerza się o system zakładek, umożliwiający dostęp zarówno do generatora, jak i do zaawansowanego menedżera osobistych zestawów pieśni. Widok ten integruje również modale do obsługi logowania/rejestracji oraz operacji CRUD na zestawach.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Opis**: Jest to jedyna strona (SPA), której zawartość renderuje się dynamicznie na podstawie stanu sesji użytkownika. Komponenty React będą renderowane po stronie klienta (`client:load`).

## 3. Struktura komponentów

Struktura będzie oparta na kompozycji komponentów React, z głównym komponentem `MainView.tsx` zarządzającym stanem i renderującym odpowiednie pod-komponenty.

```
src/pages/index.astro
└── src/components/views/MainView.tsx (client:load)
    ├── Header.tsx
    │   └── AuthModal.tsx
    │       ├── LoginForm.tsx
    │       └── RegisterForm.tsx
    ├── (if !user)
    │   └── SuggestionGenerator.tsx
    └── (if user)
        └── Tabs (shadcn/ui)
            ├── Tab("Generator") -> SuggestionGenerator.tsx
            └── Tab("Zestawy") -> SetsManager.tsx
                ├── SetsDataTable.tsx
                │   ├── SetFormModal.tsx
                │   └── DeleteSetDialog.tsx
                └── Pagination.tsx
```

## 4. Szczegóły komponentów

### `MainView.tsx`

- **Opis**: Główny kontener widoku. Odpowiada za zarządzanie stanem sesji użytkownika i renderowanie odpowiedniego układu (publicznego lub dla zalogowanego użytkownika).
- **Główne elementy**: `Header`, `SuggestionGenerator` lub `Tabs` z `SetsManager`.
- **Obsługiwane interakcje**: Brak bezpośrednich interakcji, deleguje je do komponentów podrzędnych.
- **Typy**: `User` (z Supabase).
- **Propsy**: Brak.

### `Header.tsx`

- **Opis**: Nagłówek aplikacji. Wyświetla tytuł oraz przycisk "Zaloguj się" lub "Wyloguj się" w zależności od stanu użytkownika.
- **Główne elementy**: `<h1>`, `Button`.
- **Obsługiwane interakcje**:
  - Kliknięcie "Zaloguj się": Otwiera `AuthModal`.
  - Kliknięcie "Wyloguj się": Wywołuje funkcję wylogowania z Supabase.
- **Typy**: `User`.
- **Propsy**: `user: User | null`, `onLoginClick: () => void`, `onLogoutClick: () => void`.

### `AuthModal.tsx`

- **Opis**: Modal zawierający formularze logowania i rejestracji w zakładkach.
- **Główne elementy**: `Dialog` (shadcn/ui), `Tabs` (shadcn/ui), `LoginForm`, `RegisterForm`.
- **Obsługiwane interakcje**: Przełączanie między zakładkami.
- **Typy**: `AuthFormValues`.
- **Propsy**: `isOpen: boolean`, `onClose: () => void`.

### `SuggestionGenerator.tsx`

- **Opis**: Komponent do generowania i oceniania sugestii pieśni.
- **Główne elementy**: `Textarea` (dla tekstu liturgicznego), `Textarea` (read-only dla sugestii), `Button` ("Generuj"), `Button` ("👍"), `Button` ("👎").
- **Obsługiwane interakcje**:
  - Wpisywanie tekstu: Aktualizuje stan formularza.
  - Kliknięcie "Generuj": Wysyła zapytanie do `POST /api/suggestions`.
  - Kliknięcie oceny: Wysyła zapytanie do `POST /api/ratings`.
- **Warunki walidacji**:
  - Pole tekstowe nie może być puste.
  - Przycisk "Generuj" jest nieaktywny, jeśli pole jest puste.
- **Typy**: `GenerateSuggestionsCommand`, `SuggestionDto`, `SubmitRatingCommand`.
- **Propsy**: Brak.

### `SetsManager.tsx`

- **Opis**: Komponent do zarządzania zestawami pieśni (CRUD). Zawiera logikę do pobierania, filtrowania, paginacji i modyfikacji zestawów.
- **Główne elementy**: `Input` (wyszukiwanie), `Button` ("Dodaj zestaw"), `SetsDataTable`, `Pagination`.
- **Obsługiwane interakcje**:
  - Wpisywanie w polu wyszukiwania: Filtruje listę zestawów (z debouncingiem).
  - Kliknięcie "Dodaj zestaw": Otwiera `SetFormModal` w trybie tworzenia.
  - Zmiana strony (paginacja): Pobiera nową partię danych.
- **Typy**: `SetDto`, `ListSetsQueryDto`.
- **Propsy**: Brak.

### `SetsDataTable.tsx`

- **Opis**: Tabela wyświetlająca listę zestawów z opcjami akcji.
- **Główne elementy**: `Table` (shadcn/ui), `Button` ("Edytuj"), `Button` ("Usuń").
- **Obsługiwane interakcje**:
  - Kliknięcie "Edytuj": Otwiera `SetFormModal` w trybie edycji z danymi zestawu.
  - Kliknięcie "Usuń": Otwiera `DeleteSetDialog`.
- **Typy**: `SetDto`.
- **Propsy**: `sets: SetDto[]`, `onEdit: (set: SetDto) => void`, `onDelete: (set: SetDto) => void`.

### `SetFormModal.tsx`

- **Opis**: Modal z formularzem do tworzenia lub edycji zestawu.
- **Główne elementy**: `Dialog`, `Input` (nazwa), `Textarea` (zawartość), `Button` ("Zapisz").
- **Obsługiwane interakcje**: Wprowadzanie danych, zapis formularza.
- **Warunki walidacji**:
  - `name`: wymagane, max 200 znaków.
  - `content`: opcjonalne, max 2000 znaków.
- **Typy**: `SetFormValues`, `SetDto`.
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `set?: SetDto` (dla trybu edycji).

### `DeleteSetDialog.tsx`

- **Opis**: Modal potwierdzający usunięcie zestawu.
- **Główne elementy**: `AlertDialog` (shadcn/ui), `Button` ("Usuń"), `Button` ("Anuluj").
- **Obsługiwane interakcje**: Potwierdzenie lub anulowanie usunięcia.
- **Typy**: `SetDto`.
- **Propsy**: `isOpen: boolean`, `onClose: () => void`, `onConfirm: () => void`, `set: SetDto`.

## 5. Typy

Oprócz typów DTO z `src/types.ts`, potrzebne będą następujące typy ViewModel po stronie klienta:

```typescript
// ViewModel dla formularza logowania/rejestracji
export interface AuthFormValues {
  email: string;
  password: string;
}

// ViewModel dla formularza zestawu
export interface SetFormValues {
  name: string;
  content: string;
}

// Typ dla stanu ładowania i błędów w hookach
export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
```

## 6. Zarządzanie stanem

Stan będzie zarządzany głównie za pomocą haków React (`useState`, `useEffect`) wewnątrz poszczególnych komponentów. W celu hermetyzacji logiki i reużywalności, stworzone zostaną customowe hooki:

- **`useAuth()`**: Zarządza stanem sesji użytkownika (pobieranie aktualnego użytkownika, obsługa logowania, rejestracji, wylogowania). Będzie opakowaniem wokół klienta Supabase.
- **`useSets(query: ListSetsQueryDto)`**: Zarządza pobieraniem, paginacją i wyszukiwaniem zestawów. Obsługuje stan ładowania, błędy i przechowuje dane (`AsyncState<ListSetsResponseDto>`).
- **`useSetMutation()`**: Zapewnia funkcje do tworzenia (`createSet`), aktualizacji (`updateSet`) i usuwania (`deleteSet`) zestawów, zarządzając przy tym stanem ładowania i błędami dla każdej z tych operacji.

## 7. Integracja API

Integracja z API będzie realizowana za pomocą `fetch` API w customowych hookach.

- **`POST /api/suggestions`**:
  - **Użycie**: W `SuggestionGenerator.tsx`.
  - **Typ żądania**: `GenerateSuggestionsCommand`.
  - **Typ odpowiedzi**: `GenerateSuggestionsResponseDto`.
- **`POST /api/ratings`**:
  - **Użycie**: W `SuggestionGenerator.tsx`.
  - **Typ żądania**: `SubmitRatingCommand`.
  - **Typ odpowiedzi**: `SubmitRatingResponseDto`.
- **`GET /api/sets`**:
  - **Użycie**: W `useSets()` hook.
  - **Typ żądania**: Query params z `ListSetsQueryDto`.
  - **Typ odpowiedzi**: `ListSetsResponseDto`.
- **`POST /api/sets`**:
  - **Użycie**: W `useSetMutation()` hook (wywoływany z `SetFormModal.tsx`).
  - **Typ żądania**: `CreateSetCommand`.
  - **Typ odpowiedzi**: `CreateSetResponseDto`.
- **`PUT /api/sets/{id}`**:
  - **Użycie**: W `useSetMutation()` hook (wywoływany z `SetFormModal.tsx`).
  - **Typ żądania**: `UpdateSetCommand`.
  - **Typ odpowiedzi**: `UpdateSetResponseDto`.
- **`DELETE /api/sets/{id}`**:
  - **Użycie**: W `useSetMutation()` hook (wywoływany z `DeleteSetDialog.tsx`).
  - **Typ żądania**: Brak (ID w URL).
  - **Typ odpowiedzi**: `204 No Content`.

## 8. Interakcje użytkownika

- **Gość**: Wpisuje tekst -> klika "Generuj" -> widzi sugestie -> klika ocenę.
- **Logowanie**: Klika "Zaloguj się" -> wypełnia formularz w modalu -> zostaje zalogowany, widok się przeładowuje.
- **Zarządzanie zestawami**:
  - **Tworzenie**: Klika "Dodaj zestaw" -> wypełnia formularz w modalu -> nowy zestaw pojawia się na liście.
  - **Edycja**: Klika "Edytuj" przy zestawie -> modyfikuje dane w modalu -> zaktualizowane dane pojawiają się na liście.
  - **Usuwanie**: Klika "Usuń" -> potwierdza w modalu -> zestaw znika z listy.
  - **Wyszukiwanie**: Wpisuje frazę w polu wyszukiwania -> lista dynamicznie się filtruje.

## 9. Warunki i walidacja

- **`SuggestionGenerator`**: Przycisk "Generuj" jest `disabled`, gdy pole tekstowe jest puste.
- **`AuthModal`**: Walidacja `email` (format) i `password` (minimalna długość) po stronie klienta za pomocą `zod` lub prostej logiki przed wysłaniem do API.
- **`SetFormModal`**: Walidacja `name` (wymagane, max 200) i `content` (max 2000) zgodnie z API. Komunikaty o błędach wyświetlane pod polami. Przycisk "Zapisz" jest `disabled` w trakcie wysyłania danych.

## 10. Obsługa błędów

- **Błędy API**: Customowe hooki (`useSets`, `useSetMutation`) będą łapać błędy z `fetch` i wystawiać je w obiekcie `AsyncState`. Komponenty UI będą wyświetlać komunikaty o błędach (np. za pomocą komponentu `Toast` z shadcn/ui) na podstawie tego stanu.
- **Błędy walidacji (400, 409)**: Błędy walidacji z serwera (np. duplikat nazwy zestawu) będą przechwytywane i wyświetlane jako błędy formularza.
- **Błędy autoryzacji (401, 403)**: Błąd 401 powinien skutkować wylogowaniem użytkownika i przekierowaniem.
- **Brak wyników**: Gdy `GET /api/sets` zwróci pustą tablicę, `SetsDataTable` wyświetli komunikat "Nie znaleziono żadnych zestawów".

## 11. Kroki implementacji

1.  **Struktura plików**: Stworzenie katalogów `src/components/views`, `src/components/hooks` oraz plików dla wszystkich zdefiniowanych komponentów (`MainView.tsx`, `Header.tsx` itd.).
2.  **Komponent `MainView.tsx`**: Implementacja logiki warunkowego renderowania w zależności od stanu użytkownika.
3.  **Hook `useAuth()`**: Stworzenie hooka do zarządzania sesją Supabase.
4.  **Implementacja `Header.tsx` i `AuthModal.tsx`**: Zbudowanie nagłówka i modalu logowania/rejestracji z formularzami.
5.  **Implementacja `SuggestionGenerator.tsx`**: Zbudowanie interfejsu generatora i integracja z API sugestii i ocen.
6.  **Hook `useSets()`**: Implementacja hooka do pobierania i filtrowania danych o zestawach.
7.  **Implementacja `SetsManager.tsx` i `SetsDataTable.tsx`**: Zbudowanie widoku listy zestawów z wyszukiwaniem i paginacją.
8.  **Hook `useSetMutation()`**: Stworzenie hooka do operacji CUD na zestawach.
9.  **Implementacja modali `SetFormModal.tsx` i `DeleteSetDialog.tsx`**: Zbudowanie formularzy i okien dialogowych do zarządzania pojedynczym zestawem.
10. **Styling**: Dopracowanie wyglądu wszystkich komponentów za pomocą Tailwind CSS, zgodnie z systemem designu shadcn/ui.
11. **Obsługa błędów i stanów ładowania**: Zintegrowanie globalnego systemu powiadomień (np. `Toaster`) i implementacja wskaźników ładowania (np. `Spinner`).
12. **Testowanie manualne**: Przetestowanie wszystkich historyjek użytkownika w różnych scenariuszach.
