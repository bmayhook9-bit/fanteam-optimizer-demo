# Algorithm Transparency

This project documents how fantasy projections are derived and adjusted.

## NFL Projection Conversion
1. **Normalize stats** – missing values default to zero.
2. **Apply FanTeam scoring** – see `src/features/optimizer/math/scoring.ts`.
3. **Estimate variance** – floor and ceiling use ±20% of the mean.
4. **Calibration** – multipliers from `calibration.json` scale mean/floor/ceiling.

These assumptions will evolve with further research and community feedback.
