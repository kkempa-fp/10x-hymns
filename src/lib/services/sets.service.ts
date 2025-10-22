import type { PostgrestError } from "@supabase/supabase-js";

import type { SupabaseClient } from "../../db/supabase.client.ts";

import type {
  CreateSetCommand,
  CreateSetResponseDto,
  DeleteSetResponseDto,
  GetSetResponseDto,
  ListSetsQueryDto,
  ListSetsResponseDto,
  Set,
  SetDto,
  UpdateSetCommand,
  UpdateSetResponseDto,
} from "../../types";

const SET_SELECT_COLUMNS = "id,name,content,created_at,updated_at" as const;
const SET_SELECT_COLUMNS_WITH_OWNER = "id,name,content,created_at,updated_at,user_id" as const;

type SetRow = Pick<Set, "id" | "name" | "content" | "created_at" | "updated_at">;
type SetRowWithOwner = SetRow & { user_id: string };

/**
 * Custom error class for the SetService.
 * Extends the native Error class to include an HTTP status code for API responses.
 */
export class SetServiceError extends Error {
  readonly status: number;
  override readonly cause?: unknown;

  /**
   * Creates an instance of SetServiceError.
   * @param message - The error message.
   * @param status - The HTTP status code associated with the error. Defaults to 500.
   * @param options - Optional parameters, including the original error cause.
   */
  constructor(message: string, status = 500, options?: { cause?: unknown }) {
    super(message);
    this.name = "SetServiceError";
    this.status = status;
    this.cause = options?.cause;
  }
}

/**
 * Maps a database row to a SetDto.
 * @param row - The set data row from the database.
 * @returns A `SetDto` object.
 */
