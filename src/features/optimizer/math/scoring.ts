export interface NflStats {
  passYds: number;
  passTd: number;
  rushYds: number;
  rushTd: number;
  recYds: number;
  recTd: number;
  turnover: number;
}

// FanTeam NFL scoring constants
const PASS_YDS_PTS = 0.04; // 1 point per 25 passing yards
const PASS_TD_PTS = 4;
const RUSH_YDS_PTS = 0.1; // 1 point per 10 rushing yards
const RUSH_TD_PTS = 6;
const REC_YDS_PTS = 0.1; // 1 point per 10 receiving yards
const REC_TD_PTS = 6;
const TURNOVER_PTS = -1; // interceptions/fumbles

/**
 * Compute FanTeam fantasy points for basic NFL statistics.
 * All fields are expected to be season or game totals.
 */
export function fanteamNflScore(stats: NflStats): number {
  return (
    stats.passYds * PASS_YDS_PTS +
    stats.passTd * PASS_TD_PTS +
    stats.rushYds * RUSH_YDS_PTS +
    stats.rushTd * RUSH_TD_PTS +
    stats.recYds * REC_YDS_PTS +
    stats.recTd * REC_TD_PTS +
    stats.turnover * TURNOVER_PTS
  );
}
