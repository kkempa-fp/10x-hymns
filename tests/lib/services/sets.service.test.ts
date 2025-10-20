import type { SupabaseClient } from "../../../src/db/supabase.client.ts";
import type { CreateSetCommand, UpdateSetCommand } from "../../../src/types";
import { createSetsService } from "../../../src/lib/services/sets.service";

const baseSetRow = {
  id: "set-1",
  name: "Sunday",
  content: "Intro hymn",
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-01-01T00:00:00.000Z",
};

describe("createSetsService", () => {
  const buildSupabase = (fromImpl: SupabaseClient["from"]) => ({
    supabase: { from: fromImpl } as unknown as SupabaseClient,
    from: fromImpl,
  });

  it("requires user context when creating a set", async () => {
    const { supabase } = buildSupabase(vi.fn());
    const service = createSetsService(supabase);

    const command: CreateSetCommand = { name: "Set", content: "Content" };

    await expect(service.create("", command)).rejects.toMatchObject({
      message: "User context is required",
      status: 400,
    });
  });

  it("creates a set and returns the DTO", async () => {
    const single = vi.fn().mockResolvedValue({ data: baseSetRow, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const { supabase } = buildSupabase(from);
    const service = createSetsService(supabase);

    const command: CreateSetCommand = { name: "Sunday", content: "Intro hymn" };

    const result = await service.create("user-1", command);

    expect(insert).toHaveBeenCalledWith([{ user_id: "user-1", ...command }]);
    expect(result).toEqual({ data: baseSetRow });
  });

  it("translates Supabase unique constraint violations into domain errors", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { code: "23505" } });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    const from = vi.fn().mockReturnValue({ insert });
    const { supabase } = buildSupabase(from);
    const service = createSetsService(supabase);

    await expect(service.create("user-1", { name: "Sunday", content: "Intro hymn" })).rejects.toMatchObject({
      message: "A set with this name already exists",
      status: 409,
    });
  });

  it("prevents updates when the set belongs to a different user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { ...baseSetRow, user_id: "owner" }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const fetchBuilder = { select };
    const from = vi.fn().mockReturnValue(fetchBuilder);
    const { supabase } = buildSupabase(from as unknown as typeof from);
    const service = createSetsService(supabase);

    const command: UpdateSetCommand = { name: "Sunday", content: "Updated" };

    await expect(service.update("someone-else", "set-1", command)).rejects.toMatchObject({
      message: "You are not allowed to access this set",
      status: 403,
    });
    expect(maybeSingle).toHaveBeenCalledWith();
  });

  it("updates a set when ownership is verified", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { ...baseSetRow, user_id: "user-1" }, error: null });
    const fetchEq = vi.fn().mockReturnValue({ maybeSingle });
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq });
    const fetchBuilder = { select: fetchSelect };

    const single = vi.fn().mockResolvedValue({ data: baseSetRow, error: null });
    const updateSelect = vi.fn().mockReturnValue({ single });
    const updateEq = vi.fn().mockReturnValue({ select: updateSelect });
    const updateBuilder = { update: vi.fn().mockReturnValue({ eq: updateEq }) };

    const from = vi
      .fn()
      .mockImplementationOnce(() => fetchBuilder)
      .mockImplementationOnce(() => updateBuilder);
    const { supabase } = buildSupabase(from as unknown as typeof from);
    const service = createSetsService(supabase);

    const command: UpdateSetCommand = { name: "Sunday", content: "Updated" };

    const result = await service.update("user-1", "set-1", command);

    expect(updateEq).toHaveBeenCalledWith("id", "set-1");
    expect(result).toEqual({ data: baseSetRow });
  });

  it("lists sets for the current user with default pagination", async () => {
    const rangeResult = Promise.resolve({ data: [baseSetRow], error: null, count: 1 });
    const range = vi.fn().mockReturnValue(rangeResult);
    const order = vi.fn().mockReturnValue({ range });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const { supabase } = buildSupabase(from as unknown as typeof from);
    const service = createSetsService(supabase);

    const result = await service.list("user-1");

    expect(select).toHaveBeenCalledWith("id,name,content,created_at,updated_at", { count: "exact" });
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(order).toHaveBeenCalledWith("updated_at", { ascending: false });
    expect(range).toHaveBeenCalledWith(0, 9);
    expect(result).toEqual({
      data: [baseSetRow],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });
  });

  it("applies search filtering and custom pagination", async () => {
    const ilike = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
    const range = vi.fn().mockReturnValue({ ilike });
    const order = vi.fn().mockReturnValue({ range });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const { supabase } = buildSupabase(from as unknown as typeof from);
    const service = createSetsService(supabase);

    const query = { search: "sun", page: 2, limit: 5, sort: "name" as const, order: "asc" as const };
    const result = await service.list("user-1", query);

    expect(range).toHaveBeenCalledWith(5, 9);
    expect(ilike).toHaveBeenCalledWith("name", "%sun%");
    expect(result.meta).toMatchObject({ page: 2, limit: 5, hasPrevious: true, hasNext: false });
  });

  it("wraps listing errors in SetServiceError", async () => {
    const range = vi.fn().mockReturnValue(Promise.resolve({ data: null, error: { message: "db" }, count: null }));
    const order = vi.fn().mockReturnValue({ range });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const { supabase } = buildSupabase(from as unknown as typeof from);
    const service = createSetsService(supabase);

    await expect(service.list("user-1")).rejects.toMatchObject({
      message: "Unable to fetch sets",
      status: 500,
    });
  });

  it("fetches a set by id when ownership matches", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { ...baseSetRow, user_id: "user-1" }, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const { supabase } = buildSupabase(from as unknown as typeof from);
    const service = createSetsService(supabase);

    const result = await service.getById("user-1", "set-1");

    expect(eq).toHaveBeenCalledWith("id", "set-1");
    expect(result).toEqual({ data: baseSetRow });
  });

  it("deletes a set after ownership verification", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { ...baseSetRow, user_id: "user-1" }, error: null });
    const fetchEq = vi.fn().mockReturnValue({ maybeSingle });
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq });
    const fetchBuilder = { select: fetchSelect };

    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const deleteBuilder = { delete: vi.fn().mockReturnValue({ eq: deleteEq }) };

    const from = vi
      .fn()
      .mockImplementationOnce(() => fetchBuilder)
      .mockImplementationOnce(() => deleteBuilder);
    const { supabase } = buildSupabase(from as unknown as typeof from);
    const service = createSetsService(supabase);

    const result = await service.remove("user-1", "set-1");

    expect(deleteEq).toHaveBeenCalledWith("id", "set-1");
    expect(result).toBeNull();
  });
});
