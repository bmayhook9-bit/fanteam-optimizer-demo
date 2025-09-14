import { describe, it, expect } from 'vitest';
import { convertNflProjection } from '../../src/features/optimizer/math/conversion';
import { calibrateProjection } from '../../src/features/optimizer/math/calibration';

describe('NFL projection conversion', () => {
  it('handles missing stats as zeros', async () => {
    const proj = await convertNflProjection({});
    expect(proj.mean).toBe(0);
    expect(proj.floor).toBe(0);
    expect(proj.ceiling).toBe(0);
  });

  it('computes scoring and calibration', async () => {
    const raw = { passYds: 250, passTd: 2, turnover: 1 };
    const proj = await convertNflProjection(raw);
    // base score: 250*0.04 + 2*4 + 0 -1 = 10 +8 -1 =17
    expect(proj.mean).toBeCloseTo(17, 5);
    expect(proj.floor).toBeCloseTo(13.6, 5);
    expect(proj.ceiling).toBeCloseTo(20.4, 5);
  });

  it('applies custom calibration factors', () => {
    const calibrated = calibrateProjection(
      { mean: 10, floor: 8, ceiling: 12 },
      { mean: 1.1, floor: 0.9, ceiling: 1.2 },
    );
    expect(calibrated.mean).toBeCloseTo(11);
    expect(calibrated.floor).toBeCloseTo(7.2);
    expect(calibrated.ceiling).toBeCloseTo(14.4);
  });
});
