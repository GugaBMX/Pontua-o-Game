/* main.js
 * Scoreboard frontend logic.
 * - Tries to fetch/save to server endpoints (/api/:game)
 * - Falls back to localStorage when server is unavailable.
 * - Keeps UI and table in sync.
 *
 * PAGE_GAME global is set in each page (<script>window.PAGE_GAME='uno'</script>)
 */

(function(){
  const STORAGE_PREFIX = 'scoreboard_v1_';

  // Simple helper to select elements
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  // Determine current game from global variable or URL
  const game = window.PAGE_GAME || (location.pathname.split('/').pop().replace('.html','') || 'uno');

  // API endpoints
  const API_BASE = '/api/';

  // --- Server communication helpers ---
  async function fetchServer(gameKey){
    try{
      const res = await fetch(API_BASE + gameKey);
      if(!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    }catch(e){
      console.warn('Server fetch failed, using localStorage. Error:', e);
      return null;
    }
  }
  async function saveServer(gameKey, arr){
    try{
      const res = await fetch(API_BASE + gameKey, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(arr)
      });
      if(!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    }catch(e){
      console.warn('Server save failed, falling back to localStorage.', e);
      return null;
    }
  }

  // --- localStorage helpers (fallback) ---
  function lsGet(gameKey){
    const raw = localStorage.getItem(STORAGE_PREFIX + gameKey);
    if(!raw) return null;
    try{return JSON.parse(raw);}catch(e){return null;}
  }
  function lsSet(gameKey, arr){
    localStorage.setItem(STORAGE_PREFIX + gameKey, JSON.stringify(arr));
  }

  // --- Data access: tries server first, otherwise local ---
  async function loadState(gameKey){
    const server = await fetchServer(gameKey);
    if(Array.isArray(server)) return server;
    const ls = lsGet(gameKey);
    if(Array.isArray(ls)) return ls;
    return []; // empty
  }
  async function saveState(gameKey, arr){
    const serverRes = await saveServer(gameKey, arr);
    if(serverRes && serverRes.ok) return true;
    // fallback: save locally
    lsSet(gameKey, arr);
    return false;
  }

  // --- UI creation helpers ---
  function createPlayerElement(player, idx){
    const div = document.createElement('div');
    div.className = 'player';
    if(idx === 0) div.classList.add('first');
    div.dataset.id = player.id;

    const info = document.createElement('div'); info.className='info';

    // Rank wrap: crown + avatar + text
    const rankWrap = document.createElement('div'); rankWrap.className='rank-wrap';
    const crown = document.createElement('div'); crown.className='crown'; crown.textContent = '👑';
    if(idx !== 0) crown.style.visibility = 'hidden';
    const avatar = document.createElement('div'); avatar.className='avatar'; avatar.textContent = (player.name || '').slice(0,2).toUpperCase();

    const text = document.createElement('div');
    const name = document.createElement('div'); name.className='name'; name.textContent = player.name;
    const pts = document.createElement('div'); pts.className='points'; pts.textContent = player.points + ' pts — ' + player.wins + ' vitórias';
    text.appendChild(name); text.appendChild(pts);

    rankWrap.appendChild(crown);
    rankWrap.appendChild(avatar);
    rankWrap.appendChild(text);

    info.appendChild(rankWrap);

    const actions = document.createElement('div'); actions.className='actions';
    const inc = document.createElement('button'); inc.className='small-btn inc'; inc.textContent = '+';
    const dec = document.createElement('button'); dec.className='small-btn dec'; dec.textContent = '−';
    const rem = document.createElement('button'); rem.className='small-btn remove'; rem.textContent = '✕';

    inc.addEventListener('click', async () => {
      const arr = await loadState(game);
      const p = arr.find(x => x.id === player.id);
      if(!p) return;
      p.wins += 1;
      const per = parseInt($('#pointsPerWin').value) || 1;
      p.points += per;
      await saveState(game, arr);
      renderList(arr);
    });
    dec.addEventListener('click', async () => {
      const arr = await loadState(game);
      const p = arr.find(x => x.id === player.id);
      if(!p) return;
      if(p.wins > 0){ p.wins -= 1; const per = parseInt($('#pointsPerWin').value) || 1; p.points = Math.max(0, p.points - per); await saveState(game, arr); renderList(arr); }
    });
    rem.addEventListener('click', async () => {
      if(!confirm('Remover jogador?')) return;
      let arr = await loadState(game);
      arr = arr.filter(x => x.id !== player.id);
      await saveState(game, arr);
      renderList(arr);
    });

    actions.appendChild(inc); actions.appendChild(dec); actions.appendChild(rem);
    div.appendChild(info); div.appendChild(actions);
    return div;
  }

  // Render list and table
  async function renderList(arr){
    const list = $('#list');
    if(!list) return;
    list.innerHTML = '';
    // sort desc by points
    arr.sort((a,b)=> b.points - a.points);
    arr.forEach((p, idx) => {
      list.appendChild(createPlayerElement(p, idx));
    });
    renderTable(arr);
  }

  function renderTable(arr){
    const table = $('#rankingTable');
    if(!table) return;
    table.innerHTML = '';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>#</th><th>Nome</th><th>Vitórias</th><th>Pontos</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    arr.forEach((p, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i+1}</td><td>${p.name}</td><td>${p.wins}</td><td>${p.points}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }

  // --- Controls initialization and events ---
  function bindControls(){
    const addBtn = $('#addPlayer');
    const nameInput = $('#playerName');
    const resetBtn = $('#resetAll');

    if(addBtn && nameInput){
      addBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if(!name){ alert('Digite um nome.'); return; }
        const arr = await loadState(game);
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2,6);
        arr.push({ id, name, wins: 0, points: 0 });
        await saveState(game, arr);
        nameInput.value = '';
        renderList(arr);
      });
      nameInput.addEventListener('keyup', (e) => { if(e.key === 'Enter') addBtn.click(); });
    }

    if(resetBtn){
      resetBtn.addEventListener('click', async () => {
        if(!confirm('Resetar todos os dados deste jogo?')) return;
        // Save empty array to server (or local)
        await saveState(game, []);
        renderList([]);
      });
    }
  }

  // --- Initialization ---
  async function init(){
    bindControls();
    const arr = await loadState(game);
    renderList(arr);
  }

  // Expose for debugging
  window.ScoreboardApp = { loadState, saveState, renderList };

  // Run
  document.addEventListener('DOMContentLoaded', init);
})();
