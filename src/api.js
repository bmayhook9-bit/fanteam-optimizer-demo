// Data and utility functions extracted from inline script

export const esc = (s='') => s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c]));
export const toNumber = v => { if(typeof v!== 'string') return +v||0; const cleaned = v.replace(/[^0-9.\-]/g,''); return parseFloat(cleaned)||0; };
export const norm = s => (s||'').toLowerCase().replace(/[_\s]/g,'');
export const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };

export function pickColumns(headers){
  const findIdx = keys => keys.map(k=> headers.findIndex(h=>h.includes(k))).find(i=> i!==-1);
  return {
    displayCol: findIdx(['playername','fullname','full_name','player','name_display','name']),
    lastCol:    findIdx(['surname','lname','last']),
    firstCol:   findIdx(['fname','first','forename','given']),
    salaryCol:  findIdx(['price','salary','cost','value']),
    posCol:     findIdx(['position','pos']),
    teamCol:    findIdx(['club','team']),
    statusCol:  findIdx(['lineup','status']),
    idCol:      findIdx(['playerid','pid','id']),
  };
}

export function looksNumericish(s){ return /\d{3,}/.test((s||'').replace(/[.,\s]/g,'')); }

export function buildDisplayName(row, cols){
  const d = cols.displayCol!==-1? (row[cols.displayCol]||'').trim() : '';
  const f = cols.firstCol!==-1?   (row[cols.firstCol]  ||'').trim() : '';
  const l = cols.lastCol!==-1?    (row[cols.lastCol]   ||'').trim() : '';

  let name = '';
  if(d){
    if(!d.includes(' ') && l && !looksNumericish(l)) name = `${d} ${l}`;
    else name = d;
  } else {
    name = (f && l ? `${f} ${l}` : (l || f));
  }

  if(!name || looksNumericish(name)){
    if(f && !looksNumericish(f)) name = f;
    if(l && !looksNumericish(l)) name = name ? `${name} ${l}` : l;
  }
  return (name||'').trim();
}

export function parseCSV(text){
  const firstLine = (text.split(/\r?\n/)[0] || '');
  const delimiter = (firstLine.split(';').length - 1) > (firstLine.split(',').length - 1) ? ';' : ',';

  const lines = text.split(/\r?\n/).filter(l=>l.trim().length);
  const rows = [];
  for (const line of lines){
    let cur = '';
    let inQ = false;
    const out = [];
    for (let i=0;i<line.length;i++){
      const ch=line[i], nx=line[i+1];
      if (ch === '"'){
        if (inQ && nx === '"'){ cur += '"'; i++; }
        else { inQ = !inQ; }
      } else if (ch === delimiter && !inQ){
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    rows.push(out);
  }
  return rows;
}

export function usesCaptains(sport, contest){
  if(sport==='nfl') return contest==='showdown';
  if(sport==='football') return true;
  if(sport==='golf') return true;
  if(sport==='f1') return true;
  return false;
}

export function detectSportFromCSV(players){
  if(!players||!players.length) return 'nfl';
  const positions = [...new Set(players.map(p=>norm(p.position)))] ;
  const avgSalary = players.reduce((s,p)=>s+(p.salary||0),0)/players.length;
  const n = players.length;
  const nfl = ['quarterback','runningback','widereceiver','tightend','dst','defense','qb','rb','wr','te'];
  if(positions.some(p=>nfl.includes(p))){ return 'nfl'; }
  const foot = ['defender','midfielder','forward','goalkeeper','gk','def','mid','fwd'];
  if(positions.some(p=>foot.includes(p))){ return 'football'; }
  const f1 = ['driver','constructor'];
  if(positions.some(p=>f1.includes(p)) || (n>=30 && n<=40)){ return 'f1'; }
  if(n>=60 && n<=80){ return 'golf'; }
  if(avgSalary>1000){ return 'nfl'; }
  return 'football';
}

export function rowsToPlayers(rows, cols){
  const posMap = { DEF:'DEFENDER', MID:'MIDFIELDER', FWD:'FORWARD', GK:'GOALKEEPER' };
  const players=[];
  for(let i=1;i<rows.length;i++){
    const r = rows[i]; if(!r||!r.length) continue;
    const name = buildDisplayName(r, cols);
    if(!name || looksNumericish(name)) continue;
    const salary = toNumber(r[cols.salaryCol]); if(salary<=0) continue;
    const id   = cols.idCol!==-1?   (r[cols.idCol]  ||'').trim() : `p_${i}`;
    const team = cols.teamCol!==-1? (r[cols.teamCol]||'').trim() : '';
    let position = cols.posCol!==-1? (r[cols.posCol]||'').trim().toUpperCase() : '';
    position = posMap[position] || position;
    let status='expected';
    if(cols.statusCol!==-1){
      const sv=(r[cols.statusCol]||'').toLowerCase();
      if(sv.includes('possible')) status='possible';
      else if(sv.includes('unexpected')||sv.includes('doubt')) status='unexpected';
    }
    players.push({ id, name, first:'', last:'', team, position, salary, status, selected: status==='expected', captain:false });
  }
  return players;
}

