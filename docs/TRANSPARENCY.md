# Algorithm Transparency

This document explains how projections are produced and adjusted. It will evolve with community feedback and validation.

## NFL Conversion Pipeline (MVP “gold thread”)
1. **Normalize raw stats** to per-game/per-snap units and fill missing values with conservative defaults.
2. **Apply FanTeam scoring** via pure functions (`src/features/optimizer/math/scoring.ts`), using named constants (no magic numbers).
3. **Variance model** to estimate floor/ceiling from the mean (simple, documented assumption; subject to refinement).
4. **Calibration** using versioned factors in `calibration.json` applied by `calibrateProjection()` to correct systemic bias.

## Assumptions & Limitations
- Variance is a placeholder; to be refined with holdout evaluation.
- Ownership is not modeled yet; proxy fields may be added later.
- Factors are sport-specific; current validation is **NFL only**.

## Transparency & Reproducibility
- All math implemented as pure, typed functions with inline comments.
- Constants are named and explained with references in code comments.
- Calibration factors are versioned JSON and easy to review or revert.
