import { esc, toNumber, norm, shuffle, pickColumns, looksNumericish, buildDisplayName, parseCSV, usesCaptains, rowsToPlayers } from './api.js';

// -------------------- CONFIG --------------------

// Real demo CSV datasets served from demo/ via relative paths
const DEMO_CSVS = {
  nfl_full: { label:'NFL — Full slate', sport:'nfl', contest:'full-slate', tournament:'Tournament 1008839 (413 players)', eventName:'NFL Example Slate', url:'demo/1008839_players_20250906222543.csv' },
  nfl_show: { label:'NFL — Showdown', sport:'nfl', contest:'showdown', tournament:'Tournament 1009037 (33 players)', eventName:'NFL Showdown (Single Game)', url:'demo/1009037_players_20250908102649.csv' },
  fb_full:  { label:'Football — Full slate', sport:'football', contest:'full-slate', tournament:'Tournament 1009899 (845 players)', eventName:'Champions League Night', url:'demo/1009899_players_20250908161603.csv' },
  fb_show:  { label:'Football — Showdown', sport:'football', contest:'showdown', tournament:'Tournament 1010808 (51 players)', eventName:'Football Showdown', url:'demo/1010808_players_20250908161619.csv' },
  f1_full:  { label:'F1 — Race weekend', sport:'f1', contest:'full-slate', tournament:'Tournament 1008665 (29 players)', eventName:'F1 Race Weekend', url:'demo/1008665_players_20250906172857.csv' },
  golf_full:{ label:'Golf — PGA tournament', sport:'golf', contest:'full-slate', tournament:'Tournament 1000000 (585 players)', eventName:'PGA Tournament', url:'demo/1000000_players_20250815093906.csv' }
};

// Rotation order for the demo button (array of KEYS)
const DEMO_ROTATION = ['nfl_full','nfl_show','fb_full','fb_show','f1_full','golf_full'];
let demoIndex = -1;

// Sport config (FanTeam-aligned)
const SPORT_CONFIGS = {
  nfl:{ name:'NFL', icon:'🏈', lineupSize:9, positions:['QUARTERBACK','RUNNING_BACK','WIDE_RECEIVER','TIGHT_END','DST'], salaryRange:[118,120], currency:'£', fullSlateSize:846, showdownSize:52 },
  football:{ name:'Football/Soccer', icon:'⚽', lineupSize:6, positions:['GOALKEEPER','DEFENDER','MIDFIELDER','FORWARD'], salaryRange:[98,100], currency:'£', fullSlateSize:414, showdownSize:30 },
  golf:{ name:'Golf', icon:'🏌️', lineupSize:6, positions:['PLAYER'], salaryRange:[98,100], currency:'£', fullSlateSize:69, showdownSize:69 },
  f1:{ name:'Formula 1', icon:'🏎️', lineupSize:6, positions:['DRIVER','CONSTRUCTOR'], salaryRange:[100,102], currency:'£', fullSlateSize:34, showdownSize:34 }
};

const state = { currentStep:1, players:[], lineups:[], detectedSport:'nfl', contestType:'full-slate', currentDemoSport:'nfl', datasetMeta:{ tournament:'', eventName:'' }, isDemo:false, statusFilter:'', sort:{ field:'', dir:'asc' } };

// -------------------- (Optional legacy synthetic demo, unused) --------------------
// retained for future offline fallback
const DEMO = { /* ...same as before; not used when real CSVs exist... */ };
function generateDemoData(){ return { players:[], tournament:'', eventName:'', contest:'full-slate' }; }

// -------------------- UTILS --------------------

export function showToast(msg,type='success'){ const t=document.createElement('div'); t.className=`toast ${type}`; t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),3000); }

