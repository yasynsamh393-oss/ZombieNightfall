(function(){
  'use strict';

  const SAVE_KEY = 'zn_save_v2';
  const WORLD = 2400;

  const THEMES = [
    {id:'night', name:'Nightfall', primary:'#ff4d4d', accent:'#ffc857', panel:'#1b1e2d', line:'#3a3d5a'},
    {id:'blood', name:'Blood Moon', primary:'#ff4b4b', accent:'#ff8d6d', panel:'#1a1015', line:'#5a2d2d'},
    {id:'toxic', name:'Toxic', primary:'#5de27d', accent:'#b7ff63', panel:'#0f1b12', line:'#365a3a'},
    {id:'ice', name:'Frozen', primary:'#4ca1ff', accent:'#b7deff', panel:'#0b1628', line:'#294a6e'},
    {id:'gold', name:'Golden', primary:'#ffbf47', accent:'#ffe28f', panel:'#1a140d', line:'#5a4218'},
    {id:'void', name:'Void', primary:'#b57cff', accent:'#d5b7ff', panel:'#0d0c18', line:'#3a2f5a'}
  ];

  const SKINS = [
    {id:0, name:'Recruit', cat:'Starter', desc:'Basic survivor', price:0, body:'#8aa5ff', dark:'#4e5f91', accent:'#e4d26a', hat:0},
    {id:1, name:'Ranger', cat:'Scout', desc:'Fast and light', price:40, body:'#6fb8ff', dark:'#355d8a', accent:'#76f0a7', hat:1},
    {id:2, name:'Trooper', cat:'Soldier', desc:'Heavy armor', price:90, body:'#7a8b4d', dark:'#4d5c2c', accent:'#d0bc4f', hat:2},
    {id:3, name:'Veteran', cat:'Elite', desc:'Battle-tested', price:140, body:'#c28d52', dark:'#694521', accent:'#f7d86a', hat:2},
    {id:4, name:'Shadow', cat:'Stealth', desc:'Silent and fast', price:180, body:'#575b78', dark:'#2d3044', accent:'#d9a1ff', hat:3},
    {id:5, name:'Phantom', cat:'Legend', desc:'Dark hunter', price:260, body:'#404b69', dark:'#1f2439', accent:'#ff7d7d', hat:4},
    {id:6, name:'Warden', cat:'Guardian', desc:'Frontline protector', price:320, body:'#568d7a', dark:'#234a3d', accent:'#c9e353', hat:1},
    {id:7, name:'Nightfall', cat:'Mythic', desc:'The final survivor', price:420, body:'#8b6ae9', dark:'#3c2d64', accent:'#ffdd75', hat:4}
  ];

  const ZOMBIE_PALETTES = [
    {body:'#4f7f48', accent:'#8cd469', eye:'#ff5a5a'},
    {body:'#697a2f', accent:'#c5d673', eye:'#ff7b7b'},
    {body:'#4d6d60', accent:'#9be3b8', eye:'#ff8d8d'},
    {body:'#6a4c3f', accent:'#d6a07f', eye:'#ff9a9a'},
    {body:'#574a74', accent:'#bba5f2', eye:'#ff7a7a'}
  ];

  const SAVE_DEFAULT = {
    coins:0,
    unlocked:[0],
    selected:0,
    theme:'night',
    lang:'en',
    volMusic:40,
    volSfx:70,
    shake:true
  };

  let save = JSON.parse(JSON.stringify(SAVE_DEFAULT));
  let actx = null;
  let musicTimer = null;
  let state = 'menu';
  let wave = 1;
  let score = 0;
  let kills = 0;
  let gameTime = 0;
  let coinsEarned = 0;
  let lastCoinTime = 0;
  let spawnTimer = 1.5;
  let cam = {x:0,y:0};
  let shake = {x:0,y:0,t:0};

  let players = [];
  let zombies = [];
  let bullets = [];
  let particles = [];
  let obstacles = [];
  let ally = null;
  let allyRescued = false;
  let keys = {};
  let mouse = {x:0, y:0, down:false};
  let joy = {active:false, dx:0, dy:0};
  let platform = 'pc';
  let numPlayers = 1;

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const mmap = document.getElementById('minimap');
  const mctx = mmap.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;

  function loadSave(){
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if(raw){
        const data = JSON.parse(raw);
        save = {...SAVE_DEFAULT, ...data};
        if(!Array.isArray(save.unlocked) || save.unlocked.length === 0){ save.unlocked = [0]; }
      }
    }catch(e){}
  }

  function writeSave(){
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }catch(e){}
  }

  loadSave();

  function $(id){return document.getElementById(id);}

  function t(key){
    const map = {
      en: {
        tagline:'Survive the endless night', btn_games:'Games', btn_skins:'Skins', btn_themes:'Themes', btn_settings:'Settings',
        btn_back:'← Back', games_title:'Select Mode', btn_pc:'PC', btn_mobile:'Mobile', btn_1p:'1 Player', btn_2p:'2 Players', btn_start:'▶ Start',
        skins_title:'Skins', btn_buy:'Buy', btn_equip:'Equip', themes_title:'Themes', settings_title:'Settings', set_music:'Music', set_sfx:'SFX',
        set_shake:'Screen Shake', set_lang:'Language', btn_mute:'Mute All', levelup_title:'LEVEL UP!', levelup_pick:'Choose an ability', pause_title:'PAUSED',
        btn_resume:'Resume', btn_menu:'Main Menu', go_title:'GAME OVER', btn_again:'Play Again', owned:'Owned', locked:'Locked', equip:'Equipped',
        wave:'Wave', score:'Score', time:'Time', kills:'Kills', level:'Level', coins:'Coins', mode_pc1:'PC · 1P · WASD + Mouse',
        mode_pc2:'PC · 2P · P1:WASD  P2:Arrows', mode_mob:'Mobile · Touch Joystick', ally:'Ally Rescued!', hint_esc:'ESC / P = Pause'
      },
      ar: {
        tagline:'عيش أطول في الليل اللانهائي', btn_games:'الألعاب', btn_skins:'السكنات', btn_themes:'الثيمات', btn_settings:'الإعدادات',
        btn_back:'رجوع', games_title:'اختار الوضع', btn_pc:'كمبيوتر', btn_mobile:'موبايل', btn_1p:'لاعب واحد', btn_2p:'لاعبين', btn_start:'▶ ابدأ',
        skins_title:'السكنات', btn_buy:'اشتري', btn_equip:'البس', themes_title:'الثيمات', settings_title:'الإعدادات', set_music:'الموسيقى', set_sfx:'المؤثرات',
        set_shake:'اهتزاز الشاشة', set_lang:'اللغة', btn_mute:'كتم الكل', levelup_title:'تم الترقية!', levelup_pick:'اختار قدرة', pause_title:'متوقف',
        btn_resume:'استمرار', btn_menu:'القائمة', go_title:'انتهت اللعبة', btn_again:'لعب مرة أخرى', owned:'مملوك', locked:'مقفل', equip:'مستخدم',
        wave:'موجة', score:'النقاط', time:'الوقت', kills:'القتل', level:'المستوى', coins:'العملات', mode_pc1:'كمبيوتر · لاعب · WASD + ماوس',
        mode_pc2:'كمبيوتر · 2 لاعب · P1:WASD  P2:أسهم', mode_mob:'موبايل · جوستيك', ally:'تم إنقاذ الحليف!', hint_esc:'ESC / P = إيقاف'
      },
      zh: {
        tagline:'在无尽之夜中生存', btn_games:'游戏', btn_skins:'皮肤', btn_themes:'主题', btn_settings:'设置',
        btn_back:'← 返回', games_title:'选择模式', btn_pc:'电脑', btn_mobile:'手机', btn_1p:'单人', btn_2p:'双人', btn_start:'▶ 开始',
        skins_title:'皮肤', btn_buy:'购买', btn_equip:'装备', themes_title:'主题', settings_title:'设置', set_music:'音乐', set_sfx:'音效',
        set_shake:'屏幕震动', set_lang:'语言', btn_mute:'全部静音', levelup_title:'升级！', levelup_pick:'选择能力', pause_title:'暂停',
        btn_resume:'继续', btn_menu:'主菜单', go_title:'游戏结束', btn_again:'再玩一次', owned:'已拥有', locked:'锁定', equip:'已装备',
        wave:'波次', score:'分数', time:'时间', kills:'击杀', level:'等级', coins:'金币', mode_pc1:'电脑 · 单人 · WASD + 鼠标',
        mode_pc2:'电脑 · 双人 · P1:WASD  P2:方向键', mode_mob:'手机 · 虚拟摇杆', ally:'救援盟友！', hint_esc:'ESC / P = 暂停'
      }
    };
    return (map[save.lang] && map[save.lang][key]) || map.en[key] || key;
  }

  function updateI18n(){
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      if(k) el.textContent = t(k);
    });
    updateModeHint();
  }

  function toast(msg){
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(()=> el.classList.remove('show'), 1700);
  }

  function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = $(id);
    if(el) el.classList.add('active');
  }

  function ensureAudio(){
    if(!actx){ actx = new (window.AudioContext || window.webkitAudioContext)(); }
    if(actx.state === 'suspended'){ actx.resume(); }
  }

  function playTone(freq, duration, type='square', volume=0.12, slide=null){
    if(!actx || save.volSfx <= 0) return;
    ensureAudio();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, actx.currentTime);
    if(slide) osc.frequency.linearRampToValueAtTime(slide, actx.currentTime + duration);
    gain.gain.setValueAtTime((save.volSfx / 100) * volume, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);
    osc.connect(gain); gain.connect(actx.destination);
    osc.start(); osc.stop(actx.currentTime + duration);
  }

  const SFX = {
    shoot:()=>playTone(180,0.07,'square',0.12,90),
    hit:()=>playTone(90,0.08,'sawtooth',0.14,50),
    kill:()=>playTone(140,0.12,'square',0.18,40),
    hurt:()=>playTone(60,0.12,'sawtooth',0.18,25),
    die:()=>playTone(38,0.46,'sawtooth',0.22,10),
    levelup:()=>{ playTone(280,0.08,'square',0.2,420); setTimeout(()=>playTone(480,0.12,'square',0.2,760),90); },
    wave:()=>playTone(210,0.22,'triangle',0.18,120),
    buy:()=>playTone(500,0.08,'square',0.18,760),
    click:()=>playTone(400,0.045,'square',0.1),
    reload:()=>playTone(150,0.14,'triangle',0.12,250)
  };

  function startMusic(){
    stopMusic();
    if(!actx || save.volMusic <= 0) return;
    ensureAudio();
    const notes = [110, 130, 146, 164, 110, 98, 87, 110];
    let idx = 0;
    musicTimer = setInterval(()=>{
      if(!actx || save.volMusic <= 0) return;
      const o = actx.createOscillator();
      const g = actx.createGain();
      o.type = 'triangle';
      o.frequency.value = notes[idx % notes.length];
      g.gain.value = (save.volMusic / 100) * 0.07;
      g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.32);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + 0.35);
      idx++;
    }, 420);
  }

  function stopMusic(){
    if(musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  }

  function applyTheme(){
    const theme = THEMES.find(x => x.id === save.theme) || THEMES[0];
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--accent', theme.accent);
    document.documentElement.style.setProperty('--panel', theme.panel);
    document.documentElement.style.setProperty('--line', theme.line);

    document.querySelectorAll('.panel').forEach(panel => {
      panel.style.background = `linear-gradient(145deg, ${theme.panel}, #101827)`;
      panel.style.borderColor = theme.line;
    });
  }

  function buildThemes(){
    const grid = $('themeGrid');
    grid.innerHTML = '';
    THEMES.forEach(th => {
      const box = document.createElement('div');
      box.className = 'theme-card' + (save.theme === th.id ? ' selected' : '');
      box.innerHTML = `<div class="name" style="color:${th.primary}">${th.name}</div>`;
      box.addEventListener('click', ()=>{
        save.theme = th.id;
        writeSave();
        applyTheme();
        buildThemes();
        SFX.click();
      });
      grid.appendChild(box);
    });
  }

  function drawPixelHero(ctx2, skin, x, y, scale, frame, facing){
    const s = scale;
    const bob = Math.sin(frame * 0.25) * 2.1;
    const sway = Math.sin(frame * 0.28) * 5;

    ctx2.save();
    ctx2.translate(x, y + bob);
    if(facing < 0) ctx2.scale(-1, 1);

    ctx2.fillStyle = 'rgba(0,0,0,0.30)';
    ctx2.fillRect(-12*s, 18*s, 24*s, 4*s);

    ctx2.fillStyle = skin.dark;
    ctx2.fillRect(-4*s, 7*s + sway*0.25, 3*s, 9*s);
    ctx2.fillRect(1*s, 7*s - sway*0.25, 3*s, 9*s);

    ctx2.fillStyle = skin.body;
    ctx2.fillRect(-6*s, -2*s, 12*s, 12*s);

    ctx2.fillStyle = skin.accent;
    ctx2.fillRect(-6*s, 1*s, 12*s, 3*s);

    ctx2.fillStyle = skin.dark;
    ctx2.fillRect(-8*s, -1*s + sway*0.18, 2*s, 9*s);
    ctx2.fillRect(6*s, -1*s - sway*0.18, 2*s, 9*s);

    ctx2.fillStyle = '#e9c7a0';
    ctx2.fillRect(-5*s, -12*s, 10*s, 9*s);

    if(skin.hat === 0){
      ctx2.fillStyle = skin.dark;
      ctx2.fillRect(-5*s, -14*s, 10*s, 3*s);
    }else if(skin.hat === 1){
      ctx2.fillStyle = skin.accent;
      ctx2.fillRect(-6*s, -14*s, 12*s, 4*s);
    }else if(skin.hat === 2){
      ctx2.fillStyle = '#666';
      ctx2.fillRect(-6*s, -14*s, 12*s, 5*s);
      ctx2.fillStyle = skin.accent;
      ctx2.fillRect(-2*s, -13*s, 4*s, 2*s);
    }else{
      ctx2.fillStyle = skin.dark;
      ctx2.fillRect(-6*s, -14*s, 12*s, 5*s);
    }

    ctx2.fillStyle = '#111';
    ctx2.fillRect(-3*s, -10*s, 2*s, 2*s);
    ctx2.fillRect(1*s, -10*s, 2*s, 2*s);

    ctx2.fillStyle = '#2a2a2a';
    ctx2.fillRect(7*s, -1*s, 10*s, 3*s);
    ctx2.fillStyle = '#555';
    ctx2.fillRect(15*s, -2*s, 3*s, 2*s);

    ctx2.restore();
  }

  function drawZombieSprite(z, x, y, t){
    const step = Math.sin(t * 10 + z.variant) * 3;
    const flip = z.angle > Math.PI/2 || z.angle < -Math.PI/2 ? -1 : 1;

    ctx.save();
    ctx.translate(x, y + Math.sin(t * 8 + z.variant) * 1.2);
    ctx.rotate(z.angle);
    ctx.scale(flip, 1);

    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(-12, 14, 24, 4);

    ctx.fillStyle = '#2a392c';
    ctx.fillRect(-5, 8 + step, 4, 12);
    ctx.fillRect(1, 8 - step, 4, 12);

    ctx.fillStyle = z.palette.body;
    ctx.fillRect(-8, -4, 16, 18);

    ctx.fillStyle = z.palette.accent;
    ctx.fillRect(-8, 2, 16, 4);

    ctx.fillStyle = '#2f3d2e';
    ctx.fillRect(-11, -2 + step * 0.6, 3, 10);
    ctx.fillRect(8, -2 - step * 0.6, 3, 10);

    ctx.fillStyle = '#ddc3a1';
    ctx.fillRect(-6, -12, 12, 10);

    ctx.fillStyle = z.palette.eye;
    ctx.fillRect(-3, -9, 2, 2);
    ctx.fillRect(1, -9, 2, 2);

    if(z.flash > 0){
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.fillRect(-8, -12, 16, 20);
    }

    ctx.restore();
  }

  function makePlayer(id, skinId, x, y){
    const sk = SKINS[skinId] || SKINS[0];
    return {
      id, x, y, angle:0, alive:true,
      hp:110, maxHp:110, stam:100, maxStam:100,
      ammo:12, magSize:12, reloadT:0, fireCd:0,
      damage:12, speed:140,
      spdMult:1, dmgMult:1, fireRateMult:1,
      crit:0.05, regen:0, multi:0, shield:0, shock:false,
      xp:0, level:1, xpNext:60,
      inv:0, flash:0, skin:sk
    };
  }

  function resetWorld(){
    zombies = [];
    bullets = [];
    particles = [];
    obstacles = [];
    ally = null;
    allyRescued = false;
    wave = 1;
    score = 0;
    kills = 0;
    gameTime = 0;
    coinsEarned = 0;
    lastCoinTime = 0;
    spawnTimer = 1.2;

    for(let i=0;i<35;i++){
      obstacles.push({
        x: 120 + Math.random() * (WORLD - 240),
        y: 120 + Math.random() * (WORLD - 240),
        w: 28 + Math.random() * 50,
        h: 28 + Math.random() * 50
      });
    }

    players = [makePlayer(0, save.selected, WORLD / 2, WORLD / 2)];
    if(numPlayers === 2 && platform === 'pc'){
      players.push(makePlayer(1, Math.min(save.selected + 1, SKINS.length - 1), WORLD / 2 + 45, WORLD / 2));
    }

    cam.x = players[0].x - W / 2;
    cam.y = players[0].y - H / 2;
  }

  function spawnZombie(){
    const side = Math.floor(Math.random() * 4);
    let x = 0, y = 0;
    const pad = 40;

    if(side === 0){ x = cam.x - pad; y = cam.y + Math.random() * H; }
    else if(side === 1){ x = cam.x + W + pad; y = cam.y + Math.random() * H; }
    else if(side === 2){ x = cam.x + Math.random() * W; y = cam.y - pad; }
    else { x = cam.x + Math.random() * W; y = cam.y + H + pad; }

    x = Math.max(20, Math.min(WORLD - 20, x));
    y = Math.max(20, Math.min(WORLD - 20, y));

    const palette = ZOMBIE_PALETTES[Math.floor(Math.random() * ZOMBIE_PALETTES.length)];
    let type = 'walker';
    let hp = 30 + wave * 4;
    let spd = 45 + wave * 2;
    let dmg = 8 + wave * 0.5;
    let size = 18;
    const roll = Math.random();

    if(roll > 0.75 && wave >= 2){
      type = 'runner';
      hp = 20 + wave * 2;
      spd = 92 + wave * 3;
      dmg = 7;
      size = 14;
    }else if(roll > 0.92 && wave >= 3){
      type = 'tank';
      hp = 110 + wave * 12;
      spd = 30 + wave * 0.8;
      dmg = 18 + wave;
      size = 22;
    }

    zombies.push({
      x, y, hp, maxHp: hp, spd, dmg, type, size,
      flash:0, slow:0, angle:0, variant:Math.random() * 1000, palette
    });
  }

  function addParticles(x, y, color, count = 8){
    for(let i = 0; i < count; i++){
      particles.push({
        x, y,
        vx:(Math.random() - 0.5) * 130,
        vy:(Math.random() - 0.5) * 130,
        life:0.25 + Math.random() * 0.45,
        size:2 + Math.random() * 3,
        color
      });
    }
  }

  function usePower(p, key){
    if(key === 'q' && p.shield <= 0){
      p.shield = 25;
      toast('Shield!');
      return;
    }
    if(key === 'e'){
      p.inv = 0.45;
      p.x += Math.cos(p.angle) * 18;
      p.y += Math.sin(p.angle) * 18;
    }
  }

  function reloadPlayer(p){
    if(p.reloadT > 0 || p.ammo >= p.magSize) return;
    p.reloadT = 1.2;
    SFX.reload();
  }

  function spawnAlly(){
    const p = players[0];
    ally = {x:p.x + 55, y:p.y, hp:80, maxHp:80, angle:0, fireCd:0, alive:true, flash:0};
    toast('Ally Rescued!');
    SFX.levelup();
  }

  function triggerLevelUp(p){
    state = 'levelup';
    const abilities = [
      {name:'Damage+', desc:'+15% damage', apply:pl => { pl.damage *= 1.15; }},
      {name:'Speed+', desc:'+12% move speed', apply:pl => { pl.speed *= 1.12; }},
      {name:'Max HP+', desc:'+25 max health', apply:pl => { pl.maxHp += 25; pl.hp += 25; }},
      {name:'Magazine+', desc:'+4 ammo', apply:pl => { pl.magSize += 4; pl.ammo += 4; }},
      {name:'Fire Rate+', desc:'+18% fire rate', apply:pl => { pl.fireRateMult *= 0.82; }},
      {name:'Crit', desc:'+12% crit', apply:pl => { pl.crit += 0.12; }},
      {name:'Regen', desc:'+2 HP/s', apply:pl => { pl.regen += 2; }},
      {name:'Multi Shot', desc:'+1 extra bullet', apply:pl => { pl.multi += 1; }},
      {name:'Shield', desc:'Gain 30 shield', apply:pl => { pl.shield = Math.max(pl.shield, 30); }},
      {name:'Shock', desc:'Hits slow zombies', apply:pl => { pl.shock = true; }}
    ];

    const chosen = [...abilities].sort(()=>Math.random()-0.5).slice(0,3);
    const box = $('abilityChoices');
    box.innerHTML = '';
    chosen.forEach(ab => {
      const b = document.createElement('button');
      b.className = 'btn choice-btn';
      b.innerHTML = `<div class="t">${ab.name}</div><div class="d">${ab.desc}</div>`;
      b.addEventListener('click', ()=>{
        ab.apply(p);
        SFX.levelup();
        if(p.level >= 5 && !allyRescued){
          allyRescued = true;
          spawnAlly();
        }
        state = 'play';
        showScreen('');
        $('levelUpScreen').classList.remove('active');
      });
      box.appendChild(b);
    });
    showScreen('levelUpScreen');
  }

  function updateModeHint(){
    const el = $('modeHint');
    if(!el) return;
    if(platform === 'mobile') el.textContent = t('mode_mob');
    else if(numPlayers === 2) el.textContent = t('mode_pc2');
    else el.textContent = t('mode_pc1') + ' · ' + t('hint_esc');
  }

  function updateHUD(){
    const p = players[0];
    if(!p) return;
    const hpPct = (p.hp / p.maxHp) * 100;
    const stamPct = (p.stam / p.maxStam) * 100;
    const xpPct = (p.xp / p.xpNext) * 100;

    $('hpBar').querySelector('div').style.width = hpPct + '%';
    $('stamBar').querySelector('div').style.width = stamPct + '%';
    $('xpBar').querySelector('div').style.width = xpPct + '%';

    const mm = Math.floor(gameTime / 60);
    const ss = Math.floor(gameTime % 60);
    $('hudStats').innerHTML = `${t('level')} ${p.level} · ${t('score')} ${score}<br>${t('kills')} ${kills} · ${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')} · 🔫 ${p.ammo}/${p.magSize}`;
    $('hudCoins').textContent = '🪙 ' + save.coins;
    $('hudWave').textContent = t('wave') + ' ' + wave;
  }

  function endGame(){
    state = 'gameover';
    stopMusic();
    const mm = Math.floor(gameTime / 60);
    const ss = Math.floor(gameTime % 60);
    $('goStats').innerHTML = `${t('time')}: ${mm}:${String(ss).padStart(2,'0')}<br>${t('wave')}: ${wave}<br>${t('kills')}: ${kills}<br>${t('score')}: ${score}<br>${t('coins')}: +${coinsEarned}`;
    showScreen('gameOverScreen');
    $('hud').classList.remove('active');
    $('mobileControls').classList.remove('active');
    writeSave();
  }

  function pauseGame(){
    if(state !== 'play') return;
    state = 'pause';
    showScreen('pauseScreen');
  }

  function resumeGame(){
    if(state !== 'pause') return;
    state = 'play';
    showScreen('');
  }

  function update(dt){
    if(state !== 'play') return;

    gameTime += dt;

    if(gameTime - lastCoinTime >= 1){
      lastCoinTime = gameTime;
      coinsEarned += 1;
      save.coins += 1;
    }

    spawnTimer -= dt;
    if(zombies.length < 5 + wave * 2 && spawnTimer <= 0){
      spawnZombie();
      spawnTimer = Math.max(0.45, 1.8 - wave * 0.08);
    }

    if(kills >= wave * 8){
      wave++;
      SFX.wave();
      toast(t('wave') + ' ' + wave);
    }

    players.forEach((p, idx) => {
      if(!p.alive) return;

      p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
      p.stam = Math.min(p.maxStam, p.stam + 18 * dt);
      if(p.inv > 0) p.inv -= dt;
      if(p.flash > 0) p.flash -= dt;
      if(p.reloadT > 0){
        p.reloadT -= dt;
        if(p.reloadT <= 0) p.ammo = p.magSize;
      }
      if(p.fireCd > 0) p.fireCd -= dt;

      let mx = 0, my = 0;
      if(platform === 'mobile'){
        mx = joy.dx;
        my = joy.dy;
      }else{
        if(keys['KeyW'] || keys['ArrowUp']) my -= 1;
        if(keys['KeyS'] || keys['ArrowDown']) my += 1;
        if(keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
        if(keys['KeyD'] || keys['ArrowRight']) mx += 1;
      }

      const len = Math.hypot(mx, my) || 1;
      if(len > 1){ mx /= len; my /= len; }

      const sprint = platform === 'pc' && (keys['ShiftLeft'] || keys['ShiftRight']) && p.stam > 0;
      let speed = p.speed * p.spdMult;
      if(sprint){
        speed *= 1.55;
        p.stam = Math.max(0, p.stam - 35 * dt);
      }

      p.x += mx * speed * dt;
      p.y += my * speed * dt;
      p.x = Math.max(16, Math.min(WORLD - 16, p.x));
      p.y = Math.max(16, Math.min(WORLD - 16, p.y));

      obstacles.forEach(o => {
        if(p.x > o.x - 10 && p.x < o.x + o.w + 10 && p.y > o.y - 10 && p.y < o.y + o.h + 10){
          const dx = p.x - (o.x + o.w / 2);
          const dy = p.y - (o.y + o.h / 2);
          if(Math.abs(dx) > Math.abs(dy)){ p.x += dx > 0 ? 4 : -4; }
          else { p.y += dy > 0 ? 4 : -4; }
        }
      });

      if(platform === 'pc' && idx === 0){
        p.angle = Math.atan2(mouse.y - (p.y - cam.y), mouse.x - (p.x - cam.x));
      }else if(platform === 'mobile' && idx === 0){
        let nearest = null, best = Infinity;
        zombies.forEach(z => {
          const d = Math.hypot(z.x - p.x, z.y - p.y);
          if(d < best){ best = d; nearest = z; }
        });
        if(nearest){ p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x); }
        else if(mx || my){ p.angle = Math.atan2(my, mx); }
      }else if(idx === 1){
        let nearest = null, best = Infinity;
        zombies.forEach(z => {
          const d = Math.hypot(z.x - p.x, z.y - p.y);
          if(d < best){ best = d; nearest = z; }
        });
        if(nearest) p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
      }

      const wantsFire = (idx === 0 && (mouse.down || keys['Space'])) || (idx === 1 && keys['Enter']);
      if(wantsFire && p.fireCd <= 0 && p.reloadT <= 0){
        if(p.ammo <= 0){ reloadPlayer(p); }
        else {
          p.ammo -= 1;
          p.fireCd = 0.18 / p.fireRateMult;
          SFX.shoot();

          const shots = 1 + p.multi;
          for(let s=0; s<shots; s++){
            const spread = (s - (shots - 1) / 2) * 0.085;
            bullets.push({
              x:p.x + Math.cos(p.angle) * 18,
              y:p.y + Math.sin(p.angle) * 18,
              vx:Math.cos(p.angle + spread) * 420,
              vy:Math.sin(p.angle + spread) * 420,
              life:0.9,
              dmg:p.damage * p.dmgMult,
              owner:p,
              shock:p.shock,
              crit:p.crit
            });
          }
          addParticles(p.x + Math.cos(p.angle) * 18, p.y + Math.sin(p.angle) * 18, '#ffb347', 4);
        }
      }

      if(keys['KeyR']) reloadPlayer(p);
      if(keys['KeyQ']) usePower(p, 'q');
      if(keys['KeyE']) usePower(p, 'e');
    });

    const leader = players[0];
    if(leader && leader.alive){
      cam.x += (leader.x - W / 2 - cam.x) * 0.08;
      cam.y += (leader.y - H / 2 - cam.y) * 0.08;
    }

    if(shake.t > 0){
      shake.t -= dt;
      shake.x = (Math.random() - 0.5) * 10;
      shake.y = (Math.random() - 0.5) * 10;
    }else{ shake.x = 0; shake.y = 0; }

    for(let i=bullets.length - 1; i>=0; i--){
      const b = bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      if(b.life <= 0){ bullets.splice(i, 1); continue; }

      for(let j=zombies.length - 1; j>=0; j--){
        const z = zombies[j];
        if(Math.hypot(b.x - z.x, b.y - z.y) < z.size + 4){
          let dmg = b.dmg;
          if(Math.random() < b.crit) dmg *= 2;
          z.hp -= dmg;
          z.flash = 0.12;
          if(b.shock) z.slow = 0.8;
          addParticles(z.x, z.y, '#5dd079', 4);
          bullets.splice(i, 1);

          if(z.hp <= 0){
            kills++;
            score += z.type === 'tank' ? 60 : z.type === 'runner' ? 25 : 12;
            addParticles(z.x, z.y, '#f56a6a', 10);
            SFX.kill();

            players.forEach(pl => {
              if(!pl.alive) return;
              pl.xp += z.type === 'tank' ? 26 : z.type === 'runner' ? 14 : 9;
              if(pl.xp >= pl.xpNext){
                pl.xp -= pl.xpNext;
                pl.level += 1;
                pl.xpNext = Math.floor(pl.xpNext * 1.3);
                triggerLevelUp(pl);
              }
            });

            zombies.splice(j, 1);
          }else{
            SFX.hit();
          }
          break;
        }
      }
    }

    zombies.forEach(z => {
      z.flash = Math.max(0, z.flash - dt);
      z.slow = Math.max(0, z.slow - dt);

      let target = null;
      let bestDist = Infinity;
      players.forEach(p => {
        if(!p.alive) return;
        const d = Math.hypot(p.x - z.x, p.y - z.y);
        if(d < bestDist){ bestDist = d; target = p; }
      });

      if(ally && ally.alive){
        const d = Math.hypot(ally.x - z.x, ally.y - z.y);
        if(d < bestDist){ bestDist = d; target = ally; }
      }

      if(target){
        const moveScale = z.slow > 0 ? 0.72 : 1;
        const angle = Math.atan2(target.y - z.y, target.x - z.x);
        z.angle = angle;
        z.x += Math.cos(angle) * z.spd * moveScale * dt;
        z.y += Math.sin(angle) * z.spd * moveScale * dt;

        if(bestDist < z.size + 12){
          if(target.hp !== undefined){
            if(target.inv <= 0){
              let dmg = z.dmg * dt * 2;
              if(target.shield > 0){
                target.shield -= dmg;
                if(target.shield < 0){
                  dmg = -target.shield;
                  target.shield = 0;
                }else{ dmg = 0; }
              }
              target.hp -= dmg;
              target.flash = 0.15;
              if(save.shake) shake.t = 0.18;
              if(target.hp <= 0){
                target.alive = false;
                target.hp = 0;
                SFX.die();
                addParticles(target.x, target.y, '#ff6b6b', 18);
              }else{
                SFX.hurt();
              }
            }
          }else{
            target.hp -= z.dmg * dt * 2;
            if(target.hp <= 0) target.alive = false;
          }
        }
      }
    });

    if(ally && ally.alive){
      ally.flash = Math.max(0, ally.flash - dt);
      if(players[0] && players[0].alive){
        const p = players[0];
        const dx = p.x - ally.x;
        const dy = p.y - ally.y;
        const d = Math.hypot(dx, dy) || 1;
        if(d > 55){
          ally.x += (dx / d) * 100 * dt;
          ally.y += (dy / d) * 100 * dt;
        }
      }

      let nearest = null, best = Infinity;
      zombies.forEach(z => {
        const d = Math.hypot(z.x - ally.x, z.y - ally.y);
        if(d < best){ best = d; nearest = z; }
      });

      if(nearest && best < 340){
        ally.angle = Math.atan2(nearest.y - ally.y, nearest.x - ally.x);
        ally.fireCd -= dt;
        if(ally.fireCd <= 0){
          ally.fireCd = 0.35;
          bullets.push({
            x: ally.x + Math.cos(ally.angle) * 12,
            y: ally.y + Math.sin(ally.angle) * 12,
            vx: Math.cos(ally.angle) * 360,
            vy: Math.sin(ally.angle) * 360,
            life: 0.8,
            dmg: 11,
            owner: null,
            shock: false,
            crit: 0.05
          });
        }
      }
    }

    for(let i=particles.length - 1; i>=0; i--){
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if(p.life <= 0) particles.splice(i, 1);
    }

    if(players.every(p => !p.alive)) endGame();
    updateHUD();
  }

  function renderWorld(){
    const offsetX = cam.x + (save.shake ? shake.x : 0);
    const offsetY = cam.y + (save.shake ? shake.y : 0);

    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(-offsetX, -offsetY);

    const ts = 80;
    const startX = Math.floor(offsetX / ts) * ts;
    const startY = Math.floor(offsetY / ts) * ts;

    for(let x = startX; x < offsetX + W + ts; x += ts){
      for(let y = startY; y < offsetY + H + ts; y += ts){
        ctx.fillStyle = ((Math.floor(x / ts) + Math.floor(y / ts)) % 2 === 0) ? '#0b0d17' : '#0f1220';
        ctx.fillRect(x, y, ts, ts);
      }
    }

    ctx.fillStyle = '#171a27';
    ctx.fillRect(0, WORLD / 2 - 36, WORLD, 72);
    ctx.fillRect(WORLD / 2 - 36, 0, 72, WORLD);

    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20,20]);
    ctx.beginPath();
    ctx.moveTo(0, WORLD / 2); ctx.lineTo(WORLD, WORLD / 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(WORLD / 2, 0); ctx.lineTo(WORLD / 2, WORLD); ctx.stroke();
    ctx.setLineDash([]);

    obstacles.forEach(o => {
      ctx.fillStyle = '#1a1d2d';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#3a425f';
      ctx.strokeRect(o.x, o.y, o.w, o.h);
    });

    particles.forEach(p => {
      ctx.globalAlpha = p.life * 1.5;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    bullets.forEach(b => {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    zombies.forEach(z => drawZombieSprite(z, z.x, z.y, gameTime));

    if(ally && ally.alive){
      ctx.save();
      ctx.translate(ally.x, ally.y);
      ctx.rotate(ally.angle);
      ctx.fillStyle = '#68a4ff';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.fillStyle = '#e9c7a0';
      ctx.fillRect(-6, -14, 12, 8);
      ctx.fillStyle = '#272d42';
      ctx.fillRect(7, -1, 10, 3);
      ctx.restore();

      if(ally.hp < ally.maxHp){
        ctx.fillStyle = '#333';
        ctx.fillRect(ally.x - 12, ally.y - 18, 24, 4);
        ctx.fillStyle = '#4fa3ff';
        ctx.fillRect(ally.x - 12, ally.y - 18, 24 * (ally.hp / ally.maxHp), 4);
      }
    }

    players.forEach(p => {
      if(!p.alive) return;
      drawPixelHero(ctx, p.skin, p.x, p.y, 1.5, gameTime * 10, p.angle >= 0 ? 1 : -1);
      if(p.flash > 0){
        ctx.fillStyle = 'rgba(255,130,130,0.25)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI * 2); ctx.fill();
      }
      if(p.shield > 0){
        ctx.strokeStyle = 'rgba(120,200,255,.65)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 20, 0, Math.PI * 2); ctx.stroke();
      }
      if(p.hp < p.maxHp){
        ctx.fillStyle = '#333';
        ctx.fillRect(p.x - 14, p.y - 20, 28, 4);
        ctx.fillStyle = '#ff5d5d';
        ctx.fillRect(p.x - 14, p.y - 20, 28 * (p.hp / p.maxHp), 4);
      }
    });

    ctx.restore();

    mctx.fillStyle = 'rgba(0,0,0,.72)';
    mctx.fillRect(0, 0, 110, 110);
    const mmScale = 110 / WORLD;

    mctx.fillStyle = '#353d59';
    obstacles.forEach(o => {
      mctx.fillRect(o.x * mmScale, o.y * mmScale, Math.max(2, o.w * mmScale), Math.max(2, o.h * mmScale));
    });

    mctx.fillStyle = '#d34a4a';
    zombies.forEach(z => mctx.fillRect(z.x * mmScale - 2, z.y * mmScale - 2, 4, 4));

    mctx.fillStyle = '#6ed8ff';
    if(ally && ally.alive) mctx.fillRect(ally.x * mmScale - 2, ally.y * mmScale - 2, 4, 4);

    players.forEach(p => {
      if(!p.alive) return;
      mctx.fillStyle = p.id === 0 ? '#57f0a1' : '#ffca5a';
      mctx.fillRect(p.x * mmScale - 2, p.y * mmScale - 2, 4, 4);
    });
  }

  function updateSkinUI(){
    const skin = SKINS[save.selected];
    $('skinName').textContent = skin.name + ' · ' + skin.cat;
    $('skinDesc').textContent = skin.desc;
    $('skinStats').innerHTML = `
      <span>HP ${110 + (save.selected * 6)}</span>
      <span>DMG ${1 + save.selected * 0.25}x</span>
      <span>SPD ${1 + save.selected * 0.08}x</span>
    `;

    const owned = save.unlocked.includes(save.selected);
    const status = $('skinStatus');
    if(owned){
      status.textContent = 'Owned';
      status.className = 'skin-status owned';
    }else{
      status.textContent = 'Locked · 🪙 ' + skin.price;
      status.className = 'skin-status locked';
    }

    $('btnBuySkin').style.display = owned ? 'none' : 'inline-block';
    $('btnBuySkin').disabled = save.coins < skin.price;
    $('btnEquipSkin').style.display = owned ? 'inline-block' : 'none';
    $('skinsCoins').textContent = '🪙 ' + save.coins;
  }

  function buildSkinBar(){
    const bar = $('skinBar');
    bar.innerHTML = '';
    SKINS.forEach((skin, idx) => {
      const slot = document.createElement('div');
      slot.className = 'skin-slot' + (idx === save.selected ? ' selected' : '') + (!save.unlocked.includes(idx) ? ' locked' : '');
      const cv = document.createElement('canvas');
      cv.width = 44; cv.height = 44;
      const cctx = cv.getContext('2d');
      cctx.fillStyle = '#101521'; cctx.fillRect(0,0,44,44);
      drawPixelHero(cctx, skin, 22, 26, 1.2, 0, 1);
      slot.appendChild(cv);

      if(!save.unlocked.includes(idx)){
        const lock = document.createElement('span');
        lock.className = 'lock';
        lock.textContent = '🔒';
        slot.appendChild(lock);
      }

      slot.addEventListener('click', ()=>{
        save.selected = idx;
        writeSave();
        updateSkinUI();
        buildSkinBar();
        SFX.click();
      });
      bar.appendChild(slot);
    });
  }

  function resize(){
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  }

  function setupInput(){
    window.addEventListener('keydown', e => {
      keys[e.code] = true;
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
      if((e.code === 'Escape' || e.code === 'KeyP') && state === 'play') pauseGame();
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });
    canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
    canvas.addEventListener('mousedown', () => { mouse.down = true; ensureAudio(); });
    window.addEventListener('mouseup', () => { mouse.down = false; });

    document.body.addEventListener('touchmove', e => {
      if(state === 'play') e.preventDefault();
    }, {passive:false});
  }

  function setupMobile(){
    const base = $('joyBase');
    const stick = $('joyStick');
    let touchId = null;

    function setJoy(clientX, clientY){
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = 38;
      const len = Math.hypot(dx, dy) || 1;
      if(len > max){ dx = (dx / len) * max; dy = (dy / len) * max; }
      stick.style.left = (35 + dx) + 'px';
      stick.style.top = (35 + dy) + 'px';
      joy.dx = dx / max;
      joy.dy = dy / max;
    }

    base.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      touchId = t.identifier;
      joy.active = true;
      setJoy(t.clientX, t.clientY);
    }, {passive:false});

    base.addEventListener('mousedown', e => {
      joy.active = true;
      setJoy(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', e => {
      if(!joy.active) return;
      const target = [...e.changedTouches].find(t => t.identifier === touchId);
      if(target){ e.preventDefault(); setJoy(target.clientX, target.clientY); }
    }, {passive:false});

    window.addEventListener('touchend', () => {
      joy.active = false; joy.dx = 0; joy.dy = 0;
      stick.style.left = '35px'; stick.style.top = '35px';
    });

    window.addEventListener('mouseup', () => {
      if(!joy.active) return;
      joy.active = false; joy.dx = 0; joy.dy = 0;
      stick.style.left = '35px'; stick.style.top = '35px';
    });

    $('btnFire').addEventListener('touchstart', e => { e.preventDefault(); mouse.down = true; });
    $('btnFire').addEventListener('touchend', () => { mouse.down = false; });
    $('btnFire').addEventListener('mousedown', () => { mouse.down = true; });

    $('btnReload').addEventListener('mousedown', () => { if(players[0]) reloadPlayer(players[0]); });
    $('btnReload').addEventListener('touchstart', e => { e.preventDefault(); if(players[0]) reloadPlayer(players[0]); });

    $('btnPowerQ').addEventListener('mousedown', () => { if(players[0]) usePower(players[0], 'q'); });
    $('btnPowerQ').addEventListener('touchstart', e => { e.preventDefault(); if(players[0]) usePower(players[0], 'q'); });

    $('btnPowerE').addEventListener('mousedown', () => { if(players[0]) usePower(players[0], 'e'); });
    $('btnPowerE').addEventListener('touchstart', e => { e.preventDefault(); if(players[0]) usePower(players[0], 'e'); });
  }

  function initEvents(){
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if(!btn) return;
      const action = btn.getAttribute('data-action');
      SFX.click();

      if(action === 'goto'){
        const target = btn.getAttribute('data-target');
        showScreen(target);
        if(target === 'skinsScreen'){ buildSkinBar(); updateSkinUI(); }
        if(target === 'themesScreen') buildThemes();
        if(target === 'settingsScreen'){
          $('volMusic').value = save.volMusic;
          $('volSfx').value = save.volSfx;
          $('chkShake').checked = save.shake;
          $('selLang').value = save.lang;
        }
      }

      if(action === 'setPlatform'){
        platform = btn.getAttribute('data-val');
        document.querySelectorAll('[data-action="setPlatform"]').forEach(x => x.classList.remove('primary'));
        btn.classList.add('primary');
        if(platform === 'mobile'){
          numPlayers = 1;
          $('btn2p').disabled = true;
          document.querySelectorAll('[data-action="setPlayers"]').forEach(x => x.classList.toggle('green', x.getAttribute('data-val') === '1'));
        }else{
          $('btn2p').disabled = false;
        }
        updateModeHint();
      }

      if(action === 'setPlayers'){
        if(platform === 'mobile') return;
        numPlayers = Number(btn.getAttribute('data-val'));
        document.querySelectorAll('[data-action="setPlayers"]').forEach(x => x.classList.toggle('green', Number(x.getAttribute('data-val')) === numPlayers));
        updateModeHint();
      }

      if(action === 'startGame'){
        resetWorld();
        state = 'play';
        showScreen('');
        $('hud').classList.add('active');
        $('mobileControls').classList.toggle('active', platform === 'mobile');
        startMusic();
      }

      if(action === 'resume'){ resumeGame(); }
      if(action === 'quitToMenu'){
        state = 'menu';
        stopMusic();
        showScreen('mainMenu');
        $('hud').classList.remove('active');
        $('mobileControls').classList.remove('active');
      }
      if(action === 'restart'){
        resetWorld();
        state = 'play';
        showScreen('');
        $('hud').classList.add('active');
        $('mobileControls').classList.toggle('active', platform === 'mobile');
        startMusic();
      }
      if(action === 'buySkin'){
        const idx = save.selected;
        const skin = SKINS[idx];
        if(save.unlocked.includes(idx)) return;
        if(save.coins >= skin.price){
          save.coins -= skin.price;
          save.unlocked.push(idx);
          writeSave();
          SFX.buy();
          buildSkinBar();
          updateSkinUI();
          toast(skin.name + ' unlocked');
        }
      }
      if(action === 'equipSkin'){
        const idx = save.selected;
        if(!save.unlocked.includes(idx)) return;
        writeSave();
        buildSkinBar();
        updateSkinUI();
        toast(SKINS[idx].name + ' equipped');
      }
      if(action === 'muteAll'){
        save.volMusic = 0; save.volSfx = 0;
        $('volMusic').value = 0; $('volSfx').value = 0;
        stopMusic();
        writeSave();
      }
    });

    $('volMusic').addEventListener('input', e => {
      save.volMusic = Number(e.target.value);
      writeSave();
      if(save.volMusic > 0) startMusic();
      else stopMusic();
    });

    $('volSfx').addEventListener('input', e => {
      save.volSfx = Number(e.target.value);
      writeSave();
    });

    $('chkShake').addEventListener('change', e => {
      save.shake = e.target.checked;
      writeSave();
    });

    $('selLang').addEventListener('change', e => {
      save.lang = e.target.value;
      writeSave();
      updateI18n();
    });
  }

  function animatePreview(){
    const c = $('skinPreviewCanvas');
    if(!c) return;
    const pctx = c.getContext('2d');
    const t = performance.now() * 0.01;
    pctx.fillStyle = '#0d0f1a';
    pctx.fillRect(0,0,128,128);
    drawPixelHero(pctx, SKINS[save.selected], 64, 74, 2.8, t, 1);
  }

  function loop(now){
    const dt = Math.min(0.032, (now - (loop.last || now)) / 1000);
    loop.last = now;
    update(dt);
    if(state === 'play' || state === 'pause' || state === 'levelup'){ renderWorld(); }
    animatePreview();
    requestAnimationFrame(loop);
  }

  function main(){
    resize();
    window.addEventListener('resize', resize);
    applyTheme();
    updateI18n();
    buildThemes();
    buildSkinBar();
    updateSkinUI();
    initEvents();
    setupInput();
    setupMobile();
    showScreen('mainMenu');
    updateModeHint();
    requestAnimationFrame(loop);
  }

  main();
})();
