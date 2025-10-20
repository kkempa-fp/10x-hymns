import type { SupabaseClient } from "../../../src/db/supabase.client.ts";
import type { SubmitRatingCommand } from "../../../src/types";
import { createRatingsService } from "../../../src/lib/services/ratings.service";

describe("createRatingsService", () => {
  const buildSupabase = () => {
    const insert = vi.fn();
    const from = vi.fn().mockReturnValue({ insert });

    return { supabase: { from } as unknown as SupabaseClient, insert };
  };

  const createValidCommand = (overrides: Partial<SubmitRatingCommand> = {}): SubmitRatingCommand => ({
    client_fingerprint: "fingerprint-1",
    rating: "up",
    proposed_hymn_numbers: ["101"],
    ...overrides,
  });

  it("throws a RatingServiceError when rating value is invalid", async () => {
    const { supabase } = buildSupabase();
    const service = createRatingsService(supabase);

    const command = createValidCommand({ rating: "invalid" as SubmitRatingCommand["rating"] });

    await expect(service.submit(command, "user-1")).rejects.toMatchObject({
      message: "Invalid rating value",
      status: 400,
    });
  });

  it("normalizes hymn numbers before persisting", async () => {
    const { supabase, insert } = buildSupabase();
    insert.mockResolvedValue({ error: null });
    const service = createRatingsService(supabase);

    const command = createValidCommand({ proposed_hymn_numbers: [" 101 ", "", "202"] });

    const result = await service.submit(command, "user-1");

    expect(insert).toHaveBeenCalledWith({
      client_fingerprint: "fingerprint-1",
      rating: "up",
      proposed_hymn_numbers: ["101", "202"],
      user_id: "user-1",
    });
    expect(result).toEqual({ message: "Rating submitted successfully." });
  });

  it("rejects when no hymn numbers remain after normalization", async () => {
    const { supabase } = buildSupabase();
    const service = createRatingsService(supabase);

    const command = createValidCommand({ proposed_hymn_numbers: ["  "] });

    await expect(service.submit(command, "user-1")).rejects.toMatchObject({
      message: "At least one hymn number must be provided",
      status: 400,
    });
  });

  it("wraps Supabase errors in a RatingServiceError", async () => {
    const { supabase, insert } = buildSupabase();
    const service = createRatingsService(supabase);

    insert.mockResolvedValue({ error: { message: "constraint", code: "23505" } });

    await expect(service.submit(createValidCommand(), "user-1")).rejects.toMatchObject({
      message: "Unable to submit rating",
      status: 500,
    });
  });
});
