# REST API Plan - 10x Hymns

This document outlines the REST API for the 10x Hymns application, designed based on the project's PRD, database schema, and technical stack.

## 1. Resources

- **Hymns**: Represents the collection of hymns. Corresponds to the `hymns` table. This is a read-only resource.
- **Sets**: Represents user-created sets of hymns for liturgy. Corresponds to the `sets` table.
- **Ratings**: Represents user feedback on hymn suggestions. Corresponds to the `ratings` table.
- **Suggestions**: A virtual resource for generating hymn suggestions based on liturgical text. It does not directly map to a single table but interacts with `hymns` and the AI model service.

## 2. Endpoints

### 2.1. Suggestions

#### POST /api/suggestions

- **Description**: Generates a list of hymn suggestions based on a provided text. Authenticated requests use live Gemini embeddings, while anonymous guests receive deterministic demo vectors. The response exposes the active mode via `meta.mode`.
- **Request Body**:
  ```json
  {
    "text": "string",
    "count": "integer" // optional, defaults to 3
  }
  ```
- **Response Body (Success)**:
  ```
  {
    "data": [
      {
        "number": "string",
        "name": "string",
        "category": "string"
      }
    ],
    "meta": {
      "mode": "full" | "demo"
    }
  }
  ```
- **Success Codes**:
  - `200 OK`: Successfully generated and returned suggestions.
- **Error Codes**:
  - `400 Bad Request`: The request body is invalid (e.g., missing `text`).
  - `500 Internal Server Error`: An error occurred during embedding generation or database query.

  > **Notes**: When `meta.mode` is `demo`, the payload is deterministic and no paid API calls are made. Clients should encourage users to authenticate to unlock the `full` mode.

### 2.2. Ratings

#### POST /api/ratings

- **Description**: Submits a rating (up or down) for a set of proposed hymns.
- **Request Body**:
  ```json
  {
    "proposed_hymn_numbers": ["string"],
    "rating": "string", // "up" or "down"
    "client_fingerprint": "string"
  }
  ```
- **Response Body (Success)**:
  ```json
  {
    "message": "Rating submitted successfully."
  }
  ```
- **Success Codes**:
  - `201 Created`: The rating was successfully created.
- **Error Codes**:
  - `400 Bad Request`: Invalid request body (e.g., invalid `rating` value).
  - `500 Internal Server Error`: Failed to save the rating.

### 2.3. Sets

#### GET /api/sets

- **Description**: Retrieves a list of hymn sets for the authenticated user. Supports searching by name.
- **Query Parameters**:
  - `search` (string, optional): Filters sets by name (case-insensitive, contains).
  - `page` (integer, optional, default: 1): The page number for pagination.
  - `limit` (integer, optional, default: 10): The number of items per page.
  - `sort` (string, optional, default: 'updated_at'): The field to sort by (e.g., 'name', 'created_at').
  - `order` (string, optional, default: 'desc'): The sort order ('asc' or 'desc').
