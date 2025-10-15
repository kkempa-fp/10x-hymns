import type { APIRoute } from "astro";
import { z } from "zod";

import { DEFAULT_USER_ID } from "../../../db/supabase.client.ts";
import { createSetsService, SetServiceError } from "../../../lib/services/sets.service.ts";
import type { UpdateSetCommand } from "../../../types";

const MAX_FIELD_LENGTH = 200;

const optionalSetField = (label: string) =>
  z
    .string({ invalid_type_error: `${label} must be a string` })
    .trim()
    .max(MAX_FIELD_LENGTH)
    .optional()
    .default("");

const updateSetSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be a string" })
    .trim()
    .min(1, "Name is required")
    .max(MAX_FIELD_LENGTH, "Name cannot exceed 200 characters"),
  entrance: optionalSetField("Entrance"),
  offertory: optionalSetField("Offertory"),
  communion: optionalSetField("Communion"),
  adoration: optionalSetField("Adoration"),
  recessional: optionalSetField("Recessional"),
});

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const extractSetId = (params: Record<string, string | undefined>) => {
  const setId = params.id?.trim();
  if (!setId) {
    throw new SetServiceError("Set id is required", 400);
  }
  return setId;
};

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return jsonResponse({ error: "Supabase client not configured" }, 500);
  }

  try {
    const setId = extractSetId(params);
    const response = await createSetsService(supabase).getById(DEFAULT_USER_ID, setId);
    return jsonResponse(response, 200);
  } catch (unknownError) {
    if (unknownError instanceof SetServiceError) {
      return jsonResponse({ error: unknownError.message }, unknownError.status);
    }

    return jsonResponse({ error: "Failed to fetch set" }, 500);
  }
};

export const PUT: APIRoute = async ({ request, params, locals }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return jsonResponse({ error: "Supabase client not configured" }, 500);
  }

  let command: UpdateSetCommand;

  try {
    const payload = await request.json();
    const parsed = updateSetSchema.parse(payload);
    command = {
      name: parsed.name,
      entrance: parsed.entrance,
      offertory: parsed.offertory,
      communion: parsed.communion,
      adoration: parsed.adoration,
      recessional: parsed.recessional,
    } satisfies UpdateSetCommand;
  } catch (parseError) {
    if (parseError instanceof SyntaxError) {
      return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    if (parseError instanceof z.ZodError) {
      return jsonResponse({ errors: parseError.format() }, 400);
    }

    return jsonResponse({ error: "Failed to process request" }, 500);
  }

  try {
    const setId = extractSetId(params);
    const response = await createSetsService(supabase).update(DEFAULT_USER_ID, setId, command);
    return jsonResponse(response, 200);
  } catch (unknownError) {
    if (unknownError instanceof SetServiceError) {
      return jsonResponse({ error: unknownError.message }, unknownError.status);
    }

    return jsonResponse({ error: "Failed to update set" }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase;

  if (!supabase) {
    return jsonResponse({ error: "Supabase client not configured" }, 500);
  }

  try {
    const setId = extractSetId(params);
    await createSetsService(supabase).remove(DEFAULT_USER_ID, setId);
    return new Response(null, { status: 204 });
  } catch (unknownError) {
    if (unknownError instanceof SetServiceError) {
      return jsonResponse({ error: unknownError.message }, unknownError.status);
    }

    return jsonResponse({ error: "Failed to delete set" }, 500);
  }
};
