# Dokument wymagań produktu (PRD) - 10x-hymns

## 1. Przegląd produktu

Aplikacja 10x-hymns jest przeznaczona do tworzenia i zarządzania zestawami pieśni na poszczególne części mszy świętej. System korzysta z modeli LLM (poprzez API) do generowania sugestii pieśni na podstawie wprowadzonego tekstu liturgii. W ramach MVP wykorzystywany jest statyczny zbiór pieśni oraz prosty system kont użytkowników zapewniający bezpieczny dostęp do danych.

## 2. Problem użytkownika

Organista, odpowiedzialny za przygotowanie liturgii, musi ręcznie komponować zestawy pieśni, co jest procesem czasochłonnym i podatnym na błędy. Brak efektywnego narzędzia do generowania i zarządzania zestawami pieśni może skutkować opóźnieniami, niską jakością przygotowanej liturgii oraz zniechęceniem użytkowników do korzystania z tradycyjnych metod.

## 3. Wymagania funkcjonalne

1. Przechowywanie stałego zbioru pieśni:
   - Statyczny zbiór dostępny w systemie.
   - Pieśni zapisane w formacie wektorowym (embedding) w bazie danych.

2. Automatyczne generowanie zestawów pieśni:
   - Użytkownik wkleja tekst liturgii (np. ze strony brewiarz.pl).
   - Aplikacja dzieli tekst na segmenty odpowiadające częściom mszy świętej (wejście, przygotowanie darów, komunia, uwielbienie, zakończenie).
   - Aplikacja generuje embedding dla poszczególnych segmentów.
   - Aplikacja wyszukuje w bazie danych pieśni najbardziej podobne semantycznie do segmentów liturgii.
   - Model LLM proponuje zestaw pieśni na podstawie wyszukiwania w bazie danych.
   - Zestaw pieśni jest prezentowany użytkownikowi z możliwością akceptacji, edycji lub odrzucenia.

3. Ręczne tworzenie zestawów pieśni:
   - Formularz do ręcznego tworzenia zestawów pieśni (nazwa i zestaw).
   - Opcje edycji i usuwania istniejących zestawów pieśni.
   - Ręczne tworzenie zestawów pieśni i wyświetlanie w ramach widoku listy "Moje zestawy".

4. Walidacja zestawu pieśni:
   - Zapobieganie umieszczaniu w zestawie tej samej pieśni więcej niż jeden raz.

5. Regeneracja zestawu pieśni:
   - Możliwość wygenerowania nowego zestawu pieśni na podstawie wprowadzonego tekstu liturgii z gwarancją zwrócenia innego wyniku.

6. Implementacja prostego systemu kont użytkowników:
   - Rejestracja i logowanie.
   - Możliwość usunięcia konta i powiązanych zestawów pieśni na życzenie.

7. Statystyki generowania zestawów pieśni:
   - Zbieranie informacji o tym, ile zestawów pieśni zostało wygenerowanych przez AI i ile z nich ostatecznie zaakceptowano.

## 4. Granice produktu

1. Poza zakresem MVP:
   - Zarządzania zbiorem pieśni poza statycznym, predefiniowanym zestawem.
   - Importowanie plików w formatach PDF, DOCX czy innych.
   - Współdzielenie zestawów pieśni między użytkownikami.
   - Aplikacje mobilne (obecnie tylko wersja web).
   - Publicznie dostępne API.
   - System powiadomień.
   - Zaawansowane wyszukiwanie zestawów pieśni po słowach kluczowych.
   - Logowanie szczegółowych przyczyn odrzucenia.
   - Przeprowadzanie testów użyteczności.

## 5. Historyjki użytkowników

### US-001: Rejestracja użytkownika
- ID: US-001
- Tytuł: Rejestracja użytkownika
- Opis: Jako nowy użytkownik, chcę mieć możliwość rejestracji w systemie, aby móc korzystać z pełnej funkcjonalności aplikacji.
- Kryteria akceptacji:
  1. Użytkownik może zarejestrować się, podając wymagane dane (email i hasło).
  2. System tworzy nowe konto i potwierdza rejestrację.
  3. Użytkownik otrzymuje powiadomienie o pomyślnej rejestracji.

### US-002: Logowanie użytkownika
- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do systemu, aby uzyskać dostęp do swoich zestawów pieśni.
- Kryteria akceptacji:
  1. Użytkownik loguje się za pomocą poprawnych danych (email i hasło).
  2. System weryfikuje dane i przyznaje dostęp autoryzowanym użytkownikom.
  3. W przypadku błędnych danych, system wyświetla odpowiedni komunikat o błędzie.

