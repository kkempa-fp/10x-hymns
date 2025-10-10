# 10x-hymns

## Project Description
10x-hymns is a modern web application that offers a dynamic platform for managing and delivering liturgical hymn sets. By leveraging cutting-edge web technologies, it ensures high performance, enhanced accessibility, and a seamless user experience.

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
- **Static Hymn Collection:** A predefined database of hymns stored with vector embeddings for semantic search.
- **Automatic Hymn Set Generation:** Integration with LLM-based models to analyze liturgical text, automatically segment it (e.g., entrance, preparation of gifts, communion, exaltation, conclusion), and generate hymn suggestions.
- **Manual Hymn Set Creation:** A user-friendly interface to manually craft, edit, and manage hymn sets with validation to prevent duplicate entries.
- **Hymn Set Regeneration:** Capability to regenerate hymn sets ensuring a variety of options for the same liturgical text.
- **User Account Management:** Secure registration, login, and account deletion functionalities to protect user data and personalize hymn management experience.
- **Usage Metrics:** Collection of statistics on AI-generated hymn sets and their acceptance rates, providing insights into system performance and user preferences.

## Project Status
The project is currently in the MVP stage and under active development.

## License
This project is licensed under the MIT License.
