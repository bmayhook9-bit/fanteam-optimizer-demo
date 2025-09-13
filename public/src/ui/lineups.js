import { showToast } from './toast.js';

export function generateLineupsMaxSpend(state, SPORT_CONFIGS, usesCaptains, shuffle) {
  const cfg = SPORT_CONFIGS[state.detectedSport];
  const withCap = usesCaptains(state.detectedSport, state.contestType);

  const pool = state.players.filter(p => p.selected).sort((a,b)=>b.salary-a.salary);
  if (pool.length < cfg.lineupSize) throw new Error(`Need ≥ ${cfg.lineupSize} selected players; have ${pool.length}.`);

  let caps = [];
  if (withCap){
    caps = pool.filter(p=>p.captain);
    if (!caps.length) throw new Error('Need at least 1 captain candidate.');
  } else {
    caps = [null];
  }

  const N   = +document.getElementById('lineupCount').value || 20;
  const min = +document.getElementById('minSalary').value;
  const max = +document.getElementById('maxSalary').value;

  const uniq = new Set();
  const out  = [];

  const tryBuild = (cap) => {
    const base=[]; let total=0;
    if(cap){ base.push(cap); total+=cap.salary; }
    const others = shuffle(pool.filter(p=>!cap || p.id!==cap.id));

    for (const p of others){
      if (base.length>=cfg.lineupSize) break;
      if (total + p.salary <= max){ base.push(p); total+=p.salary; }
    }

    if (base.length<cfg.lineupSize){
      for (const p of others){
        if (base.find(x=>x.id===p.id)) continue;
        base.push(p); total+=p.salary;
        if (base.length>=cfg.lineupSize) break;
      }
    }

    base.sort((a,b)=>b.salary-a.salary);
    while (base.length>cfg.lineupSize){
      const iMin = base.reduce((m,p,i)=> p.salary<base[m].salary? i:m,0);
      total -= base[iMin].salary;
      base.splice(iMin,1);
    }

    let improved=true, guard=0;
    while (improved && guard<200){
      improved=false; guard++;
      const iMin = base.reduce((m,p,i)=> p.salary<base[m].salary? i:m,0);
      const cheapest = base[iMin];
      const cand = others.find(p => !base.find(x=>x.id===p.id) && (total - cheapest.salary + p.salary) <= max && p.salary > cheapest.salary);
      if (cand){
        total = total - cheapest.salary + cand.salary;
        base[iMin] = cand;
        improved = true;
      }
    }

    if (base.length===cfg.lineupSize && total>=min && total<=max){
      const key = base.map(p=>p.id).sort().join('|') + (cap?`|C:${cap.id}`:'');
      if (!uniq.has(key)){
        uniq.add(key);
        out.push({ id: out.length+1, players: base, captain: cap, totalSalary: total });
      }
    }
  };

  const MAX_ATTEMPTS = N * caps.length * 50;
  let attempts = 0;

  for (const cap of caps){
    while (out.length < N && attempts < MAX_ATTEMPTS){
      const before = out.length;
      tryBuild(cap);
      attempts++;
      if (out.length > before && out.length < N){
        shuffle(pool);
      }
    }
    if (out.length >= N || attempts >= MAX_ATTEMPTS) break;
  }

  if (!out.length) throw new Error('No valid lineups; lower Min or raise Max salary.');
  if (out.length < N){
    showToast(`Generated ${out.length}/${N} lineups after ${attempts} attempts. Consider adjusting salary limits or captain pool.`, 'warn');
  }
  return { lineups: out, attempts };
}