### US-003: Automatyczne generowanie zestawu pieśni
- ID: US-003
- Tytuł: Automatyczne generowanie zestawu pieśni
- Opis: Jako zalogowany użytkownik, chcę wkleić tekst liturgii, aby system automatycznie podzielił go na segmenty i wygenerował zestaw pieśni, dzięki czemu oszczędzę czas potrzebny na ręczne komponowanie zestawu.
- Kryteria akceptacji:
  1. Użytkownik wkleja tekst liturgii.
  2. System dzieli tekst na segmenty odpowiadające częściom mszy świętej (wejście, przygotowanie darów, komunia, uwielbienie, zakończenie).
  3. System generuje zestaw pieśni, zapewniając unikalność każdej pieśni.
  4. Użytkownik otrzymuje potwierdzenie wygenerowania zestawu.

### US-004: Automatyczna regeneracja zestawu pieśni
- ID: US-004
- Tytuł: Automatyczna regeneracja zestawu pieśni
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość żądania regeneracji zestawu pieśni, aby system wygenerował zupełnie inny zestaw na podstawie tego samego tekstu liturgii.
- Kryteria akceptacji:
  1. Użytkownik wybiera opcję regeneracji zestawu.
  2. System generuje nowy zestaw pieśni, różniący się od poprzedniego.
  3. Nowy zestaw spełnia kryterium unikalności (brak duplikacji pieśni).

### US-005: Akceptacja lub odrzucenie wygenerowanego zestawu pieśni
- ID: US-005
- Tytuł: Akceptacja lub odrzucenie wygenerowanego zestawu pieśni
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość zarówno akceptacji, jak i odrzucenia wygenerowanego przez system zestawu pieśni, aby system mógł gromadzić statystyki dotyczące akceptacji i odrzucenia, co stanowi miernik sukcesu projektu.
- Kryteria akceptacji:
  1. Użytkownik przegląda wygenerowany zestaw pieśni.
  2. Użytkownik ma możliwość wyboru między akceptacją a odrzuceniem zestawu.
  3. W przypadku akceptacji, użytkownik wpisuje nazwę zestawu i jest on zapisywany, a system rejestruje akceptację zestawu.
  4. W przypadku odrzucenia, zestaw nie jest zapisywany, a system rejestruje odrzucenie zestawu.
  5. System wyświetla potwierdzenie dokonania wybranej operacji.

### US-006: Ręczne tworzenie zestawu pieśni
- ID: US-006
- Tytuł: Ręczne tworzenie zestawu pieśni
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość ręcznego stworzenia własnego zestawu pieśni, aby móc dostosować wybór pieśni do swoich potrzeb.
- Kryteria akceptacji:
  1. Użytkownik może otworzyć formularz do tworzenia nowego zestawu.
  2. Użytkownik wpisuje nazwę zestawu, a następnie ręcznie wpisuje pieśni do zestawu.
  3. System zapisuje nowo utworzony zestaw i potwierdza operację.

### US-007: Edycja zestawu pieśni
- ID: US-007
- Tytuł: Edycja zestawu pieśni
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość edycji istniejącego zestawu pieśni, aby wprowadzić modyfikacje bez zmiany kolejności pieśni.
- Kryteria akceptacji:
  1. Użytkownik wybiera opcję edycji dla konkretnego zestawu.
  2. System umożliwia zmianę nazwy zestawu oraz poszczególnych pieśni.
  3. Po zapisaniu, system wyświetla potwierdzenie aktualizacji.

### US-008: Usuwanie zestawu pieśni
- ID: US-008
- Tytuł: Usuwanie zestawu pieśni
- Opis: Jako zalogowany użytkownik, chcę mieć możliwość usunięcia istniejącego zestawu pieśni, aby móc pozbyć się niepotrzebnych lub nieaktualnych zestawów.
- Kryteria akceptacji:
  1. Użytkownik wybiera opcję usunięcia dla konkretnego zestawu.
  2. System usuwa wybrany zestaw i aktualizuje listę.
  3. Użytkownik otrzymuje potwierdzenie usunięcia.

## 6. Metryki sukcesu

1. Co najmniej 75% zestawów pieśni generowanych przez AI zostanie zaakceptowanych przez użytkowników.
2. Co najmniej 75% wszystkich zestawów pieśni będzie tworzonych przy użyciu funkcji generowania przez AI.
