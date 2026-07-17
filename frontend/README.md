# CyberShield AI - Frontend

The frontend for the CyberShield Indian Currency Counterfeit Detection System. Built with Next.js (App Router), React 19, TypeScript, Tailwind CSS, Zustand, and React Query.

## Table of Contents
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development](#development)
- [Testing](#testing)
- [Build & Deployment](#build--deployment)
- [Environment Variables](#environment-variables)

## Architecture
This project follows Clean Architecture principles tailored for frontend development:
- **Components:** Dumb/Presentational components in `components/ui` and smart/domain components grouped by feature.
- **State Management:** Zustand for global state (`store/`), React Query for server state.
- **Services:** Axios-based API client separated by domain (`services/`).
- **Routing:** Next.js App Router with unified middleware for auth.

## Prerequisites
- Node.js 18.17.0 or newer
- npm, pnpm, or yarn

## Installation
1. Clone the repository.
2. Navigate to the frontend directory: `cd frontend`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure the environment variables in `.env.local`.

## Development
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

## Testing
We use Jest and React Testing Library for comprehensive unit and component testing.
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Build & Deployment
To build for production, run:
```bash
npm run build
```
Start the production server:
```bash
npm start
```

The application is fully containerized. To build the Docker image:
```bash
docker build -t cybershield-frontend .
```

## Environment Variables
See `.env.local` for required configuration variables.