function detectSportFromCSV(players){ if(!players||!players.length) return 'nfl';
  const positions = [...new Set(players.map(p=>norm(p.position)))];
  const avgSalary = players.reduce((s,p)=>s+(p.salary||0),0)/players.length;
  const n = players.length;
  const nfl = ['quarterback','runningback','widereceiver','tightend','dst','defense','qb','rb','wr','te'];
  if(positions.some(p=>nfl.includes(p))){ state.contestType = n>100? 'full-slate':'showdown'; return 'nfl'; }
  const foot = ['defender','midfielder','forward','goalkeeper','gk','def','mid','fwd'];
  if(positions.some(p=>foot.includes(p))){ state.contestType = n>100? 'full-slate':'showdown'; return 'football'; }
  const f1 = ['driver','constructor']; if(positions.some(p=>f1.includes(p)) || (n>=30 && n<=40)){ state.contestType='full-slate'; return 'f1'; }
  if(n>=60 && n<=80){ state.contestType='full-slate'; return 'golf'; }
  if(avgSalary>1000){ state.contestType = n>100? 'full-slate':'showdown'; return 'nfl'; }
  return 'football';
}

async function importCSV(file){
  const text = await file.text();
  const rows = parseCSV(text);
  if(rows.length < 2) throw new Error('CSV needs header + at least 1 data row');

  const headers = rows[0].map(h=>norm(h));
  const cols = pickColumns(headers);

  if(cols.salaryCol===-1) throw new Error('Required "Price/Salary" column not found');
  if(cols.displayCol===-1 && cols.firstCol===-1 && cols.lastCol===-1)
    throw new Error('Name columns not found (need Name/Player or First/Last)');

  const players = rowsToPlayers(rows, cols);
  if(!players.length) throw new Error('No valid players found');
  return players;
}

async function importProjections(file){
  try {
    const text = await file.text();
    const rows = parseCSV(text);
    if(rows.length<2) throw new Error('Projection CSV needs header and data');
    const headers = rows[0].map(h=>norm(h));
    const nameIdx = headers.findIndex(h=>['playername','fullname','full_name','player','name'].some(k=>h.includes(k)));
    const projIdx = headers.findIndex(h=>['projection','proj','points','fpts','score'].some(k=>h.includes(k)));
    if(nameIdx===-1 || projIdx===-1) throw new Error('Projection CSV missing name or projection column');
    let matched=0;
    for(let i=1;i<rows.length;i++){
      const name=(rows[i][nameIdx]||'').trim();
      const proj=toNumber(rows[i][projIdx]);
      const p=state.players.find(pl=>pl.name.toLowerCase()===name.toLowerCase());
      if(p){ p.projection=proj; matched++; }
    }
    showToast(`Loaded projections for ${matched} players`,'success');
    renderPlayers();
  } catch(err){
    showToast(err.message,'error');
  }
}
// Load a demo CSV by KEY (uses same pipeline as uploads)
async function loadDemoCsv(key){
  state.isDemo = true;
  const preset = DEMO_CSVS[key];
  if(!preset) throw new Error(`Unknown demo key: ${key}`);
  const res = await fetch(preset.url);
  if(!res.ok) throw new Error(`Failed to fetch ${preset.url}`);
  const text = await res.text();

  const rows = parseCSV(text);
  if(rows.length<2) throw new Error(`Demo "${key}" CSV appears empty.`);

  const headers = rows[0].map(h=>norm(h));
  const cols = pickColumns(headers);
  if(cols.salaryCol===-1) throw new Error('Demo missing required columns (Price/Salary).');

  const players = rowsToPlayers(rows, cols);

  return { players, sport:preset.sport, contest:preset.contest, tournament:preset.tournament, eventName:preset.eventName };
}

function demoKeyFor(sport, contest) {
  const entry = Object.entries(DEMO_CSVS).find(([,p]) => p.sport===sport && p.contest===contest)
              || Object.entries(DEMO_CSVS).find(([,p]) => p.sport===sport);
  return entry ? entry[0] : null;
}

// -------------------- UI STATE --------------------
function setStep(k){ [1,2,3,4].forEach(i=>{ const s=document.getElementById(`step${i}`); const ps=document.getElementById(`ps${i}`); const sn=document.getElementById(`sn${i}`); if(s) s.classList.toggle('active', i===k && i<=3); if(ps&&sn){ ps.classList.remove('active','completed'); sn.classList.remove('active','completed'); if(i<k){ ps.classList.add('completed'); sn.classList.add('completed'); } else if(i===k){ ps.classList.add('active'); sn.classList.add('active'); } } });
  document.getElementById('main').classList.toggle('active', k===4); state.currentStep=k; refreshCaptainButtons(); }

