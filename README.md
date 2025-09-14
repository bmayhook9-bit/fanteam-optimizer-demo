# fanteam-optimizer-demo
FanTeam Optimizer Tool

## Deployment

Set the `JWT_SECRET` environment variable before starting the server. The
server will refuse to start if this variable is missing.

```bash
export JWT_SECRET=your-secret
npm start
```

## Demo data

Example CSV datasets used by the UI demo are stored under `tests/fixtures/demo`.
These files are not served with the production build. Tests load them using
relative paths, and you can use them locally by copying the desired CSVs into
`public/demo` or by adjusting the paths in `public/src/main.js`.

To obtain updated demo data, download the CSV exports from FanTeam and place
them in `tests/fixtures/demo` (and optionally `public/demo` for the browser demo).
