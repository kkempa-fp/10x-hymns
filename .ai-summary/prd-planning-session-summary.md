<conversation_summary>
<decisions>
## Główne decyzje projektowe
- Zasady formatowania tekstu liturgii wklejanego przez użytkownika są ściśle określone w kodzie.
- MVP korzysta ze statycznego zbioru pieśni.
- W zestawie pieśni nie może wystąpić ta sama pieśń więcej niż jeden raz.
- Użytkownik może akceptować, odrzucać lub żądać regeneracji zestawu pieśni wygenerowanego przez AI — regeneracja zawsze zwraca inny zestaw.
- Po akceptacji zestawu użytkownik może dokonywać jedynie poprawek pojedynczych pieśni — bez możliwości zmiany kolejności pieśni.
- MVP zawiera prosty system logowania.
- Zaawansowane funkcje, takie jak logowanie szczegółowych przyczyn odrzucenia czy testy użyteczności, są wykluczone z MVP.
</decisions>

<matched_recommendations>
## Rekomendacje projektowe
- Wprowadzić walidację zapobiegającą powtarzaniu pieśni w jednym zestawie.
- Zapewnić, że regeneracja zawsze generuje inny zestaw pieśni.
- Umieścić zasady formatowania tekstu liturgii wklejanego przez użytkownika bezpośrednio w kodzie.
- Skupić się na prostym systemie autoryzacji odpowiednim dla MVP.
</matched_recommendations>

<prd_planning_summary>
## Główne wymagania funkcjonalne
- Przechowywanie stałego zbioru pieśni.
- Generowanie zestawów pieśni przy użyciu AI na podstawie tekstu liturgii, dzielonego na segmenty odpowiadające częściom mszy świętej (wejście, przygotowanie darów, komunia, uwielbienie, zakończenie).
- Możliwość ręcznego tworzenia, przeglądania, edycji (ograniczonej do poprawek treści) i usuwania zestawów pieśni.
- Implementacja prostego systemu logowania użytkowników.

## Kluczowe ścieżki użytkownika
- Użytkownik wkleja tekst liturgii, który zostaje automatycznie podzielony na segmenty odpowiadające częściom mszy świętej.
- AI generuje zestaw pieśni na podstawie dopasowania pieśni do segmentów.
- Użytkownik przegląda zestaw i może go zaakceptować, odrzucić lub żądać regeneracji (każda regeneracja gwarantuje inny wynik).
- Po akceptacji zestawu użytkownik może zmienić pojedyczne pieśni, bez możliwości zmiany ich kolejności.

## Kryteria sukcesu
- 75% zestawów pieśni generowanych przez AI jest akceptowanych przez użytkowników.
- 75% wszystkich zestawów pieśni jest tworzonych przy użyciu generacji AI.

## Dodatkowe uwagi
- Zasady formatowania tekstu liturgii, na podstawie którego dopasowywane są pieśni, są jasno określone i osadzone w kodzie.
- MVP koncentruje się na funkcjonalnościach webowych, bez aplikacji mobilnych i zaawansowanych integracji.
</prd_planning_summary>

<unresolved_issues>
## Nierozwiązane kwestie
Na tym etapie nie występują żadne nierozwiązane kwestie wymagające dalszych wyjaśnień.
</unresolved_issues>
</conversation_summary>
