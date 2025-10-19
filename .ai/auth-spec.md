# Specyfikacja Techniczna: Moduł Uwierzytelniania Użytkowników

## 1. Wprowadzenie

Niniejszy dokument opisuje architekturę i implementację modułu uwierzytelniania, logowania i odzyskiwania hasła dla aplikacji "10x Hymns". Specyfikacja bazuje na wymaganiach funkcjonalnych z dokumentu PRD (historyjki użytkownika US-001, US-002) oraz na zdefiniowanym stosie technologicznym.

Celem jest integracja systemu autentykacji Supabase z aplikacją Astro, zapewniając płynne i bezpieczne doświadczenie użytkownika, rozdzielając widoki i funkcjonalności dla użytkowników zalogowanych i niezalogowanych.

## 2. Architektura Interfejsu Użytkownika (Frontend)

### 2.1. Strony i Layouty (Astro)

#### 2.1.1. `src/layouts/Layout.astro`

Layout zostanie rozszerzony o logikę sprawdzania statusu zalogowania użytkownika. Sesja będzie dostępna po stronie serwera dzięki `Astro.locals.session`.

- **Cel:** Dostarczenie informacji o sesji użytkownika do wszystkich stron i komponentów renderowanych na serwerze.
- **Zmiany:**
  - Pobranie sesji z `Astro.locals`.
  - Przekazanie informacji o sesji (lub jej braku) jako `prop` do komponentu `Header.tsx`.
  - Dodanie globalnego store'a (np. `nanostores`) w celu udostępnienia stanu sesji komponentom klienckim bez konieczności "prop drilling". Store będzie inicjalizowany danymi z serwera.

#### 2.1.2. `src/pages/index.astro`

Główna strona aplikacji będzie renderować komponenty warunkowo, w zależności od stanu uwierzytelnienia.

- **Użytkownik niezalogowany:** Widoczny będzie komponent `SuggestionGenerator.tsx`.
- **Użytkownik zalogowany:** Oprócz `SuggestionGenerator.tsx`, widoczny będzie również panel `SetsManager.tsx`.
- **Logika:** Strona wykorzysta dane o sesji z `Astro.locals` do podjęcia decyzji, które komponenty renderować.

### 2.2. Komponenty (React)

#### 2.2.1. `src/components/views/Header.tsx`

Komponent nagłówka będzie dynamicznie wyświetlał przyciski w zależności od stanu zalogowania.

- **Użytkownik niezalogowany:** Wyświetla przycisk "Zaloguj się", który otwiera `AuthModal.tsx`.
- **Użytkownik zalogowany:** Wyświetla adres e-mail użytkownika oraz przycisk "Wyloguj się".
- **Logika:** Komponent będzie subskrybował globalny store autentykacji, aby dynamicznie reagować na zmiany stanu (logowanie/wylogowanie).

#### 2.2.2. `src/components/views/AuthModal.tsx` (Nowy/Do rozbudowy)

Modal będzie centralnym punktem interakcji użytkownika z systemem autentykacji.

- **Struktura:** Komponent oparty na `Tabs` z `shadcn/ui`, zawierający dwie zakładki: "Logowanie" i "Rejestracja".
- **Odpowiedzialność:** Zarządzanie stanem formularzy, obsługa interakcji użytkownika (wprowadzanie danych), ale delegowanie logiki biznesowej (walidacja, komunikacja z API) do dedykowanych komponentów-formularzy.

#### 2.2.3. `src/components/views/LoginForm.tsx`

- **Pola:** `email`, `password`.
- **Walidacja (client-side):** Z użyciem `zod` i `react-hook-form` do sprawdzania podstawowej poprawności (np. czy pola nie są puste, poprawny format e-mail).
- **Komunikacja:** Po walidacji, formularz wywołuje funkcję z hooka `useAuth`, która komunikuje się z endpointem Supabase.
- **Obsługa błędów:** Wyświetlanie komunikatów o błędach zwróconych z backendu (np. "Nieprawidłowe dane logowania").
- **Nawigacja:** Po pomyślnym zalogowaniu, modal jest zamykany, a stan aplikacji jest odświeżany w celu wyświetlenia widoku dla zalogowanego użytkownika.

#### 2.2.4. `src/components/views/RegisterForm.tsx`

- **Pola:** `email`, `password`, `confirmPassword`.
- **Walidacja (client-side):**
  - Poprawność formatu adresu e-mail.
  - Minimalna złożoność hasła (np. 8 znaków, duża litera, cyfra) - walidacja `zod`.
  - Sprawdzenie, czy hasła w obu polach są identyczne.
- **Komunikacja:** Wywołanie funkcji z hooka `useAuth` w celu rejestracji w Supabase.
- **Obsługa błędów:** Wyświetlanie komunikatów (np. "Użytkownik o tym adresie e-mail już istnieje").
- **Nawigacja:** Po pomyślnej rejestracji, system wyświetla komunikat o konieczności potwierdzenia adresu e-mail. Użytkownik musi kliknąć w link weryfikacyjny wysłany na jego skrzynkę, zanim będzie mógł się zalogować. Modal jest zamykany, a użytkownik może przejść do logowania.

### 2.3. Hooki (React)

#### 2.3.1. `src/components/hooks/useAuth.ts`

Centralny hook do zarządzania logiką autentykacji po stronie klienta.

- **Funkcje:**
  - `signIn(credentials)`: Loguje użytkownika przy użyciu klienta Supabase.
  - `signUp(credentials)`: Rejestruje nowego użytkownika.
  - `signOut()`: Wylogowuje użytkownika.
  - `recoverPassword(email)`: Inicjuje proces odzyskiwania hasła.
- **Zarządzanie stanem:** Hook będzie odpowiedzialny za aktualizację globalnego store'a po udanej operacji, informując resztę aplikacji o zmianie stanu uwierzytelnienia.

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

Nie będą tworzone dedykowane endpointy API dla logowania i rejestracji, ponieważ klient będzie komunikował się bezpośrednio z Supabase Auth SDK. Endpointy API związane z zarządzaniem zestawami (`/api/sets`) będą jednak korzystać z sesji udostępnionej przez middleware do autoryzacji operacji.

### 3.3. Konfiguracja renderowania

Plik `astro.config.mjs` zostanie zaktualizowany, aby włączyć renderowanie po stronie serwera (SSR), co jest niezbędne do działania middleware i dynamicznego dostosowywania treści w oparciu o sesję użytkownika.

## 4. System Autentykacji (Supabase)

- **Rejestracja i Logowanie:** Wykorzystanie metod `supabase.auth.signUp()` i `supabase.auth.signInWithPassword()` z biblioteki `@supabase/supabase-js` po stronie klienta (w hooku `useAuth`).
- **Wylogowanie:** Wywołanie `supabase.auth.signOut()`.
- **Odzyskiwanie hasła:**
  - Użytkownik podaje e-mail w dedykowanym formularzu (może być to osobny widok w `AuthModal`).
  - Wywołanie `supabase.auth.resetPasswordForEmail()`.
  - Supabase wysyła e-mail z linkiem do resetu hasła.
  - Użytkownik, klikając w link, jest przekierowywany na specjalną stronę w aplikacji (np. `/update-password`), gdzie może ustawić nowe hasło. Ta strona będzie obsługiwać token z URL i wywoływać `supabase.auth.updateUser()`.
- **Zarządzanie sesją:** Sesja jest automatycznie zarządzana przez Supabase SDK przy użyciu `cookies`. Middleware w Astro zapewnia synchronizację stanu sesji między klientem a serwerem.
