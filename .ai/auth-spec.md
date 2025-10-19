# Specyfikacja Techniczna: Moduł Uwierzytelniania Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu uwierzytelniania, logowania i wylogowywania dla aplikacji "10x Hymns". Specyfikacja bazuje na wymaganiach funkcjonalnych z dokumentu PRD (historyjki użytkownika US-001, US-002) oraz na zdefiniowanym stosie technologicznym.

Celem jest integracja systemu autentykacji Supabase z aplikacją Astro, zapewniając płynne i bezpieczne doświadczenie użytkownika, rozdzielając widoki i funkcjonalności dla użytkowników zalogowanych i niezalogowanych.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Strony i Layouty (Astro)

#### 2.1.1. `src/layouts/Layout.astro`

Layout odpowiada za dostarczenie globalnych styli i zachowania motywu. Status zalogowania jest ustalany dynamicznie po stronie klienta na podstawie wywołań do `/api/auth/session`.

- **Cel:** Zapewnienie spójnych styli, struktury dokumentu oraz skryptów odpowiedzialnych za motyw; Layout pozostaje niezależny od stanu sesji.
- **Zmiany:**
  - Import globalnych styli oraz skryptu sterującego motywem.
  - Utrzymanie prostego `slot`-u, ponieważ logika sesji została przeniesiona do warstwy klienckiej (`useAuth`).

#### 2.1.2. `src/pages/index.astro`

Główna strona uruchamia kliencki komponent `MainView.tsx`, który samodzielnie ustala stan uwierzytelnienia na podstawie hooka `useAuth`.

- **Użytkownik niezalogowany:** `MainView` renderuje `SuggestionGenerator.tsx`.
- **Użytkownik zalogowany:** `MainView` oprócz generatora pokazuje panel `SetsManager.tsx`.
- **Logika:** Warunkowe renderowanie odbywa się po stronie klienta; SSR nie zależy od `Astro.locals.session`.

### 2.2. Komponenty (React)

#### 2.2.1. `src/components/views/Header.tsx`

Komponent nagłówka będzie dynamicznie wyświetlał przyciski w zależności od stanu zalogowania.

- **Użytkownik niezalogowany:** Wyświetla przycisk "Zaloguj się", który otwiera `AuthModal.tsx`.
- **Użytkownik zalogowany:** Wyświetla adres e-mail użytkownika oraz przycisk "Wyloguj się".
- **Logika:** Komponent będzie subskrybował globalny store autentykacji, aby dynamicznie reagować na zmiany stanu (logowanie/wylogowanie).

#### 2.2.2. `src/components/views/AuthModal.tsx`

Modal będzie centralnym punktem interakcji użytkownika z systemem autentykacji.

- **Struktura:** Komponent oparty na `Tabs` z `shadcn/ui`, zawierający dwie zakładki: "Logowanie" i "Rejestracja".
- **Odpowiedzialność:** Zarządzanie stanem formularzy, obsługa interakcji użytkownika (wprowadzanie danych), ale delegowanie logiki biznesowej (walidacja, komunikacja z API) do dedykowanych komponentów-formularzy.

#### 2.2.3. `src/components/views/MainView.tsx`

- **Rola:** Spina widok główny aplikacji i zarządza stanem modala logowania/rejestracji.
- **Logika:** Korzysta z hooka `useAuth` do pobierania informacji o sesji, deleguje obsługę logowania, rejestracji i wylogowania oraz przełącza zakładki modala.
- **Renderowanie warunkowe:** Na podstawie obecności `user` z `useAuth` pokazuje panel zestawów lub sam generator.

#### 2.2.4. `src/components/views/LoginForm.tsx`

- **Pola:** `email`, `password`.
- **Walidacja (client-side):** Z użyciem `zod` i `react-hook-form` do sprawdzania podstawowej poprawności (np. czy pola nie są puste, poprawny format e-mail).
- **Komunikacja:** Po walidacji, formularz wywołuje funkcję z hooka `useAuth`, która komunikuje się z endpointem Supabase.
- **Obsługa błędów:** Wyświetlanie komunikatów o błędach zwróconych z backendu (np. "Nieprawidłowe dane logowania").
- **Nawigacja:** Po pomyślnym zalogowaniu, modal jest zamykany, a stan aplikacji jest odświeżany w celu wyświetlenia widoku dla zalogowanego użytkownika.