const mapToSetDto = (row: SetRow): SetDto => ({
  id: row.id,
  name: row.name,
  content: row.content,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/**
 * Checks if a PostgrestError is a unique constraint violation.
 * @param error - The PostgrestError object from Supabase.
 * @returns `true` if the error is a unique constraint violation (code 23505), otherwise `false`.
 */
const isUniqueConstraintViolation = (error: PostgrestError | null) => error?.code === "23505";

/**
 * A factory function that creates an instance of the SetsService.
 * The service handles all CRUD operations for hymn sets, ensuring user ownership and data integrity.
 *
 * @param supabase - An instance of the SupabaseClient.
 * @returns An object containing methods for managing sets.
 */
export const createSetsService = (supabase: SupabaseClient) => {
  type NormalizedListQuery = { search?: string } & Required<Omit<ListSetsQueryDto, "search">>;

  /**
   * Fetches a set record including the owner's user ID.
   * @private
   * @param setId - The ID of the set to fetch.
   * @returns A promise that resolves to the set row with owner ID, or null if not found.
   * @throws {SetServiceError} If the database query fails.
   */
  const fetchSetWithOwner = async (setId: string): Promise<SetRowWithOwner | null> => {
    const { data, error } = await supabase
      .from("sets")
      .select(SET_SELECT_COLUMNS_WITH_OWNER)
      .eq("id", setId)
      .maybeSingle();

    if (error) {
      throw new SetServiceError("Unable to fetch set", 500, { cause: error });
    }

    if (!data) {
      return null;
    }

    const typed = data as Set;
    const setRow: SetRow = {
      id: typed.id,
      name: typed.name,
      content: typed.content,
      created_at: typed.created_at,
      updated_at: typed.updated_at,
    };

    return { ...setRow, user_id: typed.user_id } satisfies SetRowWithOwner;
  };

  /**
   * Asserts that a user is the owner of a specific set.
   * @private
   * @param userId - The ID of the user.
   * @param setId - The ID of the set.
   * @returns A promise that resolves to the set row if ownership is confirmed.
   * @throws {SetServiceError} If the user is not authenticated (400), the set is not found (404), or the user is not the owner (403).
   */
  const assertOwnership = async (userId: string, setId: string): Promise<SetRowWithOwner> => {
    if (!userId) {
      throw new SetServiceError("User context is required", 400);
    }

    const record = await fetchSetWithOwner(setId);

    if (!record) {
      throw new SetServiceError("Set not found", 404);
    }

    if (record.user_id !== userId) {
      throw new SetServiceError("You are not allowed to access this set", 403);
    }

    return record;
  };

  /**
   * Applies default values to the list query parameters.
   * @private
   * @param query - The raw query parameters from the request.
   * @returns A normalized query object with defaults applied.
   */
  const applyQueryDefaults = (query: ListSetsQueryDto = {}): NormalizedListQuery => {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const sortField: Required<ListSetsQueryDto>["sort"] = query.sort ?? "name";
    const order: Required<ListSetsQueryDto>["order"] = query.order ?? "asc";

    return {
      search: query.search?.trim() || undefined,
      page,
      limit,
      sort: sortField,
      order,
    } satisfies NormalizedListQuery;
  };

  /**
   * Creates a new set for a given user.
   * @param userId - The ID of the user creating the set.
   * @param command - The data for the new set.
   * @returns A promise that resolves to a `CreateSetResponseDto` containing the created set.
   * @throws {SetServiceError} If the user is not authenticated (400), a set with the same name exists (409), or the database operation fails (500).
   */
  const create = async (userId: string, command: CreateSetCommand): Promise<CreateSetResponseDto> => {
    if (!userId) {
      throw new SetServiceError("User context is required", 400);
    }

    const { data, error } = await supabase
      .from("sets")
      .insert([{ user_id: userId, ...command }])
      .select(SET_SELECT_COLUMNS)
      .single();

    if (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new SetServiceError("A set with this name already exists", 409, { cause: error });
      }

      throw new SetServiceError("Unable to create set", 500, { cause: error });
    }

    if (!data) {
      throw new SetServiceError("Failed to retrieve created set", 500);
    }

    const dto = mapToSetDto(data);
    return { data: dto };
  };

  /**
   * Lists all sets belonging to a user, with support for pagination, sorting, and searching.
   * @param userId - The ID of the user whose sets are to be listed.
   * @param query - Optional query parameters for pagination, sorting, and searching.
   * @returns A promise that resolves to a `ListSetsResponseDto` containing the list of sets and pagination metadata.
   * @throws {SetServiceError} If the user is not authenticated (400) or the database query fails (500).
   */
  const list = async (userId: string, query?: ListSetsQueryDto): Promise<ListSetsResponseDto> => {
    if (!userId) {
      throw new SetServiceError("User context is required", 400);
    }

    const { search, page, limit, sort, order } = applyQueryDefaults(query);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let request = supabase
      .from("sets")
      .select(SET_SELECT_COLUMNS, { count: "exact" })
      .eq("user_id", userId)
      .order(sort, { ascending: order === "asc" })
      .range(from, to);

    if (search) {
      request = request.ilike("name", `%${search}%`);
    }

    const { data, error, count } = await request;

    if (error) {
      throw new SetServiceError("Unable to fetch sets", 500, { cause: error });
    }

    const items = (data ?? []).map(mapToSetDto);
    const total = typeof count === "number" ? count : items.length;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    } satisfies ListSetsResponseDto;
  };

  /**
   * Retrieves a single set by its ID, ensuring user ownership.
   * @param userId - The ID of the user requesting the set.
   * @param setId - The ID of the set to retrieve.
   * @returns A promise that resolves to a `GetSetResponseDto` containing the set data.
   * @throws {SetServiceError} If ownership cannot be verified (403, 404).
   */
  const getById = async (userId: string, setId: string): Promise<GetSetResponseDto> => {
    const record = await assertOwnership(userId, setId);

    return { data: mapToSetDto(record) } satisfies GetSetResponseDto;
  };

  /**
   * Updates an existing set, ensuring user ownership.
   * @param userId - The ID of the user updating the set.
   * @param setId - The ID of the set to update.
   * @param command - The new data for the set.
   * @returns A promise that resolves to an `UpdateSetResponseDto` containing the updated set data.
   * @throws {SetServiceError} If ownership cannot be verified (403, 404), a name conflict occurs (409), or the database operation fails (500).
   */
  const update = async (userId: string, setId: string, command: UpdateSetCommand): Promise<UpdateSetResponseDto> => {
    await assertOwnership(userId, setId);

    const { data, error } = await supabase
      .from("sets")
      .update(command)
      .eq("id", setId)
      .select(SET_SELECT_COLUMNS)
      .single();

    if (error) {
      if (error.code === "PGRST116" || error.code === "42501") {
        throw new SetServiceError("Set not found", 404, { cause: error });
      }

      if (isUniqueConstraintViolation(error)) {
        throw new SetServiceError("A set with this name already exists", 409, { cause: error });
      }

      throw new SetServiceError("Unable to update set", 500, { cause: error });
    }

    return { data: mapToSetDto(data) } satisfies UpdateSetResponseDto;
  };

  /**
   * Deletes a set, ensuring user ownership.
   * @param userId - The ID of the user deleting the set.
   * @param setId - The ID of the set to delete.
   * @returns A promise that resolves to `null` on successful deletion.
   * @throws {SetServiceError} If ownership cannot be verified (403, 404) or the database operation fails (500).
   */
  const remove = async (userId: string, setId: string): Promise<DeleteSetResponseDto> => {
    await assertOwnership(userId, setId);

    const { error } = await supabase.from("sets").delete().eq("id", setId);

    if (error) {
      if (error.code === "PGRST116" || error.code === "42501") {
        throw new SetServiceError("Set not found", 404, { cause: error });
      }

      throw new SetServiceError("Unable to delete set", 500, { cause: error });
    }

    return null;
  };

  return { create, list, getById, update, remove };
};
