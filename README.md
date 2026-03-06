# Finance Manager – Frontend

Web app for **Finance Manager**, a personal finance application to manage income, expenses, categories, subcategories, and transactions. Built with React and Vite.

**Live:** [https://heavenance.web.app](https://heavenance.web.app)

## Tech Stack

- **Runtime:** Node.js  
- **Build:** [Vite](https://vitejs.dev/) 7  
- **UI:** [React](https://react.dev/) 19  
- **Language:** TypeScript  
- **UI libraries:** [Ant Design](https://ant.design/), [MUI (Material UI)](https://mui.com/), [Emotion](https://emotion.sh/)  
- **Charts:** Chart.js, react-chartjs-2, MUI X Charts  
- **Auth:** [Supabase](https://supabase.com/) (Supabase JS client)  
- **Routing:** React Router DOM 7  
- **Styles:** SASS/SCSS  

## Prerequisites

- Node.js 18+  
- npm or yarn  
- A Supabase project (for auth)  
- Backend API (see [finance-manager-backend](../finance-manager-backend))  

## Installation

```bash
# Clone the repository (or navigate to the frontend folder)
cd finance-manager-frontend

# Install dependencies
npm install

# Copy environment template and fill in your values (see Environment Variables)
# cp .env.example .env
```

## Environment Variables

Create a `.env` file in the project root. The app expects:

| Variable                  | Description                          |
|---------------------------|--------------------------------------|
| `VITE_SUPABASE_URL`       | Your Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY`  | Supabase anonymous (public) API key  |

The backend API URL is set in `src/environments/environment.ts` (dev) and `src/environments/environment.production.ts` (prod). Adjust `backendApiUrl` there if your API runs elsewhere.

## Running the App

```bash
# Development (dev server with HMR)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

The app runs at `http://localhost:5173` in development.

## Scripts

| Command            | Description                    |
|--------------------|--------------------------------|
| `npm run dev`      | Starts the Vite dev server     |
| `npm run build`    | Type-checks and builds for production |
| `npm run preview`  | Serves the production build    |
| `npm run lint`     | Runs ESLint                    |

## Project Structure

- **`src/`** – Source code  
  - **`components/`** – Reusable UI (sidebar, modals for expense/income/category, OFX import, etc.)  
  - **`pages/`** – Login, Sign up, Dashboard, Categories, Transactions  
  - **`routes/`** – React Router setup  
  - **`services/`** – Auth, Supabase client, API clients (categories, expenses, incomes, transactions, users), OFX import  
  - **`environments/`** – Dev and production config (e.g. backend API URL)  
  - **`styles/`** – Global SASS (layout, typography, colors, spacing, icons)  
  - **`types/`** – TypeScript interfaces  
  - **`lib/`** – Supabase client initialization  
  - **`utils/`** – Helpers  
  - **`assets/`** – Static assets  

- **`public/`** – Static files (favicon, logo)  
- **`index.html`** – Entry HTML  

## Main Features

- **Auth:** Login and sign up via Supabase Auth  
- **Dashboard:** Overview and charts (income/expenses)  
- **Categories & subcategories:** CRUD with custom colors  
- **Transactions:** List, filter, add income/expense, OFX import  
- **Notifications:** In-app feedback via Ant Design  

## License

UNLICENSED – private use only.
