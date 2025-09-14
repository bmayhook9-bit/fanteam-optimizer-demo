# Algorithm Transparency

This document explains how projections are produced and adjusted. It will evolve with community feedback and validation.

## NFL Conversion Pipeline (MVP “gold thread”)
1. Normalize raw stats to per-game/per-snap units (fill missing conservatively).
2. Apply FanTeam scoring via pure functions (`src/features/optimizer/math/scoring.ts`).
3. Variance model to estimate floor/ceiling from mean (simple assumption).
4. Calibration using versioned factors in `calibration.json` via `calibrateProjection()`.

## Assumptions & Limitations
- Variance is a placeholder; refine with holdout evaluation.
- Ownership not modeled yet; proxy fields may come later.
- Factors sport-specific; current validation is **NFL only**.

## Transparency & Reproducibility
- Math is pure, typed, and commented.
- Constants are named & explained in code comments.
- Calibration factors are versioned JSON (reviewable & revertible).
