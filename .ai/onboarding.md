# Project Onboarding - 10x Hymns

## Welcome

Welcome to the 10x Hymns project! This is an intelligent web application designed to simplify and accelerate the process of selecting hymns for the liturgy of the Holy Mass. By analyzing liturgical text fragments, the application suggests suitable hymns using vector embeddings, aiming to assist organists, priests, and music ministers.

## Project Overview & Structure

The project is a modern web application built with a clear and organized structure. It leverages Astro for static site generation and server-side rendering, with React for interactive UI components. The backend is powered by Supabase, and the entire application is written in TypeScript.

- **`src/`**: Contains all the source code.
  - **`pages/`**: Astro pages that define the application's routes.
  - **`components/`**: Reusable UI components, including static Astro components and interactive React components (`.tsx`).
  - **`layouts/`**: Main Astro layout files for page structure.
  - **`db/`**: Supabase client and database type definitions.
  - **`lib/`**: Core application logic, services, and utility functions.
  - **`middleware/`**: Astro middleware for handling requests.
- **`public/`**: Static assets that are publicly accessible.
- **`supabase/`**: Database migrations and configuration for Supabase.
- **`e2e/`**: End-to-end tests written with Playwright.
- **`tests/`**: Unit and integration tests written with Vitest.
- **`data/`**: Scripts and data files related to hymn data processing.

## Core Modules

### `src/lib/services`

- **Role:** This directory contains the core business logic for features like generating hymn suggestions using AI embeddings. It's the brain of the application.
- **Key Files/Areas:** Files related to embedding generation and matching hymns are critical here.
- **Recent Focus:** Based on the project's goals, recent work has likely focused on refining the suggestion algorithm and integrating it with the Supabase backend.

### `src/components/views`

- **Role:** Contains higher-level React components that compose the main UI views of the application, such as the suggestion generator, sets manager, and authentication forms.
- **Key Files/Areas:** `SuggestionGenerator.tsx`, `SetsManager.tsx`, `AuthModal.tsx`.
- **Recent Focus:** Development has likely centered on building out the user-facing features for hymn suggestion, set management, and user authentication.

### `supabase/migrations`

- **Role:** Manages the database schema, including tables, functions, and policies. This is where the database structure is defined and versioned.
- **Key Files/Areas:** The SQL files define the schema for hymns, sets, ratings, and the `match_hymns` function which is crucial for the AI-powered suggestions.
- **Recent Focus:** Recent changes likely involve creating and refining the tables and functions needed to support the core features of the application.

## Key Contributors

Based on the Git history, the primary contributor to the project is:

- **Krzysztof Kempa (kkempa-fp):** Appears to be the lead developer, with commits across all major areas of the application, including frontend, backend, and infrastructure.

## Overall Takeaways & Recent Focus

The project is centered around a sophisticated AI-powered hymn suggestion feature. The development focus appears to be on building a robust and user-friendly SPA. Key themes are:

- **AI Integration:** The use of vector embeddings to provide semantic search for hymns is the core innovation.
- **Modern Frontend:** A combination of Astro and React for a performant and interactive user experience.
- **Backend as a Service:** Leveraging Supabase for database, authentication, and other backend needs.
- **Comprehensive Testing:** The project has a solid testing strategy with both unit/integration tests (Vitest) and end-to-end tests (Playwright).

## Potential Complexity/Areas to Note

- **AI and Database Interaction:** The `match_hymns` SQL function, which likely performs vector similarity searches, is a complex and performance-critical piece of the application.
- **Astro and React Interoperability:** Understanding how Astro islands are used to hydrate React components on the client-side is important for frontend development.
- **Data Management:** The initial data extraction and embedding generation process (found in the `data/` directory) is a crucial part of the system that underpins the main feature.

## Questions for the Team

1.  Who are the main points of contact for different parts of the codebase (e.g., frontend, backend, AI)?
2.  What is the process for generating and updating hymn embeddings? Is it automated?
3.  Could you walk me through the CI/CD pipeline and the deployment process to Cloudflare pages?
4.  How is the Supabase environment managed for local development versus production?
5.  Are there any established coding patterns or architectural principles I should be aware of beyond what's in the documentation?
6.  What are the future plans for the suggestion rating system? How will the feedback be used?
7.  What is the best way to get access to the development environment variables?

## Next Steps

1.  **Set up the local environment:** Follow the instructions in the `README.md` to get the project running on your machine.
2.  **Explore the suggestion logic:** Dive into `src/lib/services` and the `match_hymns` function in the Supabase migrations to understand how suggestions are generated.
3.  **Run the tests:** Execute the unit and end-to-end tests to see the application in action and understand the expected behavior.
4.  **Review the database schema:** Examine the files in `supabase/migrations` to understand the data model.
5.  **Create a test set:** Log in to the application and try creating a new set of hymns to familiarize yourself with the user flow.

## Development Environment Setup

To set up the development environment, follow these steps:

1.  **Prerequisites:** Ensure you have Node.js installed (the specific version is in the `.nvmrc` file).
2.  **Clone the repository:**
    ```bash
    git clone https://github.com/kkempa-fp/10x-hymns.git
    cd 10x-hymns
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Set up environment variables:** Create a `.env` file based on `.env.example` and populate it with the necessary credentials for Supabase.
5.  **Start the development server:**
    ```bash
    npm run dev
    ```

## Helpful Resources

- **GitHub Repository:** [https://github.com/kkempa-fp/10x-hymns](https://github.com/kkempa-fp/10x-hymns)

(No other external links were found in the checked files.)
