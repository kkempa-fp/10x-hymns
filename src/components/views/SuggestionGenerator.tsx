import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FC, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { messages } from "@/components/messages";
import { translateCommonError, translateSuggestionError } from "@/components/messages/translate";
import { getSupabaseBrowserClient } from "@/db/supabase.client";
import { resolveRequestError } from "@/lib/errors";
import type {
  GenerateSuggestionsCommand,
  GenerateSuggestionsResponseDto,
  RatingValue,
  SuggestionDto,
  SubmitRatingCommand,
} from "@/types";

const SUGGESTION_COUNT = 5;
const FINGERPRINT_STORAGE_KEY = "10x-hymns:fingerprint";

interface SuggestionGeneratorProps {
  authLoading?: boolean;
  user?: User | null;
}

const SuggestionGenerator: FC<SuggestionGeneratorProps> = ({ authLoading = false, user = null }) => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
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

  useEffect(() => {
    if (!user) {
      setLastRating(null);
    }
  }, [user]);

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
      setError(messages.suggestion.requireInput);
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
        let errorMessage: string = messages.common.errors.fetchSuggestionsFailed;
        try {
          const errorJson = await response.json();
          if (
            errorJson &&
            errorJson.error === "Failed to generate embeddings" &&
            errorJson.details === "Upstream service error"
          ) {
            errorMessage = messages.suggestion.errors.upstreamUnavailable;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch {
          const message = await response.text();
          if (message) errorMessage = message;
        }
        const translated = translateSuggestionError(errorMessage, messages.common.errors.fetchSuggestionsFailed);
        throw new Error(translated);
      }

      const data = (await response.json()) as GenerateSuggestionsResponseDto;
      setSuggestions(data.data);
      setStatusMessage(
        data.meta.mode === "full" ? messages.suggestion.status.full(data.data.length) : messages.suggestion.status.demo
      );
      setError(null);
    } catch (requestError) {
      const rawMessage = resolveRequestError(
        requestError,
        messages.common.errors.unknown,
        messages.common.errors.network
      );
      const translated = translateSuggestionError(rawMessage, messages.common.errors.unknown);
      setError(translated);
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

        const { data: sessionData } = await supabase.auth.getSession();
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
          const translated = translateCommonError(
            message || messages.common.errors.submitRatingFailed,
            messages.common.errors.submitRatingFailed
          );
          throw new Error(translated);
        }

        setStatusMessage(
          rating === "up" ? messages.suggestion.status.ratingPositive : messages.suggestion.status.ratingNegative
        );
        setLastRating(rating);
      } catch (requestError) {
        const rawMessage = resolveRequestError(
          requestError,
          messages.common.errors.submitRatingFailed,
          messages.common.errors.network
        );
        const translated = translateCommonError(rawMessage, messages.common.errors.submitRatingFailed);
        setError(translated);
      } finally {
        setRatingLoading(false);
      }
    },
    [fingerprint, ratingLoading, suggestions, supabase]
  );

  const isGenerateDisabled = loading || !text.trim();
  const isRatingDisabled = suggestions.length === 0 || ratingLoading || lastRating !== null;
  const resolvedAuthState = authLoading ? null : Boolean(user);

  return (
    <section
      className="surface-raised rounded-[var(--md-sys-shape-corner-extra-large)] border border-border p-6"
      data-test-id="suggestion-generator"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-[1.375rem] font-semibold leading-tight">{messages.suggestion.title}</h2>
        <p className="text-[0.9375rem] text-muted-foreground">{messages.suggestion.description}</p>
      </header>

      {resolvedAuthState === null ? null : (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            resolvedAuthState
              ? "border-primary/30 bg-primary/5 text-primary"
              : "border-border bg-muted/40 text-muted-foreground"
          }`}
        >
          {resolvedAuthState ? messages.suggestion.banner.loggedIn : messages.suggestion.banner.guest}
        </div>
      )}

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="suggestion-input">{messages.suggestion.form.inputLabel}</Label>
          <Textarea
            id="suggestion-input"
            placeholder={messages.common.placeholders.suggestionInput}
            value={text}
            onChange={handleTextChange}
            disabled={loading}
            data-test-id="suggestion-input"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isGenerateDisabled} data-test-id="suggestion-submit-button">
            {loading ? messages.common.loading.generating : messages.suggestion.form.generate}
          </Button>
          <span className="text-[0.9375rem] text-muted-foreground">
            {resolvedAuthState === null
              ? messages.suggestion.counts.pending(SUGGESTION_COUNT)
              : resolvedAuthState
                ? messages.suggestion.counts.full(SUGGESTION_COUNT)
                : messages.suggestion.counts.demo(SUGGESTION_COUNT)}
          </span>
        </div>
      </form>

      <div className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="suggestion-output">{messages.suggestion.form.outputLabel}</Label>
          <Textarea
            id="suggestion-output"
            value={suggestionsAsText}
            readOnly
            className="bg-muted/60 font-mono text-[0.9375rem]"
            data-test-id="suggestion-output"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isRatingDisabled}
            onClick={() => void handleRating("up")}
            aria-pressed={lastRating === "up"}
            data-test-id="suggestion-rate-up"
          >
            {messages.suggestion.rating.buttons.up}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isRatingDisabled}
            onClick={() => void handleRating("down")}
            aria-pressed={lastRating === "down"}
            data-test-id="suggestion-rate-down"
          >
            {messages.suggestion.rating.buttons.down}
          </Button>
          {lastRating ? (
            <span className="text-[0.9375rem] text-muted-foreground">
              {messages.suggestion.rating.lastPrefix}{" "}
              {lastRating === "up" ? messages.suggestion.rating.lastPositive : messages.suggestion.rating.lastNegative}
            </span>
          ) : null}
        </div>

        {error ? (
          <p className="text-sm text-destructive" data-test-id="suggestion-error-message">
            {error}
          </p>
        ) : null}
        {statusMessage && !error ? (
          <p className="text-sm text-primary" data-test-id="suggestion-status-message">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default SuggestionGenerator;