function updateDetection(){ const cfg = SPORT_CONFIGS[state.detectedSport]; const n = state.players.length; document.getElementById('playerCount').textContent=n; document.getElementById('detectedSport').textContent=cfg.name; document.getElementById('detectedContest').textContent= state.contestType==='showdown'? 'Showdown':'Full slate'; document.getElementById('sportSelector').value = state.detectedSport; document.getElementById('metaTournament').textContent = state.datasetMeta.tournament||'—'; document.getElementById('metaEvent').textContent = state.datasetMeta.eventName||'—';
  if(n){ const salaries = state.players.map(p=>p.salary).filter(s=>s>0); const min=Math.min(...salaries), max=Math.max(...salaries); document.getElementById('salaryRange').textContent = `${cfg.currency}${Math.round(min)} - ${cfg.currency}${Math.round(max)}`; const positions=[...new Set(state.players.map(p=>p.position).filter(Boolean))]; document.getElementById('commonPositions').textContent = positions.slice(0,6).join(', ');} else { document.getElementById('salaryRange').textContent= `${cfg.currency}0 - ${cfg.currency}0`; document.getElementById('commonPositions').textContent='—'; }
}

function updateStats(){ const sel=state.players.filter(p=>p.selected).length; const caps=state.players.filter(p=>p.captain).length; document.getElementById('selectedCount').textContent=sel; document.getElementById('captainCount').textContent=caps; document.getElementById('statPlayers').textContent=state.players.length; }

function refreshCaptainButtons(){ const btn=document.getElementById('captainAll'); const use=usesCaptains(state.detectedSport, state.contestType); if(btn){ btn.disabled = !use; }
  // Constraints text
  const cfg = SPORT_CONFIGS[state.detectedSport]; const min=+document.getElementById('minSalary').value||cfg.salaryRange[0]; const max=+document.getElementById('maxSalary').value||cfg.salaryRange[1]; const ct = use? 'Captain required' : 'No captain'; document.getElementById('constraintsText').textContent = `${cfg.name} • ${state.contestType} • Lineup size ${cfg.lineupSize} • ${ct} • Salary ${cfg.currency}${min}–${cfg.currency}${max}`;
}

function deriveFilters(){
  const posSel=document.getElementById('positionFilter');
  posSel.innerHTML = '<option value="">All positions</option>';
  const positions=[...new Set(state.players.map(p=>p.position).filter(Boolean))].sort();
  positions.forEach(pos=>{ const o=document.createElement('option'); o.value=pos; o.textContent=pos; posSel.appendChild(o); });

  const teamSel=document.getElementById('teamFilter');
  teamSel.innerHTML = '<option value="">All teams</option>';
  const teams=[...new Set(state.players.map(p=>p.team).filter(Boolean))].sort();
  teams.forEach(team=>{ const o=document.createElement('option'); o.value=team; o.textContent=team; teamSel.appendChild(o); });
  state.sort={ field:'', dir:'asc' };
  state.statusFilter='';
}

function filteredPlayers(){
  const q=document.getElementById('searchPlayers').value.toLowerCase();
  const pf=document.getElementById('positionFilter').value;
  const tf=document.getElementById('teamFilter').value;
  const status=state.statusFilter;
  let arr = state.players.filter(p=>{
    const s=!q || p.name.toLowerCase().includes(q);
    const m=!pf || p.position===pf;
    const t=!tf || p.team===tf;
    const st=!status || p.status===status;
    return s && m && t && st;
  });
  if(state.sort.field){
    const dir = state.sort.dir==='asc'?1:-1;
    if(state.sort.field==='salary') arr.sort((a,b)=>(a.salary-b.salary)*dir);
    else if(state.sort.field==='proj') arr.sort((a,b)=>((a.projection??-Infinity)-(b.projection??-Infinity))*dir);
  }
  return arr;
}

