# Architektura UI - 10x Hymns

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika aplikacji "10x Hymns" opiera się na modelu Single Page Application (SPA) zbudowanym przy użyciu Astro i React, zgodnie z architekturą "wysp". Główny plik `index.astro` renderuje statyczny szkielet strony, a cała interaktywność jest zamknięta w dedykowanych komponentach React.

- **Użytkownik niezalogowany**: Widzi prosty, wyśrodkowany interfejs skupiony wyłącznie na generatorze propozycji pieśni.
- **Użytkownik zalogowany**: Interfejs rozszerza się o dodatkowe funkcjonalności zarządzania zestawami pieśni, prezentowane w formie zakładek, co pozwala na oddzielenie głównych obszarów funkcjonalnych aplikacji.

Zarządzanie stanem odbywa się lokalnie w komponentach React (`useState`), co upraszcza architekturę i jest wystarczające dla potrzeb MVP. Do budowy spójnego i dostępnego interfejsu wykorzystana zostanie biblioteka komponentów shadcn/ui. Powiadomienia o wynikach operacji (np. sukces, błąd) będą wyświetlane za pomocą komponentu Toaster (Toast).

## 2. Lista widoków

### Widok Główny (Niezalogowany)

- **Nazwa widoku**: Strona Główna (Publiczna)
- **Ścieżka widoku**: `/`
- **Główny cel**: Umożliwienie każdemu użytkownikowi szybkiego generowania propozycji pieśni na podstawie tekstu liturgicznego.
- **Kluczowe informacje do wyświetlenia**:
  - Pole do wprowadzania tekstu.
  - Licznik znaków dla wprowadzanego tekstu.
  - Pole (tylko do odczytu) z wygenerowanymi sugestiami.
  - Przyciski do oceny sugestii ("łapka w górę"/"łapka w dół").
- **Kluczowe komponenty widoku**:
  - `Header.tsx`: Nagłówek z przyciskiem "Zaloguj się".
  - `SuggestionGenerator.tsx`: Główny komponent zawierający całą logikę generowania sugestii.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Prosty, jednozadaniowy interfejs minimalizujący dystrakcje. Wyniki w polu `textarea` ułatwiają kopiowanie.
  - **Dostępność**: Użycie semantycznych tagów HTML, etykiet `aria-label` dla pól formularzy i przycisków.
  - **Bezpieczeństwo**: Brak dostępu do danych wrażliwych. Interakcja z API jest ograniczona do publicznych endpointów.

### Widok Główny (Zalogowany)

- **Nazwa widoku**: Panel Użytkownika
- **Ścieżka widoku**: `/` (ten sam, ale z dynamicznie renderowaną zawartością)
- **Główny cel**: Zapewnienie zalogowanym użytkownikom dostępu do generatora sugestii oraz narzędzi do zarządzania własnymi zestawami pieśni.
- **Kluczowe informacje do wyświetlenia**:
  - Układ z zakładkami: "Generator" i "Zestawy".
  - **Zakładka "Generator"**: Zawartość identyczna jak w widoku niezalogowanym.
  - **Zakładka "Zestawy"**: Lista zapisanych zestawów (nazwa, data modyfikacji), pole wyszukiwania, przyciski do tworzenia, edycji i usuwania zestawów, paginacja.
- **Kluczowe komponenty widoku**:
  - `Header.tsx`: Nagłówek z przyciskiem "Wyloguj się".
  - `SuggestionGenerator.tsx`: Komponent dla pierwszej zakładki.
  - `SetsManager.tsx`: Komponent dla drugiej zakładki, zarządzający logiką CRUD dla zestawów.
  - `Tabs`: Komponent nawigacyjny z shadcn/ui.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Czytelne rozdzielenie funkcjonalności za pomocą zakładek. Spójne operacje CRUD.
  - **Dostępność**: Poprawne zarządzanie focusem przy przełączaniu zakładek i otwieraniu modali.
  - **Bezpieczeństwo**: Wszystkie operacje na zestawach wymagają uwierzytelnienia. Komunikacja z API musi zawierać token JWT.

### Modal Uwierzytelniania

- **Nazwa widoku**: Modal Logowania / Rejestracji
- **Ścieżka widoku**: Brak (element nakładany na widok główny)
- **Główny cel**: Umożliwienie użytkownikom logowania lub tworzenia nowego konta bez opuszczania strony głównej.
- **Kluczowe informacje do wyświetlenia**:
  - Formularz logowania (e-mail, hasło).
  - Formularz rejestracji (e-mail, hasło).
  - Możliwość przełączania się między formularzami.
- **Kluczowe komponenty widoku**:
  - `Dialog`: Komponent modala z shadcn/ui.
  - `Tabs`: Do przełączania między logowaniem a rejestracją.
  - `Input`, `Button`: Elementy formularzy.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Proces uwierzytelniania w jednym miejscu, bez przeładowywania strony.
  - **Dostępność**: Zarządzanie focusem wewnątrz modala, możliwość zamknięcia go klawiszem `Esc`.
  - **Bezpieczeństwo**: Kluczowa jest bezpieczna obsługa haseł i komunikacja z API.

### Modal Zarządzania Zestawem

- **Nazwa widoku**: Modal Tworzenia / Edycji Zestawu
- **Ścieżka widoku**: Brak (element nakładany na widok główny)
- **Główny cel**: Zapewnienie interfejsu do tworzenia nowego lub modyfikacji istniejącego zestawu pieśni.
- **Kluczowe informacje do wyświetlenia**:
  - Pole `Input` na nazwę zestawu.
  - Pole `Textarea` na zawartość zestawu.
  - Przycisk "Zapisz".
