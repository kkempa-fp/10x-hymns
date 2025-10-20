# Plan Testów - 10x Hymns

## 1. Wprowadzenie i cele testowania

### 1.1. Wprowadzenie

Niniejszy dokument opisuje plan testów dla aplikacji "10x Hymns", platformy do tworzenia i zarządzania zestawami pieśni z wykorzystaniem sugestii opartych na sztucznej inteligencji. Plan obejmuje strategię, zakres, zasoby i harmonogram działań testowych mających na celu zapewnienie najwyższej jakości, bezpieczeństwa i niezawodności aplikacji.

### 1.2. Cele testowania

- **Weryfikacja funkcjonalna:** Zapewnienie, że wszystkie funkcje aplikacji działają zgodnie z wymaganiami, w tym uwierzytelnianie, zarządzanie zestawami (CRUD) i generowanie sugestii.
- **Zapewnienie bezpieczeństwa:** Potwierdzenie, że dane użytkowników są odpowiednio chronione, a polityki dostępu (RLS) działają poprawnie, uniemożliwiając nieautoryzowany dostęp.
- **Ocena wydajności:** Identyfikacja i eliminacja wąskich gardeł wydajnościowych, zwłaszcza w funkcjach wyszukiwania i generowania sugestii AI.
- **Zapewnienie użyteczności i spójności UI/UX:** Weryfikacja, czy interfejs użytkownika jest intuicyjny, responsywny i spójny wizualnie na różnych urządzeniach i przeglądarkach.
- **Walidacja integracji:** Sprawdzenie poprawności komunikacji z usługami zewnętrznymi, w szczególności z Supabase i API modelu embeddingowego.

## 2. Zakres testów

### 2.1. Funkcjonalności objęte testami

- Moduł uwierzytelniania (rejestracja, logowanie, wylogowywanie, zarządzanie sesją).
- Pełen cykl życia zestawów pieśni (tworzenie, odczyt, aktualizacja, usuwanie - CRUD).
- Mechanizm generowania sugestii pieśni oparty na AI.
- Wyszukiwanie i filtrowanie pieśni.
- Responsywność interfejsu użytkownika (RWD).
- Ochrona punktów końcowych API.

### 2.2. Funkcjonalności wyłączone z testów

- Testy samego modelu AI pod kątem jakości generowanych embeddingów (zakładamy, że dostawca modelu zapewnia jego jakość).
- Testy infrastruktury Supabase (zakładamy jej niezawodność jako usługi).
- Jednorazowe skrypty do migracji i importu danych (`data/*.ps1`) po ich jednokrotnym, udanym wykonaniu.

## 3. Typy testów do przeprowadzenia

- **Testy jednostkowe (Unit Tests):** Weryfikacja pojedynczych komponentów React, hooków, funkcji pomocniczych oraz serwisów w izolacji.
- **Testy integracyjne (Integration Tests):** Sprawdzanie współpracy pomiędzy komponentami oraz integracji frontendu z backendem (API Routes) i backendu z bazą danych (Supabase). Szczególny nacisk na przepływ danych i logikę biznesową.
- **Testy End-to-End (E2E):** Symulacja rzeczywistych scenariuszy użytkownika w przeglądarce, weryfikująca całościowe działanie aplikacji od interfejsu po bazę danych.
- **Testy bezpieczeństwa (Security Tests):** Weryfikacja polityk RLS w Supabase, ochrona API przed atakami (np. SQL Injection, XSS), zarządzanie tokenami JWT.
- **Testy wydajnościowe (Performance Tests):** Obciążeniowe testy kluczowych endpointów API (zwłaszcza `/api/suggestions`) w celu oceny czasu odpowiedzi i zużycia zasobów pod obciążeniem.
- **Testy wizualnej regresji (Visual Regression Tests):** Automatyczne porównywanie zrzutów ekranu interfejsu w celu wykrywania niezamierzonych zmian wizualnych.

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Uwierzytelnianie i autoryzacja

- **Rejestracja:** Użytkownik może pomyślnie założyć konto z unikalnym adresem e-mail.
- **Logowanie:** Zarejestrowany użytkownik może zalogować się przy użyciu poprawnych danych.
- **Ochrona dostępu:** Niezalogowany użytkownik nie może uzyskać dostępu do stron/danych wymagających autoryzacji (np. zarządzanie zestawami).
- **Izolacja danych:** Użytkownik A nie może wyświetlić, edytować ani usunąć zestawów należących do użytkownika B.

### 4.2. Zarządzanie zestawami pieśni (CRUD)

