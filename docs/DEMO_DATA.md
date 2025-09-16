# Demo data mapping

Demo CSVs are statically copied from `static/demo/` into the production bundle via Vite’s `publicDir`.

- The optimizer auto-loads `/demo/<sport>/players.csv` whenever a sport is selected without existing players.
- Optional alternates (e.g. `showdown.csv`) can live alongside `players.csv` and are referenced from `public/src/main.js`.
- To update a sport, drop the CSVs you want into `static/demo/<sport>/` before building.

