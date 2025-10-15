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

const SET_SELECT_COLUMNS = "id,name,entrance,offertory,communion,adoration,recessional,created_at,updated_at" as const;

type SetRow = Pick<
  Set,
  "id" | "name" | "entrance" | "offertory" | "communion" | "adoration" | "recessional" | "created_at" | "updated_at"
>;

export class SetServiceError extends Error {
  readonly status: number;
  override readonly cause?: unknown;

  constructor(message: string, status = 500, options?: { cause?: unknown }) {
    super(message);
    this.name = "SetServiceError";
    this.status = status;
    this.cause = options?.cause;
  }
}

const mapToSetDto = (row: SetRow): SetDto => ({
  id: row.id,
  name: row.name,
  entrance: row.entrance,
  offertory: row.offertory,
  communion: row.communion,
  adoration: row.adoration,
  recessional: row.recessional,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const isUniqueConstraintViolation = (error: PostgrestError | null) => error?.code === "23505";

export const createSetsService = (supabase: SupabaseClient) => {
  type NormalizedListQuery = { search?: string } & Required<Omit<ListSetsQueryDto, "search">>;

  const applyQueryDefaults = (query: ListSetsQueryDto = {}): NormalizedListQuery => {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const sortField: Required<ListSetsQueryDto>["sort"] = query.sort ?? "updated_at";
    const order: Required<ListSetsQueryDto>["order"] = query.order ?? "desc";

    return {
      search: query.search?.trim() || undefined,
      page,
      limit,
      sort: sortField,
      order,
    } satisfies NormalizedListQuery;
  };

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

    const { data, error } = await request;

    if (error) {
      throw new SetServiceError("Unable to fetch sets", 500, { cause: error });
    }

    const items = (data ?? []).map(mapToSetDto);
    return { data: items } satisfies ListSetsResponseDto;
  };

  const getById = async (userId: string, setId: string): Promise<GetSetResponseDto> => {
    if (!userId) {
      throw new SetServiceError("User context is required", 400);
    }

    const { data, error } = await supabase
      .from("sets")
      .select(SET_SELECT_COLUMNS)
      .eq("user_id", userId)
      .eq("id", setId)
      .maybeSingle();

    if (error) {
      throw new SetServiceError("Unable to fetch set", 500, { cause: error });
    }

    if (!data) {
      throw new SetServiceError("Set not found", 404);
    }

    return { data: mapToSetDto(data) } satisfies GetSetResponseDto;
  };

  const update = async (userId: string, setId: string, command: UpdateSetCommand): Promise<UpdateSetResponseDto> => {
    if (!userId) {
      throw new SetServiceError("User context is required", 400);
    }

    const { data, error } = await supabase
      .from("sets")
      .update(command)
      .eq("user_id", userId)
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

  const remove = async (userId: string, setId: string): Promise<DeleteSetResponseDto> => {
    if (!userId) {
      throw new SetServiceError("User context is required", 400);
    }

    const { error } = await supabase.from("sets").delete().eq("user_id", userId).eq("id", setId);

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
