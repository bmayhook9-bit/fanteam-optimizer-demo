export type SportKey =
  | 'nfl'
  | 'nba'
  | 'mlb'
  | 'nhl'
  | 'soccer'
  | 'tennis'
  | 'golf'
  | 'f1'
  | 'csgo'
  | 'lol'
  | 'dota';

export function demoUrlFor(sport: SportKey): string | undefined {
  // default location for shipped static assets
  const slug = sport === 'soccer' ? 'football' : sport;
  return `/demo/${slug}/players.csv`;
}

export async function fetchDemoCsv(sport: SportKey): Promise<string> {
  const url = demoUrlFor(sport);
  if (!url) throw new Error(`No demo mapping for sport=${sport}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Demo not found at ${url}`);
  return res.text();
}