#### 2.2.5. `src/components/views/RegisterForm.tsx`

- **Pola:** `email`, `password`, `confirmPassword`.
- **Walidacja (client-side):**
  - Poprawność formatu adresu e-mail.
  - Minimalna złożoność hasła (np. 8 znaków, duża litera, cyfra) - walidacja `zod`.
  - Sprawdzenie, czy hasła w obu polach są identyczne.
- **Komunikacja:** Wywołanie funkcji z hooka `useAuth` w celu rejestracji w Supabase.
- **Obsługa błędów:** Wyświetlanie komunikatów (np. "Użytkownik o tym adresie e-mail już istnieje").
- **Nawigacja:** Po pomyślnej rejestracji modal zostaje zamknięty, a użytkownik jest automatycznie zalogowany i może korzystać z panelu zestawów bez dodatkowych kroków.

### 2.3. Hooki (React)

#### 2.3.1. `src/components/hooks/useAuth.ts`

Centralny hook do zarządzania logiką autentykacji po stronie klienta.

- **Funkcje:**
  - `signIn(credentials)`: Loguje użytkownika poprzez wywołanie `/api/auth/login`.
  - `signUp(credentials)`: Rejestruje nowego użytkownika poprzez `/api/auth/register`.
  - `signOut()`: Wylogowuje użytkownika poprzez `/api/auth/logout`.
  - `resetError()`: Czyści komunikaty błędów przed ponowną próbą.
  - Automatyczne `loadSession()`: Wywoływane po montażu i udanych operacjach, aby zsynchronizować stan z `/api/auth/session`.
- **Zarządzanie stanem:** Hook lokalnie przechowuje `user`, `loading` i `error`, udostępniając je komponentom korzystającym z `useAuth`.

## 3. Logika Backendowa

### 3.1. Middleware (Astro)

#### 3.1.1. `src/middleware/index.ts`

Middleware będzie kluczowym elementem integracji z Supabase Auth.

- **Odpowiedzialność:**
  - Przechwytywanie każdego żądania przychodzącego do serwera.
  - Tworzenie serwerowego klienta Supabase przy użyciu `cookies` z żądania.
  - Pobieranie sesji i danych użytkownika (`supabase.auth.getSession()`, `supabase.auth.getUser()`).
  - Umieszczanie obiektu `session` i `user` w `Astro.locals`, aby były dostępne w endpointach API i podczas renderowania stron (`.astro`).
- **Bezpieczeństwo:** Zapewnia, że każda operacja po stronie serwera jest wykonywana w kontekście uwierzytelnionego (lub anonimowego) użytkownika.

### 3.2. Endpointy API

Warstwa API zapewnia cienkie kontrolery pośredniczące między klientem SPA a Supabase Auth. Kluczowe trasy:

- `POST /api/auth/login` – deleguje do `supabase.auth.signInWithPassword()` i zwraca sesję.
- `POST /api/auth/register` – wywołuje `supabase.auth.signUp()` i zwraca aktywne konto bez wymogu weryfikacji e-mail.
- `POST /api/auth/logout` – czyści sesję w Supabase.
- `GET /api/auth/session` – odczytuje bieżącą sesję i zwraca dane użytkownika (lub `null`).

Endpointy zestawów (`/api/sets*`) wymagają obecności `locals.user` ustawionego przez middleware i odrzucają żądania niezalogowanych użytkowników.

### 3.3. Konfiguracja renderowania

Plik `astro.config.mjs` zostanie zaktualizowany, aby włączyć renderowanie po stronie serwera (SSR), co jest niezbędne do działania middleware i dynamicznego dostosowywania treści w oparciu o sesję użytkownika.

## 4. System Autentykacji (Supabase)

- **Rejestracja i Logowanie:** Warstwa API korzysta z `supabase.auth.signUp()` oraz `supabase.auth.signInWithPassword()`, a hook `useAuth` komunikuje się wyłącznie z endpointami `/api/auth/*`.
- **Wylogowanie:** `POST /api/auth/logout` deleguje do `supabase.auth.signOut()` i czyści ciasteczka sesyjne.
- **Zarządzanie sesją:** Supabase utrzymuje sesję w ciasteczkach httpOnly; middleware dopasowuje ją do `locals`, a `useAuth` odświeża stan klienta poprzez `/api/auth/session`.
