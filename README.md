# 10x-hymns

## Project Description
10x-hymns is an intelligent web application designed to simplify and accelerate the process of selecting hymns for the liturgy of the Holy Mass. By analyzing liturgical text fragments (e.g., antiphons, readings) provided by the user, the application suggests suitable hymns using vector embeddings. It aims to solve the time-consuming problem faced by organists, priests, and music ministers of manually searching for thematically appropriate hymns. The application is a responsive Single Page Application (SPA), ensuring a seamless user experience across various devices.

## Tech Stack
- **Astro 5:** Fast static site generation and hybrid rendering.
- **TypeScript 5:** Modern type safety for scalable code.
- **React 19:** Dynamic user interfaces.
- **Tailwind CSS 4:** Utility-first CSS framework for efficient styling.
- **Shadcn/ui:** Component library for polished UI designs.

## Getting Started Locally

### Prerequisites
- Node.js (refer to the version specified in the `.nvmrc` file)
- npm (or yarn)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/kkempa-fp/10x-hymns.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd 10x-hymns
   ```
3. **Install dependencies:**
   ```bash
   npm install
   ```
4. **Start the development server:**
   ```bash
   npm run dev
   ```

## Available Scripts
- **`npm run dev`** — Starts the Astro development server.
- **`npm run build`** — Builds the project for production.
- **`npm run preview`** — Serves the production build locally.
- **`npm run astro`** — Runs Astro CLI commands.
- **`npm run lint`** — Runs ESLint to check for linting issues.
- **`npm run lint:fix`** — Automatically fixes linting issues.
- **`npm run format`** — Formats the codebase with Prettier.

## Project Scope
Key features include:
- **AI-Powered Hymn Suggestions:** Users can paste liturgical text to receive a list of hymn suggestions based on semantic similarity, calculated using vector embeddings.
- **Static Hymn Database:** A non-modifiable collection of hymns, each containing a title, number, category, and a pre-calculated embedding vector.
- **User Authentication:** Secure registration and login for users to access personalized features.
- **Hymn Set Management (for authenticated users):**
    - Create, view, search, edit, and delete custom hymn sets.
    - Each set consists of five dedicated fields: Entrance, Offertory, Communion, Adoration, and Recessional.
- **Suggestion Rating System:** A feedback mechanism (thumbs up/down) for users to rate the quality of hymn suggestions, helping to measure the system's effectiveness.

## Project Status
The project is currently in the MVP stage and under active development.

## License
This project is licensed under the MIT License.