- **Tworzenie:** Użytkownik może stworzyć nowy zestaw, dodać do niego pieśni i zapisać go.
- **Odczyt:** Użytkownik widzi na liście tylko swoje zestawy.
- **Aktualizacja:** Użytkownik może edytować istniejący zestaw (zmienić nazwę, dodać/usunąć pieśni).
- **Usuwanie:** Użytkownik może trwale usunąć swój zestaw.

### 4.3. Generowanie sugestii AI

- **Generowanie:** Po wprowadzeniu opisu, system generuje i wyświetla listę sugerowanych pieśni.
- **Obsługa błędów:** W przypadku błędu komunikacji z API modelu AI, użytkownik otrzymuje czytelny komunikat.
- **Brak wyników:** Gdy żadna pieśń nie pasuje do opisu, system informuje o braku wyników.

## 5. Środowisko testowe

- **Środowisko lokalne:** Do developmentu i uruchamiania testów jednostkowych oraz integracyjnych.
- **Środowisko testowe (Staging):** Osobna instancja aplikacji z własnym projektem Supabase, zasilana danymi testowymi. Na tym środowisku będą uruchamiane testy E2E, bezpieczeństwa i wydajnościowe.
- **Przeglądarki:** Testy E2E będą przeprowadzane na najnowszych wersjach Chrome i Firefox.

## 6. Narzędzia do testowania

- **Framework do testów jednostkowych i integracyjnych:** Vitest z React Testing Library.
- **Framework do testów E2E:** Playwright.
- **Narzędzie do testów wydajnościowych:** k6.
- **Narzędzie do testów wizualnej regresji:** Playwright lub Percy.
- **Mockowanie API:** `msw` (Mock Service Worker) do symulacji odpowiedzi API (zwłaszcza modelu AI).
- **CI/CD:** GitHub Actions do automatycznego uruchamiania testów po każdym pushu do repozytorium.

## 7. Harmonogram testów

Testy będą prowadzone w sposób ciągły, zintegrowany z procesem deweloperskim.

- **Testy jednostkowe i integracyjne:** Pisane równolegle z nowymi funkcjami przez deweloperów.
- **Testy E2E:** Rozwijane iteracyjnie, z priorytetem na kluczowe przepływy użytkownika. Uruchamiane automatycznie w środowisku CI/CD przed każdym wdrożeniem na produkcję.
- **Testy wydajnościowe i bezpieczeństwa:** Przeprowadzane przed każdym większym wydaniem oraz cyklicznie (np. co kwartał).

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wejścia

- Kod źródłowy został wdrożony na środowisku testowym.
- Wszystkie zależności i konfiguracje środowiska są gotowe.

### 8.2. Kryteria wyjścia (Definition of Done)

- 100% testów jednostkowych i integracyjnych dla nowej logiki biznesowej kończy się sukcesem.
- 100% krytycznych scenariuszy E2E kończy się sukcesem.
- Pokrycie kodu testami jednostkowymi utrzymuje się na poziomie min. 80%.
- Brak niezaakceptowanych błędów krytycznych (P0) i wysokiego priorytetu (P1).
- Wyniki testów wydajnościowych spełniają zdefiniowane progi (np. czas odpowiedzi API < 500ms pod zdefiniowanym obciążeniem).

## 9. Role i odpowiedzialności w procesie testowania

- **Deweloperzy:** Odpowiedzialni za pisanie testów jednostkowych i integracyjnych, naprawę błędów oraz dbanie o jakość kodu.
- **Inżynier QA:** Odpowiedzialny za tworzenie i utrzymanie planu testów, projektowanie i implementację testów E2E, bezpieczeństwa i wydajnościowych, raportowanie błędów oraz ostateczną akceptację wersji.
- **Product Owner:** Odpowiedzialny za priorytetyzację błędów i definiowanie wymagań biznesowych.

## 10. Procedury raportowania błędów

- Wszystkie zidentyfikowane błędy będą raportowane w systemie do śledzenia zadań (np. GitHub Issues).
- Każdy raport o błędzie musi zawierać:
  - Tytuł jednoznacznie opisujący problem.
  - Szczegółowy opis kroków do reprodukcji błędu.
  - Informacje o środowisku (np. przeglądarka, system operacyjny).
  - Oczekiwany vs. rzeczywisty rezultat.
  - Zrzuty ekranu, logi lub nagrania wideo (jeśli to możliwe).
  - Przypisany priorytet (P0-Krytyczny, P1-Wysoki, P2-Średni, P3-Niski).
- Błędy będą regularnie przeglądane i priorytetyzowane przez zespół projektowy.