- **Response Body (Success)**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "name": "string",
        "content": "string",
        "created_at": "timestamptz",
        "updated_at": "timestamptz"
      }
    ]
  }
  ```
- **Success Codes**:
  - `200 OK`: Successfully retrieved the list of sets.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `500 Internal Server Error`: An error occurred while fetching data.

#### POST /api/sets

- **Description**: Creates a new hymn set for the authenticated user.
- **Request Body**:
  ```json
  {
    "name": "string",
    "content": "string"
  }
  ```
- **Response Body (Success)**:
  ```json
  {
    "data": {
      "id": "uuid",
      "name": "string"
      // ... other fields
    }
  }
  ```
- **Success Codes**:
  - `201 Created`: The set was successfully created.
- **Error Codes**:
  - `400 Bad Request`: Invalid request body or validation error.
  - `401 Unauthorized`: User is not authenticated.
  - `409 Conflict`: A set with the same name already exists for this user.
  - `500 Internal Server Error`: Failed to create the set.

#### GET /api/sets/{id}

- **Description**: Retrieves a single hymn set by its ID.
- **Response Body (Success)**:
  ```json
  {
    "data": {
      "id": "uuid",
      "name": "string",
      "content": "string"
      // ... other fields
    }
  }
  ```
- **Success Codes**:
  - `200 OK`: Successfully retrieved the set.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User does not have permission to access this set.
  - `404 Not Found`: The set with the specified ID was not found.
  - `500 Internal Server Error`: An error occurred while fetching data.

#### PUT /api/sets/{id}

- **Description**: Updates an existing hymn set.
- **Request Body**:
  ```json
  {
    "name": "string",
    "content": "string"
  }
  ```
- **Response Body (Success)**:
  ```json
  {
    "data": {
      "id": "uuid",
      "name": "string",
      "content": "string"
      // ... other fields
    }
  }
  ```
- **Success Codes**:
  - `200 OK`: The set was successfully updated.
- **Error Codes**:
  - `400 Bad Request`: Invalid request body or validation error.
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User does not have permission to update this set.
  - `404 Not Found`: The set with the specified ID was not found.
  - `409 Conflict`: A set with the same name already exists for this user.
  - `500 Internal Server Error`: Failed to update the set.

#### DELETE /api/sets/{id}

- **Description**: Deletes a hymn set by its ID.
- **Response Body (Success)**:
  - Empty body.
- **Success Codes**:
  - `204 No Content`: The set was successfully deleted.
- **Error Codes**:
  - `401 Unauthorized`: User is not authenticated.
  - `403 Forbidden`: User does not have permission to delete this set.
  - `404 Not Found`: The set with the specified ID was not found.
  - `500 Internal Server Error`: Failed to delete the set.

### 2.4. Embeddings

#### POST /api/embed

- **Description**: Generates embedding vectors for supplied content. Authenticated callers receive real Gemini embeddings; unauthenticated requests are served mock vectors for demo purposes.
- **Request Body**: Matches `EmbeddingParams` (see embedding service plan).
- **Response Body (Success)**:
  ```json
  {
    "data": [[0.1, 0.2, "..." ]],
    "meta": {
      "mode": "full" | "demo"
    }
  }
  ```
- **Success Codes**:
  - `200 OK`: Embeddings (real or demo) generated successfully.
- **Error Codes**:
  - `400 Bad Request`: Invalid payload.
  - `401 Unauthorized`: Session missing for full mode requests (mock data still returned when unauthenticated).
  - `500/502`: Upstream embedding service failure.

> **Notes**: This endpoint is intended for internal use. Consider adding rate limiting before production deployment.

## 3. Authentication and Authorization

- **Mechanism**: Authentication is managed by Supabase Auth sessions stored in secure HTTP-only cookies. JWT bearer headers remain supported for programmatic access.
- **Implementation**:
  - Astro middleware (`src/middleware/index.ts`) instantiates a Supabase server client using incoming cookies/headers and attaches `locals.user` / `locals.session` for downstream handlers.
  - When a route requires authentication, it checks `locals.user`; absence results in `401 Unauthorized` or `403 Forbidden` (when resources exist but belong to another user).
  - Authenticated fetches from the browser should include `credentials: "include"` to propagate the session cookie.
- **Authorization**: Row-Level Security (RLS) policies in the Supabase database will enforce authorization. API endpoints will rely on these policies to ensure users can only access or modify their own data (e.g., their own `sets`).

## 4. Validation and Business Logic

- **Framework**: Zod will be used for validating request payloads in all API endpoints.
- **Validation Rules**:
  - **Suggestions**:
    - `text`: Must be a non-empty string.
    - `count`: Must be a positive integer.
  - **Ratings**:
    - `proposed_hymn_numbers`: Must be an array of strings.
    - `rating`: Must be either `'up'` or `'down'`.
    - `client_fingerprint`: Must be a non-empty string.
  - **Sets**:
    - `name`: Must be a non-empty string. The database enforces uniqueness per user (`sets_user_name_ci_idx`). The API will return a `409 Conflict` error on violation.
  - `content`: Must be a string (required, non-empty).
- **Business Logic Implementation**:
  - **Hymn Suggestion**: The `/api/suggestions` endpoint will encapsulate the logic of calling an internal service to get an embedding for the input text and then querying the `hymns` table using `pgvector`'s similarity search to find the closest matches.
  - **Set Name Search**: The `GET /api/sets` endpoint will use a `LIKE` or `ILIKE` query (or `pg_trgm` for better performance) to filter sets based on the `search` query parameter, implementing the case-insensitive "contains" search requirement.
