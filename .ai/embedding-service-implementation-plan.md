# Przewodnik Implementacji Usługi Generowania Embeddingów

## 1. Opis usługi

`EmbeddingService` to usługa backendowa odpowiedzialna za generowanie wektorów embeddingów z danych tekstowych przy użyciu modelu `gemini-embedding-001` od Google. Usługa została zaprojektowana tak, aby hermetyzować logikę komunikacji z zewnętrznym API, walidację danych wejściowych, obsługę błędów oraz bezpieczne zarządzanie kluczami API. Umożliwia przetwarzanie zarówno pojedynczych zapytań, jak i zapytań wsadowych (batching). W warstwie domenowej towarzyszy jej moduł `mock-embedding`, który umożliwia generowanie deterministycznych wektorów demo dla niezalogowanych użytkowników bez angażowania usługi Google.

## 2. Opis konstruktora

Konstruktor klasy `EmbeddingService` inicjalizuje klienta Google AI, który jest niezbędny do komunikacji z API. Klucz API jest pobierany w bezpieczny sposób ze zmiennych środowiskowych po stronie serwera, zgodnie z najlepszymi praktykami bezpieczeństwa.

## 3. Publiczne metody i pola

### `generateEmbeddings(params: EmbeddingParams): Promise<number[][]>`

Główna metoda publiczna usługi, która przyjmuje obiekt z treścią do osadzenia i opcjonalnymi parametrami, a następnie zwraca listę wektorów embeddingów.

**Parametry:**

- `content`: `string | string[]` - Tekst lub tablica tekstów do przetworzenia.
- `taskType?`: `TaskType` - Typ zadania embeddingu (np. `RETRIEVAL_QUERY`).
- `title?`: `string` - Opcjonalny tytuł dla `RETRIEVAL_DOCUMENT`.

**Zwraca:** `Promise<number[][]>` - Obietnica, która rozwiązuje się do tablicy wektorów (każdy wektor to `number[]`).

## 4. Prywatne metody i pola

### `private generativeAI: GoogleGenerativeAI`

Prywatna instancja klienta Google AI SDK, używana do interakcji z API.

## 5. Obsługa błędów

Usługa implementuje kompleksową obsługę błędów, aby zapewnić stabilność i przewidywalność działania.

1.  **Błędy walidacji (Zod):** Jeśli dane wejściowe (np. `content`) są nieprawidłowe, usługa rzuci błąd `ZodError`, który powinien być przechwycony w warstwie wywołującej (np. w endpointach API Astro) i zwrócony jako odpowiedź `400 Bad Request`.
2.  **Błędy API Google:** Wszelkie błędy zwrócone przez API Google (np. problemy z autentykacją, przekroczenie limitów, błędy serwera) będą przechwytywane. Zaleca się logowanie tych błędów po stronie serwera i zwracanie ogólnego komunikatu o błędzie `500 Internal Server Error` lub `503 Service Unavailable`, aby nie ujawniać szczegółów implementacji.
3.  **Brak klucza API:** Jeśli klucz `GOOGLE_API_KEY` nie jest dostępny w zmiennych środowiskowych, konstruktor rzuci błąd, co uniemożliwi uruchomienie aplikacji i natychmiast zasygnalizuje problem konfiguracyjny.

## 6. Kwestie bezpieczeństwa

1.  **Zarządzanie kluczami API:** Klucz API do usługi Google AI **musi** być przechowywany jako zmienna środowiskowa (`GOOGLE_API_KEY`) na serwerze. Nigdy nie powinien być on umieszczany bezpośrednio w kodzie ani eksponowany po stronie klienta. W Astro dostęp do niego uzyskujemy poprzez `import.meta.env.GOOGLE_API_KEY`.
2.  **Ograniczanie dostępu:** Endpointy API wykorzystujące `EmbeddingService` powinny dopuszczać kosztowne wywołania tylko dla zalogowanych użytkowników. Wdrażamy fallback do deterministycznych wektorów mockujących dla gości, co eliminuje ryzyko nadużyć i niepotrzebnego zużycia limitów API.
3.  **Walidacja danych wejściowych:** Użycie Zod do walidacji wszystkich danych wejściowych chroni przed atakami typu injection oraz zapewnia, że do API Google trafiają tylko poprawne dane.

## 7. Plan wdrożenia krok po kroku

1.  **Instalacja zależności:** Dodaj do projektu biblioteki `@google/generative-ai` i `zod` za pomocą menedżera pakietów npm.
2.  **Konfiguracja zmiennych środowiskowych:** Upewnij się, że klucz `GOOGLE_API_KEY` jest zdefiniowany w pliku `.env` w głównym katalogu projektu. Plik ten powinien być dodany do `.gitignore`, aby uniknąć przypadkowego upublicznienia klucza.
3.  **Zdefiniowanie typów:** W pliku `src/types.ts` utwórz schematy walidacji Zod (`EmbeddingParamsSchema`, `TaskTypeSchema`) dla parametrów przyjmowanych przez usługę. Schemat `EmbeddingParamsSchema` powinien obejmować `content` (jako `string` lub `string[]`), opcjonalne `taskType`, `title` oraz `outputDimensionality`.
4.  **Implementacja usługi:** Stwórz plik `src/lib/services/embedding.service.ts`. Wewnątrz zaimplementuj klasę `EmbeddingService` zgodnie z wytycznymi z sekcji 2-5 tego dokumentu. Klasa powinna hermetyzować logikę komunikacji z API Google. Na końcu pliku wyeksportuj pojedynczą, współdzieloną instancję tej klasy (wzorzec Singleton), aby zapewnić jeden punkt dostępu do usługi w całej aplikacji.
5.  **Integracja z API Astro:** Stwórz nowy plik endpointu API w `src/pages/api/embed.ts`. Endpoint ten powinien:
    - Obsługiwać żądania `POST`.
    - Pobierać i parsować ciało żądania w formacie JSON.
    - Sprawdzić `locals.user` – brak użytkownika oznacza zwrócenie wektorów demo (`createMockEmbeddings`).
    - Dla zalogowanych użytkowników wywołać metodę `generateEmbeddings` na współdzielonej instancji `embeddingService`.
    - Implementować obsługę błędów w bloku `try...catch`, zwracając odpowiednie kody statusu HTTP (np. 200 dla sukcesu, 400 dla błędnych danych wejściowych, 500 dla błędów serwera) oraz `meta.mode` informujące o trybie.
    - Zwracać wygenerowane embeddingi w formacie JSON w przypadku powodzenia.
    - Posiadać flagę `export const prerender = false;`, aby zapewnić dynamiczne renderowanie po stronie serwera.
