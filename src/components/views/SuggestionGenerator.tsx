import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FC, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabaseClient } from "@/db/supabase.client";
import type {
  GenerateSuggestionsCommand,
  GenerateSuggestionsResponseDto,
  RatingValue,
  SuggestionDto,
  SubmitRatingCommand,
} from "@/types";

const SUGGESTION_COUNT = 5;
const FINGERPRINT_STORAGE_KEY = "10x-hymns:fingerprint";

const SuggestionGenerator: FC = () => {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [lastRating, setLastRating] = useState<RatingValue | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (stored) {
      setFingerprint(stored);
      return;
    }

    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(36);
    window.localStorage.setItem(FINGERPRINT_STORAGE_KEY, generated);
    setFingerprint(generated);
  }, []);

  const suggestionsAsText = useMemo(() => {
    if (suggestions.length === 0) {
      return "";
    }

    const maxNumberWidth = Math.max(...suggestions.map((item) => item.number.length), 1);
    const formatLine = (item: SuggestionDto, index: number) => {
      const paddedNumber = item.number.padStart(maxNumberWidth, " ");
      const ordinal = String(index + 1);
      return `${ordinal}. ${paddedNumber} : ${item.name} (${item.category})`;
    };

    return suggestions.map(formatLine).join("\n");
  }, [suggestions]);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      setError("Wpisz krótki opis liturgii, aby otrzymać sugestie.");
      return;
    }

    setLoading(true);
    setRatingLoading(false);
    setError(null);
    setStatusMessage(null);
    setLastRating(null);

    try {
      const payload: GenerateSuggestionsCommand = {
        text: text.trim(),
        count: SUGGESTION_COUNT,
      };

      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Nie udało się pobrać sugestii. Spróbuj ponownie.");
      }

      const data = (await response.json()) as GenerateSuggestionsResponseDto;
      setSuggestions(data.data);
      setStatusMessage(`Otrzymano ${data.data.length} propozycji.`);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Wystąpił nieznany błąd.";
      setError(message);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [text]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleGenerate();
  };

  const handleRating = useCallback(
    async (rating: RatingValue) => {
      if (suggestions.length === 0 || ratingLoading) {
        return;
      }

      const fingerprintValue =
        fingerprint ??
        (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(36));
      setFingerprint(fingerprintValue);

      setRatingLoading(true);
      setStatusMessage(null);
      setError(null);

      try {
        const payload: SubmitRatingCommand = {
          rating,
          proposed_hymn_numbers: suggestions.map((item) => item.number),
          client_fingerprint: fingerprintValue,
        };

        const { data: sessionData } = await supabaseClient.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`;
        }

        const response = await fetch("/api/ratings", {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Nie udało się zapisać oceny. Spróbuj ponownie.");
        }

        setStatusMessage(rating === "up" ? "Dziękujemy za pozytywną opinię!" : "Zapisaliśmy Twoją uwagę.");
        setLastRating(rating);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : "Wystąpił nieznany błąd.";
        setError(message);
      } finally {
        setRatingLoading(false);
      }
    },
    [fingerprint, ratingLoading, suggestions]
  );

  const isGenerateDisabled = loading || !text.trim();
  const isRatingDisabled = suggestions.length === 0 || ratingLoading || lastRating !== null;

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-neutral-900">Generator sugestii pieśni</h2>
        <p className="text-sm text-neutral-600">
          Wpisz fragment liturgii lub temat przewodni, a my zaproponujemy pieśni pasujące do Twojej celebracji.
        </p>
      </header>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <label htmlFor="suggestion-input" className="text-sm font-medium text-neutral-800">
            Treść antyfony lub czytań
          </label>
          <Textarea
            id="suggestion-input"
            placeholder="Tutaj wklej lub wpisz tekst antyfony, czytań lub krótki opis liturgii..."
            value={text}
            onChange={handleTextChange}
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isGenerateDisabled}>
            {loading ? "Generowanie..." : "Generuj propozycje"}
          </Button>
          <span className="text-sm text-neutral-500">
            Otrzymasz {SUGGESTION_COUNT} dopasowanych pieśni na podstawie danych z bazy.
          </span>
        </div>
      </form>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="suggestion-output" className="text-sm font-medium text-neutral-800">
            Proponowane pieśni
          </label>
          <Textarea id="suggestion-output" value={suggestionsAsText} readOnly className="bg-neutral-100 font-mono" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isRatingDisabled}
            onClick={() => void handleRating("up")}
            aria-pressed={lastRating === "up"}
          >
            👍 Dobre propozycje
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isRatingDisabled}
            onClick={() => void handleRating("down")}
            aria-pressed={lastRating === "down"}
          >
            👎 Nietrafione sugestie
          </Button>
          {lastRating ? (
            <span className="text-sm text-neutral-600">
              Ostatnia ocena: {lastRating === "up" ? "pozytywna" : "negatywna"}
            </span>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {statusMessage && !error ? <p className="text-sm text-emerald-600">{statusMessage}</p> : null}
      </div>
    </section>
  );
};

export default SuggestionGenerator;
