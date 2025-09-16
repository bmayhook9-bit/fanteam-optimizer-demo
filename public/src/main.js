import { showToast, generateLineupsMaxSpend, initUpload } from './ui/index.js';
import { buildDisplayName, looksNumericish } from '../../src/utils/displayName.js';

// -------------------- CONFIG --------------------

// Real demo CSV datasets moved to tests/fixtures and referenced via relative paths
const DEMO_CSVS = {
  nfl_full: { label:'NFL — Full slate', sport:'nfl', contest:'full-slate', tournament:'Tournament 1008839 (413 players)', eventName:'NFL Example Slate', url:'/demo/nfl/players.csv' },
  nfl_show: { label:'NFL — Showdown', sport:'nfl', contest:'showdown', tournament:'Tournament 1009037 (33 players)', eventName:'NFL Showdown (Single Game)', url:'/demo/nfl/showdown.csv' },
  fb_full:  { label:'Football — Full slate', sport:'football', contest:'full-slate', tournament:'Tournament 1009899 (845 players)', eventName:'Champions League Night', url:'/demo/football/players.csv' },
  fb_show:  { label:'Football — Showdown', sport:'football', contest:'showdown', tournament:'Tournament 1010808 (51 players)', eventName:'Football Showdown', url:'/demo/football/showdown.csv' },
  f1_full:  { label:'F1 — Race weekend', sport:'f1', contest:'full-slate', tournament:'Tournament 1008665 (29 players)', eventName:'F1 Race Weekend', url:'/demo/f1/players.csv' },
  golf_full:{ label:'Golf — PGA tournament', sport:'golf', contest:'full-slate', tournament:'Tournament 1000000 (585 players)', eventName:'PGA Tournament', url:'/demo/golf/players.csv' }
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
const esc = (s='') => s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' }[c]));
const toNumber = v => { if(typeof v!== 'string') return +v||0; const cleaned = v.replace(/[^0-9.\-]/g,''); return parseFloat(cleaned)||0; };
const norm = s => (s||'').toLowerCase().replace(/[_\s]/g,'');
const shuffle = a => { for(let i=a.length-1;i>0;i--){ const j=Math.random()*(i+1)|0; [a[i],a[j]]=[a[j],a[i]]; } return a; };

// ---- Robust column + name helpers ----
function pickColumns(headers){
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
  
function parseCSV(text){
  // Detect delimiter: default comma, fall back to semicolon if it dominates
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

function usesCaptains(sport, contest){ if(sport==='nfl') return contest==='showdown'; if(sport==='football') return true; if(sport==='golf') return true; if(sport==='f1') return true; return false; }

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

function rowsToPlayers(rows, cols){
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
  const res = await fetch(preset.url, { cache:'no-store' });
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

function applyDemoToState(demo){
  state.players = demo.players;
  state.detectedSport = demo.sport;
  state.currentDemoSport = demo.sport;
  state.contestType = demo.contest;
  state.datasetMeta = { tournament: demo.tournament, eventName: demo.eventName };
  state.isDemo = true;
  state.lineups = [];
  state.statusFilter = '';
  state.sort = { field:'', dir:'asc' };
  const uploadZone = document.getElementById('uploadZone');
  if(uploadZone) uploadZone.classList.add('has-file');
  updateDetection();
  deriveFilters();
  updateStats();
  refreshCaptainButtons();
  renderPlayers();
  renderLineups();
  if(state.currentStep>=4) setDynamicCapDefaults();
}

function resetToStart(){
  state.players = [];
  state.lineups = [];
  state.detectedSport = 'nfl';
  state.contestType = 'full-slate';
  state.currentDemoSport = 'nfl';
  state.datasetMeta = { tournament:'', eventName:'' };
  state.isDemo = false;
  state.statusFilter = '';
  state.sort = { field:'', dir:'asc' };
  const uploadZone = document.getElementById('uploadZone');
  if(uploadZone) uploadZone.classList.remove('has-file');
  const sportSelector = document.getElementById('sportSelector');
  if(sportSelector) sportSelector.value = 'nfl';
  const search = document.getElementById('searchPlayers');
  if(search) search.value = '';
  const minSalary = document.getElementById('minSalary');
  const maxSalary = document.getElementById('maxSalary');
  if(minSalary) minSalary.value = '';
  if(maxSalary) maxSalary.value = '';
  const positionFilter = document.getElementById('positionFilter');
  const teamFilter = document.getElementById('teamFilter');
  if(positionFilter) positionFilter.value = '';
  if(teamFilter) teamFilter.value = '';
  const projInput = document.getElementById('projInput');
  if(projInput) projInput.value = '';
  const downloadBtn = document.getElementById('downloadBtn');
  if(downloadBtn) downloadBtn.setAttribute('disabled','');
  const statSport = document.getElementById('statSport');
  const statContest = document.getElementById('statContest');
  if(statSport) statSport.textContent = '—';
  if(statContest) statContest.textContent = '—';
  updateDetection();
  deriveFilters();
  updateStats();
  refreshCaptainButtons();
  renderPlayers();
  renderLineups();
  if(typeof syncContestSelection==='function') syncContestSelection();
  setStep(1);
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
initUpload({
  state,
  importCSV,
  detectSportFromCSV,
  updateDetection,
  setStep,
  loadDemoCsv,
  demoKeyFor,
  DEMO_CSVS,
  DEMO_ROTATION,
  applyDemoToState
});

document.getElementById('resetFlow').addEventListener('click', resetToStart);
document.getElementById('backToUpload').addEventListener('click',()=>setStep(1));
const optFull=document.getElementById('optFull');
const optShow=document.getElementById('optShow');
function syncContestSelection(){
  [optFull,optShow].forEach(x=>x.classList.remove('selected'));
  (state.contestType==='showdown'?optShow:optFull).classList.add('selected');
}
document.getElementById('sportSelector').addEventListener('change', async e => {
  const nextSport = e.target.value;
  const wasEmpty = state.players.length===0;
  state.detectedSport = nextSport;
  if(!wasEmpty && !state.isDemo) return;
  try {
    const desired = state.contestType;
    const key = demoKeyFor(nextSport, desired) || demoKeyFor(nextSport, 'full-slate');
    if(!key){
      if(wasEmpty) showToast('No demo data available for this sport yet', 'error');
      return;
    }
    const demo = await loadDemoCsv(key);
    applyDemoToState(demo);
    syncContestSelection();
    if(wasEmpty){
      const cfg = SPORT_CONFIGS[nextSport];
      if(state.currentStep<2) setStep(2);
      showToast(`Demo data loaded for ${cfg?.name||nextSport}`, 'success');
    }
  } catch(err){ showToast(err.message,'error'); }
});
document.getElementById('confirmSport').addEventListener('click', async () => {
  try {
    const chosenSport = document.getElementById('sportSelector').value;
    const wasEmpty = state.players.length===0;
    state.detectedSport = chosenSport;
    const desired = state.contestType;
    const key = demoKeyFor(chosenSport, desired) || demoKeyFor(chosenSport, 'full-slate');
    if((wasEmpty || state.isDemo) && key){
      const demo = await loadDemoCsv(key);
      applyDemoToState(demo);
      if(wasEmpty){
        const cfg = SPORT_CONFIGS[chosenSport];
        showToast(`Demo data loaded for ${cfg?.name||chosenSport}`, 'success');
      }
    } else if(wasEmpty && !key){
      throw new Error('No demo data available for this sport yet');
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
    const res = generateLineupsMaxSpend(state, SPORT_CONFIGS, usesCaptains, shuffle); // ← use max-spend
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
document.getElementById('startOver').addEventListener('click', resetToStart);
document.getElementById('searchPlayers').addEventListener('input',renderPlayers);
document.getElementById('positionFilter').addEventListener('change',renderPlayers);
document.getElementById('teamFilter').addEventListener('change',renderPlayers);
document.getElementById('thProj').addEventListener('click',()=>sortBy('proj'));
document.getElementById('thSalary').addEventListener('click',()=>sortBy('salary'));

document.getElementById('importProj').addEventListener('click',()=> document.getElementById('projInput').click());
document.getElementById('projInput').addEventListener('change',e=>{ if(e.target.files.length) importProjections(e.target.files[0]); });

document.getElementById('loadDemo').addEventListener('click', async () => {
  try {
    const desired = state.contestType;
    const key = demoKeyFor(state.detectedSport, desired) || demoKeyFor(state.detectedSport, 'full-slate');
    if(!key) throw new Error('No demo data available for this sport yet');
    const demo = await loadDemoCsv(key);
    applyDemoToState(demo);
    syncContestSelection();
    if(state.currentStep>=4) { setStep(4); setDynamicCapDefaults(); }
    else if(state.currentStep<2) setStep(2);
    const cfg = SPORT_CONFIGS[state.detectedSport];
    showToast(`Demo data loaded for ${cfg?.name||state.detectedSport}`, 'success');
  } catch(err){ showToast(err.message,'error'); }
});

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