- **Kluczowe komponenty widoku**:
  - `Dialog`: Komponent modala.
  - `Input`, `Textarea`, `Button`: Elementy formularza.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Ten sam formularz dla tworzenia i edycji upraszcza interfejs.
  - **Dostępność**: Etykiety dla pól, walidacja błędów komunikowana w sposób dostępny.
  - **Bezpieczeństwo**: Walidacja danych wejściowych po stronie klienta i serwera.

### Modal Potwierdzenia Usunięcia

- **Nazwa widoku**: Modal Potwierdzenia Usunięcia
- **Ścieżka widoku**: Brak (element nakładany na widok główny)
- **Główny cel**: Zapobieganie przypadkowemu usunięciu zestawu przez użytkownika.
- **Kluczowe informacje do wyświetlenia**:
  - Komunikat z pytaniem o potwierdzenie.
  - Przyciski "Usuń" i "Anuluj".
- **Kluczowe komponenty widoku**:
  - `AlertDialog`: Dedykowany komponent z shadcn/ui do tego celu.
- **UX, dostępność i względy bezpieczeństwa**:
  - **UX**: Jasny i jednoznaczny krok potwierdzający, chroniący przed utratą danych.
  - **Dostępność**: Fokus automatycznie ustawiony na przycisku o mniejszym ryzyku (np. "Anuluj").
  - **Bezpieczeństwo**: Operacja usuwania jest nieodwracalna, stąd potrzeba potwierdzenia.

## 3. Mapa podróży użytkownika

**Główny przypadek użycia: Planowanie oprawy muzycznej przez zalogowanego użytkownika**

1.  **Logowanie**: Użytkownik otwiera aplikację, klika "Zaloguj się" w nagłówku. Otwiera się modal, gdzie wprowadza swoje dane i loguje się.
2.  **Zmiana interfejsu**: Interfejs przełącza się na widok zalogowanego użytkownika z dwiema zakładkami: "Generator" i "Zestawy".
3.  **Generowanie sugestii**: Użytkownik przechodzi do zakładki "Generator", wkleja tekst antyfony, klika "Generuj propozycje".
4.  **Analiza i kopiowanie**: Otrzymuje listę 3 pieśni w polu `textarea` (read-only). Kopiuje te, które mu odpowiadają.
5.  **Ocena propozycji**: Użytkownik ocenia trafność sugestii, klikając przycisk "łapka w górę" lub "łapka w dół" obok listy propozycji. System zapisuje ocenę, a przycisk zostaje wizualnie zaznaczony.
6.  **Tworzenie zestawu**: Użytkownik przechodzi do zakładki "Zestawy", klika "Stwórz nowy zestaw".
7.  **Wypełnianie zestawu**: W modalu, który się pojawił, wpisuje nazwę (np. "Niedziela, 26.10.2025") i wkleja skopiowane wcześniej pieśni do pola zawartości. Klika "Zapisz".
8.  **Potwierdzenie**: Modal znika, a na liście zestawów pojawia się nowa pozycja. Użytkownik widzi powiadomienie "Toast" o pomyślnym utworzeniu zestawu.
9.  **Edycja (opcjonalnie)**: Użytkownik zauważa błąd w nazwie. Klika przycisk "Edytuj" przy zestawie, poprawia nazwę w tym samym modalu i zapisuje zmiany.
10. **Usuwanie (opcjonalnie)**: Po jakimś czasie zestaw staje się nieaktualny. Użytkownik klika "Usuń", potwierdza operację w modalu `AlertDialog` i zestaw znika z listy.

## 4. Układ i struktura nawigacji

Nawigacja w aplikacji jest prosta i kontekstowa, zmieniając się w zależności od stanu uwierzytelnienia użytkownika.

- **Nawigacja główna (Header)**:
  - **Niezalogowany**: Zawiera logo aplikacji i przycisk "Zaloguj się".
  - **Zalogowany**: Zawiera logo i przycisk "Wyloguj się".
- **Nawigacja wewnątrz widoku (dla zalogowanych)**:
  - Realizowana za pomocą komponentu `Tabs` z dwiema zakładkami: "Generator" i "Zestawy". Pozwala to na szybkie przełączanie się między głównymi obszarami funkcjonalnymi bez przeładowywania strony.
- **Nawigacja w panelu zestawów**:
  - Lista zestawów będzie posiadać prostą paginację (przyciski "Poprzednia"/"Następna") do nawigowania po stronach wyników, zgodnie z możliwościami API.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów React, które będą stanowić podstawę interfejsu użytkownika.

- **`Header.tsx`**: Komponent nagłówka, który dynamicznie renderuje przyciski "Zaloguj się" lub "Wyloguj się" w zależności od stanu autentykacji.
- **`SuggestionGenerator.tsx`**: Sercem aplikacji, zawiera logikę do wprowadzania tekstu, komunikacji z `/api/suggestions`, wyświetlania wyników i obsługi ocen.
- **`SetsManager.tsx`**: Komponent do zarządzania zestawami pieśni. Odpowiedzialny za pobieranie listy zestawów, wyszukiwanie, paginację oraz inicjowanie operacji CRUD (otwieranie modali).
- **`AuthModal.tsx`**: Modal zawierający w sobie formularze logowania i rejestracji, zarządzający przełączaniem się między nimi.
- **`SetFormModal.tsx`**: Modal z formularzem do tworzenia i edycji zestawu. Będzie przyjmował propsy z istniejącymi danymi w trybie edycji.
- **`DeleteConfirmDialog.tsx`**: Reużywalny modal `AlertDialog` do potwierdzania operacji usunięcia.
- **`Toaster`**: Globalny komponent (z shadcn/ui) do wyświetlania powiadomień o stanie operacji, umieszczony w głównym layoucie.
