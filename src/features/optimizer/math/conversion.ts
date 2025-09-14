import { fanteamNflScore, NflStats } from './scoring';
import { calibrateProjection, loadCalibration } from './calibration';

export interface RawStats {
  [stat: string]: number | undefined;
}

export interface Projection {
  mean: number;
  floor: number;
  ceiling: number;
}

/**
 * Convert arbitrary raw stat projections into FanTeam fantasy points.
 * Missing stats default to zero. Floor/Ceiling use a naive ±20% band.
 */
export async function convertNflProjection(raw: RawStats): Promise<Projection> {
  const stats: NflStats = {
    passYds: raw.passYds ?? 0,
    passTd: raw.passTd ?? 0,
    rushYds: raw.rushYds ?? 0,
    rushTd: raw.rushTd ?? 0,
    recYds: raw.recYds ?? 0,
    recTd: raw.recTd ?? 0,
    turnover: raw.turnover ?? 0,
  };

  const base = fanteamNflScore(stats);
  const projection: Projection = {
    mean: base,
    floor: base * 0.8,
    ceiling: base * 1.2,
  };

  const factors = await loadCalibration();
  return calibrateProjection(projection, factors);
}