function updateSortIndicators(){
  const map={ proj:'thProj', salary:'thSalary' };
  Object.entries(map).forEach(([field,id])=>{
    const th=document.getElementById(id);
    if(!th) return;
    const label=field==='proj'?'Proj':'Salary';
    if(state.sort.field===field){ th.innerHTML=label+(state.sort.dir==='asc'?' ▲':' ▼'); th.classList.add('active'); }
    else { th.innerHTML=label; th.classList.remove('active'); }
  });
}

function sortBy(field){
  if(state.sort.field===field){ state.sort.dir = state.sort.dir==='asc'?'desc':'asc'; }
  else { state.sort.field=field; state.sort.dir='desc'; }
  renderPlayers();
}

function renderPlayers(){ updateSortIndicators(); const cfg = SPORT_CONFIGS[state.detectedSport]; const body=document.getElementById('playerTableBody'); body.innerHTML = filteredPlayers().map(p=>{ const rowClass = p.status==='expected'? 'row-expected' : (p.status==='possible'? 'row-possible' : 'row-unexpected'); return `<tr class="${rowClass}">
  <td><input type="checkbox" ${p.selected?'checked':''} onchange="toggleSelected('${p.id}')" /></td>
  <td><input type="checkbox" ${p.captain?'checked':''} ${!usesCaptains(state.detectedSport, state.contestType)?'disabled':''} onchange="toggleCaptain('${p.id}')" /></td>
  <td>${esc(p.name)}</td>
  <td>${esc(p.position)}</td>
  <td>${esc(p.team||'')}</td>
  <td>${p.projection!=null ? p.projection.toFixed(2) : ''}</td>
  <td>${cfg.currency}${p.salary}</td>
  <td><span class="helper" style="color:${p.status==='expected'?'#2fe089':p.status==='possible'?'#ffb86c':'#ff6b6b'}">${p.status}</span></td>
</tr>`; }).join(''); }

function renderLineups(){ const cfg=SPORT_CONFIGS[state.detectedSport]; const body=document.getElementById('lineupTableBody'); const use=usesCaptains(state.detectedSport, state.contestType); body.innerHTML = state.lineups.map(l=>`<tr>
  <td>${l.id}</td>
  <td>${esc(use? (l.captain?.name||'') : '—')}</td>
  <td>${l.players.map(p=>esc(p.name)).join(', ')}</td>
  <td>${cfg.currency}${l.totalSalary}</td>
</tr>`).join(''); document.getElementById('lineupResults').textContent = state.lineups.length; updateDownloadLink(); document.getElementById('downloadBtn').toggleAttribute('disabled', state.lineups.length===0); }

const csvRow = row => row.map(f => `"${String(f).replace(/"/g,'""')}"`).join(',');

function updateDownloadLink(){
  const cfg=SPORT_CONFIGS[state.detectedSport];
  const use=usesCaptains(state.detectedSport, state.contestType);
  const headers = Array.from({length: cfg.lineupSize}, (_,i)=>`Player${i+1}`);
  if(use) headers.push('Captain');
  const rows=[headers];

  state.lineups.forEach(l=>{
    const names = l.players.map(p=>p.name);
    while(names.length<cfg.lineupSize) names.push('');
    if(use) names.push(l.captain?.name||'');
    rows.push(names);
  });

  const csv = rows.map(csvRow).join('\n');
  const blob=new Blob([csv],{type:'text/csv'});
  const dl=document.getElementById('downloadBtn');
  dl.href = URL.createObjectURL(blob);
  if(state.lineups.length>0) dl.removeAttribute('disabled'); else dl.setAttribute('disabled','');
}

