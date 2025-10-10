# Podsumowanie pomysłu na projekt: 10x-hymns

## 1. Problem i cel

Projekt **10x-hymns** ma na celu rozwiązanie problemu czasochłonnego, manualnego przygotowywania zestawów pieśni na mszę świętą. Głównym celem aplikacji w wersji MVP jest **automatyzacja tego procesu poprzez generowanie propozycji pieśni przez AI** na podstawie wprowadzonego przez użytkownika tekstu liturgii (np. czytań, antyfon).

## 2. Kluczowa funkcjonalność i podejście techniczne

Centralną funkcją jest inteligentne sugerowanie pieśni. Zdecydowano się na implementację w oparciu o architekturę **RAG (Retrieval-Augmented Generation)** z wykorzystaniem **osadzeń wektorowych (embeddings)**.

### Proces przygotowania danych (jednorazowy)

1.  **Źródło danych:** Zbiór ok. 1000 plików `.txt` z tekstami pieśni, pogrupowanych w folderach tematycznych.
2.  **Generowanie embeddingów:** Uruchomienie dedykowanego skryptu (np. w Node.js), który:
    *   Przechodzi przez wszystkie pliki z pieśniami.
    *   Dla każdej pieśni generuje wektor embeddingu za pomocą modelu AI (np. `text-embedding-3-small` od OpenAI).
    *   Zapisuje dane (ID, tytuł, kategoria, treść, embedding) do pliku `JSON`, gotowego do importu.
3.  **Baza danych:** Zaimportowanie wygenerowanych danych do tabeli w **Supabase**, z wykorzystaniem rozszerzenia `pgvector` do obsługi i przeszukiwania danych wektorowych.

### Proces generowania sugestii (w czasie rzeczywistym)

1.  **Wejście użytkownika:** Użytkownik wkleja do aplikacji tekst liturgii na dany dzień.
2.  **Zapytanie:** Aplikacja generuje embedding dla tekstu wprowadzonego przez użytkownika.
3.  **Wyszukiwanie semantyczne:** Aplikacja wykonuje zapytanie do bazy `pgvector` w Supabase, aby znaleźć N pieśni, których wektory są najbardziej podobne semantycznie do wektora zapytania.
4.  **Finalna selekcja (Rekomendowane):** Lista N najlepiej pasujących pieśni jest przekazywana do modelu językowego (np. GPT) wraz z precyzyjnym promptem. Zadaniem modelu jest wybranie z tej listy ostatecznego zestawu (np. 5 pieśni) i przypisanie ich do odpowiednich części mszy świętej (wejście, przygotowanie darów, komunia, uwielbienie, zakończenie) na podstawie ich charakteru i kontekstu liturgicznego.
5.  **Wyjście:** Użytkownik otrzymuje gotową propozycję zestawu pieśni.

## 3. Analiza wykonalności

Projekt został oceniony jako **ambitny, ale wykonalny w ramach 30-50 godzin pracy** ("po godzinach"). Kluczowe czynniki to:
*   **Doświadczenie dewelopera:** 15 lat w branży.
*   **Wiedza domenowa:** Rola eksperta jako czynnego organisty.
*   **Wybrany stack:** Astro, React, Supabase - wspierany przez materiały szkoleniowe.
*   **Podejście techniczne:** Wykorzystanie embeddingów jest wydajne i skalowalne, co upraszcza logikę aplikacji i skraca czas potrzebny na uzyskanie wysokiej jakości wyników w porównaniu do alternatywnych metod.
