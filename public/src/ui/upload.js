import { showToast } from './toast.js';

export function initUpload({ state, importCSV, detectSportFromCSV, updateDetection, setStep, loadDemoCsv, demoKeyFor, DEMO_CSVS, DEMO_ROTATION, applyDemoToState }) {
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const demoBtn = document.getElementById('demoBtn');
  let demoIndex = -1;

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

  if (demoBtn) {
    demoBtn.addEventListener('click', async () => {
      try {
        demoIndex = (demoIndex + 1) % DEMO_ROTATION.length;
        const key = DEMO_ROTATION[demoIndex];
        const demo = await loadDemoCsv(key);
        applyDemoToState(demo);
        showToast(`Demo loaded: ${DEMO_CSVS[key].label} (${demo.players.length} players)`);
        setStep(2);
      } catch (err) { showToast(err.message, 'error'); }
    });
  }
}