// -------------------- GENERATOR --------------------
function generateLineupsMaxSpend(){
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

function setDynamicCapDefaults(){
  const cfg = SPORT_CONFIGS[state.detectedSport];
  const selected = state.players.filter(p=>p.selected);
  const pool = selected.length >= cfg.lineupSize ? selected : state.players;

  const top = [...pool].sort((a,b)=>b.salary-a.salary).slice(0, cfg.lineupSize);
  const target = top.reduce((s,p)=>s+p.salary, 0);

  const min = Math.max(0, Math.floor(target * 0.9)); // 90% of “best possible”
  const max = Math.ceil(target);                      // exact top sum (rounded up)

  document.getElementById('minSalary').value = min;
  document.getElementById('maxSalary').value = max;
}

// -------------------- EVENTS --------------------
const uploadZone = document.getElementById('uploadZone'); const fileInput = document.getElementById('fileInput');
uploadZone.addEventListener('click',()=>fileInput.click());
uploadZone.addEventListener('dragover',e=>{e.preventDefault(); uploadZone.classList.add('dragover');});
uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop',e=>{ e.preventDefault(); uploadZone.classList.remove('dragover'); const f=e.dataTransfer.files; if(f.length) processFile(f[0]); });
fileInput.addEventListener('change',e=>{ if(e.target.files.length) processFile(e.target.files[0]); });

async function processFile(file) {
  try {
    const players = await importCSV(file);
    state.players = players;
    state.detectedSport = detectSportFromCSV(players);
    state.datasetMeta = {
      tournament: file.name.replace(/\.csv$/i, ''),
      eventName: 'Imported CSV'
    };
    state.isDemo = false;

    uploadZone.classList.add('has-file');
    showToast(`Loaded ${players.length} players`, `success`);
    updateDetection();
    setStep(2);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Demo cycle (uses KEY rotation) — FIXED: single declaration of DEMO_ROTATION & demoIndex

document.getElementById('demoBtn').addEventListener('click', async () => {
  try {
    demoIndex = (demoIndex + 1) % DEMO_ROTATION.length;
    const key = DEMO_ROTATION[demoIndex];
    const demo = await loadDemoCsv(key);
    state.players = demo.players;
    state.detectedSport = demo.sport;
    state.currentDemoSport = demo.sport;
    state.contestType = demo.contest;
    state.datasetMeta = { tournament: demo.tournament, eventName: demo.eventName };
    state.isDemo = true;
    updateDetection();
    showToast(`Demo loaded: ${DEMO_CSVS[key].label} (${demo.players.length} players)`);
    setStep(2);
  } catch (err) { showToast(err.message, 'error'); }
});

document.getElementById('backToUpload').addEventListener('click',()=>setStep(1));
const optFull=document.getElementById('optFull');
const optShow=document.getElementById('optShow');
function syncContestSelection(){
  [optFull,optShow].forEach(x=>x.classList.remove('selected'));
  (state.contestType==='showdown'?optShow:optFull).classList.add('selected');
}
document.getElementById('sportSelector').addEventListener('change', async e => {
  state.detectedSport = e.target.value;
  if(!state.isDemo) return;
  try {
    const desired = state.contestType;
    const key = demoKeyFor(state.detectedSport, desired) || demoKeyFor(state.detectedSport, 'full-slate');
    if(key){
      const demo = await loadDemoCsv(key);
      state.players = demo.players;
      state.contestType = demo.contest;
      state.datasetMeta = { tournament: demo.tournament, eventName: demo.eventName };
      state.currentDemoSport = demo.sport;
      updateDetection();
      syncContestSelection();
    }
  } catch(err){ showToast(err.message,'error'); }
});
document.getElementById('confirmSport').addEventListener('click', async () => {
  try {
    state.detectedSport = document.getElementById('sportSelector').value;
    if (state.isDemo) {
      const desired = state.contestType;
      const key = demoKeyFor(state.detectedSport, desired) || demoKeyFor(state.detectedSport, 'full-slate');
      if (key) {
        const demo = await loadDemoCsv(key);
        state.players = demo.players;
        state.contestType = demo.contest;
        state.currentDemoSport = demo.sport;
        state.datasetMeta = { tournament: demo.tournament, eventName: demo.eventName };
        updateDetection();
      }
    }
    syncContestSelection();
    setStep(3);
  } catch (err) { showToast(err.message, 'error'); }
});
document.getElementById('backToSport').addEventListener('click',()=>setStep(2));

// Contest selection
[optFull,optShow].forEach(el=> el.addEventListener('click',()=>{ [optFull,optShow].forEach(x=>x.classList.remove('selected')); el.classList.add('selected'); state.contestType = el.dataset.type; }));
document.getElementById('confirmContest').addEventListener('click',()=>{
  const cfg = SPORT_CONFIGS[state.detectedSport];
  document.getElementById('statSport').textContent = cfg.name;
  document.getElementById('statContest').textContent = state.contestType==='showdown' ? 'Showdown' : 'Full slate';

  setDynamicCapDefaults();   // ← dynamic min/max based on this slate

  deriveFilters();
  updateStats();
  renderPlayers();
  refreshCaptainButtons();
  setStep(4);
});

// Generate
document.getElementById('generateBtn').addEventListener('click', () => {
  try {
    const res = generateLineupsMaxSpend(); // ← use max-spend
    state.lineups = res.lineups;
    renderLineups();
    const N = +document.getElementById('lineupCount').value || 20;
    if (state.lineups.length >= N) {
      showToast(`Generated ${state.lineups.length} lineups!`, 'success');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Player controls
document.getElementById('selectAll').addEventListener('click',()=>{ state.players.forEach(p=>p.selected=true); state.statusFilter=''; updateStats(); renderPlayers(); });
document.getElementById('selectNone').addEventListener('click',()=>{ state.players.forEach(p=>{ p.selected=false; p.captain=false; }); state.statusFilter=''; updateStats(); renderPlayers(); });
document.getElementById('selectExpected').addEventListener('click',()=>{ state.players.forEach(p=>{ p.selected = (p.status==='expected'); if(!p.selected) p.captain=false; }); state.statusFilter='expected'; updateStats(); renderPlayers(); });
document.getElementById('captainAll').addEventListener('click',()=>{ if(!usesCaptains(state.detectedSport, state.contestType)) return; state.players.filter(p=>p.selected).forEach(p=>p.captain=true); updateStats(); renderPlayers(); });
document.getElementById('clearResults').addEventListener('click',()=>{ state.lineups=[]; renderLineups(); });
document.getElementById('startOver').addEventListener('click',()=>{ state.players=[]; state.lineups=[]; state.currentDemoSport='nfl'; state.datasetMeta={tournament:'',eventName:''}; state.isDemo=false; document.getElementById('downloadBtn').setAttribute('disabled',''); uploadZone.classList.remove('has-file'); setStep(1); });
document.getElementById('searchPlayers').addEventListener('input',renderPlayers);
document.getElementById('positionFilter').addEventListener('change',renderPlayers);
document.getElementById('teamFilter').addEventListener('change',renderPlayers);
document.getElementById('thProj').addEventListener('click',()=>sortBy('proj'));
document.getElementById('thSalary').addEventListener('click',()=>sortBy('salary'));

document.getElementById('importProj').addEventListener('click',()=> document.getElementById('projInput').click());
document.getElementById('projInput').addEventListener('change',e=>{ if(e.target.files.length) importProjections(e.target.files[0]); });

// Expose for checkboxes
window.toggleSelected = id => { const p=state.players.find(x=>x.id===id); if(!p) return; p.selected=!p.selected; if(!p.selected) p.captain=false; updateStats(); renderPlayers(); };
window.toggleCaptain = id => { const p=state.players.find(x=>x.id===id); if(!p) return; if(!usesCaptains(state.detectedSport, state.contestType)) return; p.captain=!p.captain; if(p.captain) p.selected=true; updateStats(); renderPlayers(); };

// -------------------- SELF-TESTS (light sanity checks) --------------------
(function selfTest(){
  try {
    console.assert(Array.isArray(DEMO_ROTATION) && DEMO_ROTATION.every(k=>typeof k==='string'), 'DEMO_ROTATION must be array of keys');
    console.assert(DEMO_ROTATION.every(k=>DEMO_CSVS[k]), 'All DEMO_ROTATION keys must exist in DEMO_CSVS');
    console.assert(typeof parseCSV==='function' && typeof norm==='function', 'Parsers present');
  } catch(e){ console.warn('Self-test failed:', e); }
})();

// init
(function init(){ setStep(1); console.log('FanTeam DFS Optimizer — MVP v2 ready'); })();
