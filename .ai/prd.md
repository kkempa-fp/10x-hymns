# Dokument wymagań produktu (PRD) - 10x-hymns

## 1. Przegląd produktu

Aplikacja "10x-hymns" to inteligentne narzędzie webowe zaprojektowane w celu uproszczenia i przyspieszenia procesu doboru pieśni do liturgii mszy świętej. Aplikacja, działająca jako Single Page Application (SPA), analizuje wprowadzony przez użytkownika fragment tekstu liturgicznego (np. antyfony, czytania) i na jego podstawie proponuje pasujące pieśni, wykorzystując do tego celu wektory embeddingu. Użytkownicy mogą tworzyć konta, aby zapisywać, przeglądać i zarządzać własnymi zestawami pieśni na poszczególne dni w ciągu roku liturgicznego. Interfejs aplikacji jest w pełni responsywny (RWD), zapewniając komfort użytkowania na różnych urządzeniach.

## 2. Problem użytkownika

Dobór odpowiednich pieśni, które tematycznie i treściowo współgrają z liturgią danego dnia, jest zadaniem czasochłonnym i wymagającym dla organistów, księży i osób odpowiedzialnych za oprawę muzyczną mszy świętej. Proces ten często polega na manualnym przeszukiwaniu śpiewników i dopasowywaniu treści, co jest nieefektywne. Aplikacja ma na celu rozwiązanie tego problemu, oferując szybkie i trafne propozycje pieśni, co znacząco skraca czas przygotowań.

## 3. Wymagania funkcjonalne

1. Uwierzytelnianie użytkowników:
   - Rejestracja nowego konta użytkownika.
   - Logowanie do istniejącego konta.
2. Baza pieśni:
   - Statyczna, niemodyfikowalna przez użytkownika baza pieśni.
   - Każda pieśń zawiera: numer, tytuł, kategorię oraz pre-obliczony wektor embeddingu.
3. Generator propozycji pieśni (AI):
   - Jedno pole tekstowe do wklejenia przez użytkownika fragmentu tekstu liturgii.
   - Obliczanie embeddingu dla wprowadzonego tekstu po stronie serwera.
   - Wyszukiwanie i wyświetlanie N (domyślnie 3, konfigurowalne po stronie serwera) pieśni o najbliższych wektorach.
4. System ocen propozycji:
   - Możliwość oceny listy zaproponowanych pieśni za pomocą przycisków "łapka w górę" lub "łapka w dół".
   - Oceny są zapisywane w bazie danych (anonimowo lub z ID zalogowanego użytkownika).
5. Zarządzanie zestawami pieśni (dla zalogowanych użytkowników):
   - Tworzenie nowego zestawu z unikalną, wymuszoną przez system nazwą.
   - Zestaw składa się z 5 dedykowanych pól tekstowych: Wejście, Przygotowanie darów, Komunia, Uwielbienie, Zakończenie.
   - Przeglądanie listy zapisanych zestawów.
   - Wyszukiwanie zestawów po nazwie (case-insensitive, typu "contains").
   - Edycja nazwy i zawartości istniejącego zestawu.
   - Usuwanie zapisanego zestawu.
6. Interfejs użytkownika (UI):
   - Aplikacja jednostronicowa (SPA).
   - Design responsywny (RWD).
   - Dla użytkowników niezalogowanych strona główna pełni rolę generatora propozycji.
   - Dla użytkowników zalogowanych na tym samym ekranie widoczny jest dodatkowo panel do zarządzania zestawami.

## 4. Granice produktu

W zakres wersji MVP produktu NIE wchodzą następujące funkcjonalności:
-   Zarządzanie statycznym zbiorem pieśni przez użytkowników (dodawanie, edycja, usuwanie pieśni z głównej bazy).
-   Import tekstów liturgii z plików w formatach zewnętrznych (np. PDF, DOCX).
-   Współdzielenie i udostępnianie zestawów pieśni między różnymi użytkownikami.
-   Automatyczne integracje z zewnętrznymi źródłami tekstów liturgicznych (np. brewiarz.pl, strony diecezjalne).
-   Dedykowane aplikacje mobilne na systemy iOS i Android.

## 5. Historyjki użytkowników

ID: US-001
Tytuł: Rejestracja konta
Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji, podając swój adres e-mail i hasło, aby móc zapisywać i zarządzać moimi zestawami pieśni.
Kryteria akceptacji:
- Formularz rejestracji zawiera pola na adres e-mail i hasło.
- System waliduje poprawność formatu adresu e-mail.
- System wymusza minimalną złożoność hasła.
- Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i widzi powiadomienie o sukcesie.
- W przypadku próby rejestracji na istniejący już e-mail, system wyświetla czytelny komunikat o błędzie.

ID: US-002
Tytuł: Logowanie do systemu
Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto przy użyciu adresu e-mail i hasła, aby uzyskać dostęp do moich zapisanych zestawów pieśni.
Kryteria akceptacji:
- Formularz logowania zawiera pola na adres e-mail i hasło.
- Po pomyślnym zalogowaniu użytkownik zostaje przekierowany do głównego widoku aplikacji z widocznym panelem zarządzania zestawami.
- W przypadku podania błędnych danych logowania, system wyświetla odpowiedni komunikat.

