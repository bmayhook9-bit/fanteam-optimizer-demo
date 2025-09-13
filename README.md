# fanteam-optimizer-demo

FanTeam Optimiser Tool demo showcasing a minimal Express API with a small React-based UI.

## Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node)

## Install dependencies
```bash
npm install
```

## Build the frontend
The UI source lives in the `ui/` directory. Bundle it with [Vite](https://vitejs.dev/) into the `dist/` folder that the server serves:

```bash
npx vite build ui
```

## Environment variables
The server uses environment variables for configuration:

- `JWT_SECRET` (**required**) – secret key used to sign JWT tokens. Example: `export JWT_SECRET="supersecret"` (macOS/Linux) or `set JWT_SECRET=supersecret` (Windows Command Prompt).
- `PORT` (optional) – port for the HTTP server. Defaults to `3000`.

## Run the server
After installing dependencies, building the UI and setting the environment variables, start the API server:

```bash
JWT_SECRET=your_secret npm start
```

The server will serve the built static files from `dist/` and expose API routes under `/api`.

## Testing
Run the unit tests with [Vitest](https://vitest.dev/):

```bash
npm test
```