ID: US-003
Tytuł: Generowanie propozycji pieśni
Opis: Jako użytkownik (zalogowany lub nie), chcę wkleić fragment tekstu liturgicznego w pole tekstowe i kliknąć przycisk, aby otrzymać listę sugerowanych pieśni.
Kryteria akceptacji:
- Na stronie głównej widoczne jest duże pole tekstowe oraz przycisk "Generuj propozycje".
- Po wklejeniu tekstu i kliknięciu przycisku, system wyświetla listę 3 propozycji.
- Każda propozycja na liście zawiera numer i tytuł pieśni.
- W przypadku braku tekstu w polu, przycisk jest nieaktywny lub system wyświetla komunikat.

ID: US-004
Tytuł: Ocenianie propozycji
Opis: Jako użytkownik, chcę móc ocenić zaproponowane pieśni za pomocą przycisków "łapka w górę" lub "łapka w dół", aby wyrazić swoją opinię o trafności sugestii.
Kryteria akceptacji:
- Obok listy zaproponowanych pieśni znajdują się dwa przyciski: "łapka w górę" i "łapka w dół".
- Po kliknięciu jednego z przycisków, ocena jest zapisywana w systemie.
- Użytkownik może oddać tylko jedną ocenę (góra lub dół) na daną propozycję w ramach jednego wyszukiwania.
- Wizualne potwierdzenie oddania głosu (np. podświetlenie przycisku).

ID: US-005
Tytuł: Tworzenie nowego zestawu pieśni
Opis: Jako zalogowany użytkownik, chcę móc stworzyć nowy, pusty zestaw pieśni, nadając mu unikalną nazwę, abym mógł w nim zaplanować oprawę muzyczną mszy.
Kryteria akceptacji:
- W panelu zarządzania zestawami znajduje się przycisk "Stwórz nowy zestaw".
- Po kliknięciu pojawia się formularz z polem na nazwę zestawu oraz 5 polami tekstowymi (Wejście, Przygotowanie darów, Komunia, Uwielbienie, Zakończenie).
- System wymusza unikalność nazwy zestawu w obrębie konta użytkownika. W przypadku próby zapisu duplikatu, wyświetlany jest błąd.
- Po zapisaniu, nowy zestaw pojawia się na liście moich zestawów.

ID: US-006
Tytuł: Przeglądanie i wyszukiwanie zestawów
Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich moich zapisanych zestawów pieśni oraz mieć możliwość ich wyszukania po nazwie, aby szybko odnaleźć interesujący mnie zestaw.
Kryteria akceptacji:
- Panel zarządzania domyślnie wyświetla listę wszystkich zestawów użytkownika.
- Nad listą znajduje się pole wyszukiwania.
- Wpisywanie tekstu w pole wyszukiwania dynamicznie filtruje listę zestawów po nazwie.
- Wyszukiwanie działa na zasadzie "contains" i jest niewrażliwe na wielkość liter.

ID: US-007
Tytuł: Edycja istniejącego zestawu
Opis: Jako zalogowany użytkownik, chcę móc edytować istniejący zestaw pieśni, aby zmienić jego nazwę lub zawartość poszczególnych pól.
Kryteria akceptacji:
- Na liście zestawów, przy każdym z nich, znajduje się przycisk "Edytuj".
- Po kliknięciu przycisku "Edytuj", użytkownik widzi formularz wypełniony aktualnymi danymi zestawu.
- Użytkownik może modyfikować nazwę oraz zawartość 5 pól tekstowych.
- Walidacja unikalności nazwy działa również podczas edycji.
- Po zapisaniu zmian, zaktualizowane dane są widoczne na liście zestawów.

ID: US-008
Tytuł: Usuwanie zestawu
Opis: Jako zalogowany użytkownik, chcę móc trwale usunąć wybrany zestaw pieśni, gdy nie jest mi już potrzebny.
Kryteria akceptacji:
- Na liście zestawów, przy każdym z nich, znajduje się przycisk "Usuń".
- Po kliknięciu przycisku "Usuń", system wyświetla modal z prośbą o potwierdzenie operacji, aby zapobiec przypadkowemu usunięciu.
- Po potwierdzeniu, zestaw jest trwale usuwany z bazy danych i znika z listy.

## 6. Metryki sukcesu

-   Główne kryterium sukcesu: 75% pieśni proponowanych przez aplikację jest akceptowane przez użytkownika.
-   Sposób mierzenia: Sukces będzie mierzony jako stosunek liczby ocen "łapka w górę" do całkowitej liczby oddanych ocen ("łapka w górę" + "łapka w dół").
    -   Formuła: `Wskaźnik akceptacji = Liczba_ocen_pozytywnych / (Liczba_ocen_pozytywnych + Liczba_ocen_negatywnych)`
-   Dane będą zbierane od wszystkich użytkowników, zarówno zalogowanych, jak i niezalogowanych, w celu uzyskania jak najszerszego obrazu trafności modelu.
