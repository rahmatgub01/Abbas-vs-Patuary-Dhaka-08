// --- FIXED IMAGES ---
// Using working blogger URLs
const IMG_SMILE = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi382oLmRuer5eY5LG9wtJZV1fB3gB46hyUK226BS0jc3rPHIpb6XVBLDW5xvbhFdQTyRaYTTBL1nUhcLY3M2pTq1HYHNGgSeDoro0YNuRK32JpZsTIlV63m46UdTl2QngtzXlJuMk-P5jhk000kwgjTpDvr-AaGYwDxGBl5KiWU9vqi1w0F90N46mvRv4/s1280/abbas%20smiling-Photoroom.png";

// FIXED: Correct angry image URL
const IMG_ANGRY = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgcQbL6hEWDlmBhBkhI9Tx2RROlfa8LKb5LZW9-8DCKg9JhhSnChkvHYXvAfT3M0FJbvewS8-1wPoJaSL-tenL54d7diup-Vx9MdX78ubGAP3LToH16YfM6Nxr-HwRk6EN1kaeWnKXemQraB2-EI4mWUo-qVBDSSif6cVRuIbeDq4pYIiACCOZMdqRLKMo/w406-h375/abbas%20angry-Photoroom.png";

const IMG_ENEMY = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjqDDE8fbN1fPCYq3RST-O4uOdI1JjjILfYeIEWOrUmown0Swwwfs8eVqot9RYBeqVKXyf6BMKVi4wc8f_nr3XcpL_m47Ye25BALuCbe7XOspt4v35Zcp1LqMvPMXrpTNLRamQqiDecWmLL1e0OSDWAfkt3z0vPRcDa-r4zKJftfPiu2Hfp6bzu5T4DV4A/s354/patuary-removebg-preview.png";

// NEW: Power-up image (tea cup)
const IMG_POWERUP = "https://cdn-icons-png.flaticon.com/512/3082/3082383.png";

// NEW: Boss enemy image
const IMG_BOSS = "https://cdn-icons-png.flaticon.com/512/1692/1692860.png";

// --- GAME CONFIGURATION ---
const MAX_ANGER = 100;
const HIT_PENALTY = 10; 
const HEAL_AMOUNT = 1;
const POWERUP_HEAL = 30;
const BOSS_SCORE_THRESHOLD = 50;
const BOSS_SPEED = 3.5;

// --- GAME STATE ---
let gameState = {
    active: false,
    score: 0,
    anger: 0,
    enemies: [],
    powerups: [],
    bossActive: false,
    boss: null,
    lastSpawn: 0,
    spawnRate: 1300,
    speed: 2.0,
    highScore: localStorage.getItem('abbasHighScore') || 0
};

// --- PAUSE SYSTEM ---
let isPaused = false;
let gameLoopId = null;

// --- TEXT ARRAYS ---
const hitWords = ["উফ!", "ওরে বাপরে!", "আইলারে!", "গেলরে!", "হায় হায়!", "মারছে!", "বাঁচাও!", "আরে!"];
const saveWords = ["ভাগ!", "যাহ!", "ধুত!", "সর!", "বাঁচল!", "মামা!", "চমৎকার!", "বাহ!"];
const powerupWords = ["চা চা!", "সেরা!", "ফ্রেশ!", "আহা!", "বাহ!", "জি!"];
const bossWords = ["বস!", "আসছে!", "সাবধান!", "ওহহ!", "বিগ বস!"];

// --- AUDIO ---
let audioEnabled = false;
let angerTimeout;

// --- IMAGE LOADING ---
const images = [IMG_SMILE, IMG_ANGRY, IMG_ENEMY, IMG_POWERUP, IMG_BOSS];
let imagesLoaded = 0;
const totalImages = images.length;

function loadImages() {
    images.forEach(src => {
        const img = new Image();
        img.onload = img.onerror = () => {
            imagesLoaded++;
            if (imagesLoaded === totalImages) {
                document.querySelector('#intro-screen p').innerHTML = 'লোডিং সম্পন্ন!<br><span style="color:#4CAF50">ট্যাপ করুন</span>';
            }
        };
        img.src = src;
    });
}

// --- PAUSE FUNCTIONS ---
function togglePause() {
    isPaused = !isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    const pauseOverlay = document.getElementById('pause-overlay');
    const bgm = document.getElementById('snd-bgm');
    
    if (isPaused) {
        // Pause the game
        pauseBtn.classList.add('paused');
        pauseOverlay.style.display = 'flex';
        
        // Pause audio
        if (bgm) {
            bgm.pause();
        }
        
        // Store the game loop ID to resume later
        if (gameLoopId) {
            cancelAnimationFrame(gameLoopId);
        }
    } else {
        // Resume the game
        pauseBtn.classList.remove('paused');
        pauseOverlay.style.display = 'none';
        
        // Resume audio
        if (bgm && audioEnabled) {
            bgm.play().catch(() => {});
        }
        
        // Restart game loop
        if (gameState.active) {
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }
}

// Handle ESC key for pause
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === ' ') {
        if (gameState.active) {
            togglePause();
        }
    }
});

// Prevent right-click menu in game
document.addEventListener('contextmenu', (e) => {
    if (gameState.active) {
        e.preventDefault();
    }
});

// --- INITIALIZATION ---
function enableAudio() {
    if(!audioEnabled) {
        audioEnabled = true;
        document.getElementById('snd-intro').play().catch(()=>{});
        loadImages(); // Start loading game images
    }
}

// --- MAIN GAME FUNCTIONS ---
function startGame() {
    document.getElementById('rules-modal').style.display = 'none';
    document.getElementById('ui-layer').style.display = 'block';
    document.getElementById('game-area').style.display = 'block';
    document.getElementById('pause-btn').style.display = 'block'; // Show pause button
    
    // Audio switch
    document.getElementById('snd-intro').pause();
    const bgm = document.getElementById('snd-bgm');
    bgm.volume = 0.4;
    bgm.play().catch(()=>{});

    // Ensure Smile First
    document.getElementById('hero-img').src = IMG_SMILE;

    gameState.active = true;
    isPaused = false;
    updateHighScoreDisplay();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameState.active || isPaused) return;
    
    gameLoopId = requestAnimationFrame(gameLoop);
    
    if (timestamp - gameState.lastSpawn > gameState.spawnRate) {
        spawnEnemy();
        gameState.lastSpawn = timestamp;
        if(gameState.spawnRate > 400) gameState.spawnRate -= 10;
        gameState.speed += 0.05;
    }

    // Spawn powerup every 15 seconds
    if (Math.random() < 0.001 && !gameState.bossActive) {
        spawnPowerup();
    }

    // Spawn boss at score threshold
    if (gameState.score >= BOSS_SCORE_THRESHOLD && !gameState.bossActive) {
        spawnBoss();
    }

    moveEnemies();
    movePowerups();
    if (gameState.bossActive) moveBoss();
}

function spawnEnemy() {
    const el = document.createElement('div');
    el.className = 'enemy';
    el.innerHTML = `<img src="${IMG_ENEMY}">`;
    
    // Spawn Logic
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    const w = window.innerWidth;
    const h = window.innerHeight;
    const b = 70; 

    if(edge === 0) { x = Math.random()*w; y = -b; }
    else if(edge === 1) { x = w+b; y = Math.random()*h; }
    else if(edge === 2) { x = Math.random()*w; y = h+b; }
    else { x = -b; y = Math.random()*h; }

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.getElementById('game-area').appendChild(el);

    const enemyObj = { el: el, x: x, y: y, isBoss: false };

    // Kill event
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        killEnemy(enemyObj, true);
    });

    gameState.enemies.push(enemyObj);
}

function spawnPowerup() {
    const el = document.createElement('div');
    el.className = 'powerup';
    el.innerHTML = `<img src="${IMG_POWERUP}">`;
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = Math.random() * (w - 100) + 50;
    const y = Math.random() * (h - 100) + 50;

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.getElementById('game-area').appendChild(el);

    const powerupObj = { el: el, x: x, y: y };

    // Collect event
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        collectPowerup(powerupObj);
    });

    gameState.powerups.push(powerupObj);
    
    // Remove after 10 seconds if not collected
    setTimeout(() => {
        if (powerupObj.el.parentNode) {
            powerupObj.el.remove();
            gameState.powerups = gameState.powerups.filter(p => p !== powerupObj);
        }
    }, 10000);
}

function spawnBoss() {
    gameState.bossActive = true;
    document.getElementById('snd-boss').play().catch(()=>{});
    
    const el = document.createElement('div');
    el.className = 'enemy boss-enemy';
    el.innerHTML = `<img src="${IMG_BOSS}">`;
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x = Math.random() * (w - 200) + 100;
    const y = Math.random() * (h - 200) + 100;

    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.getElementById('game-area').appendChild(el);

    const bossObj = { el: el, x: x, y: y, health: 5, isBoss: true };

    // Boss kill event (needs multiple taps)
    el.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        hitBoss(bossObj);
    });

    gameState.boss = bossObj;
    
    // Show warning text
    const zRect = document.getElementById('hit-zone').getBoundingClientRect();
    showFloatingText(zRect.left + zRect.width/2, zRect.top, bossWords);
}

function moveEnemies() {
    const hitZone = document.getElementById('hit-zone');
    const zRect = hitZone.getBoundingClientRect();
    const zX = zRect.left + zRect.width/2;
    const zY = zRect.top + zRect.height/2;
    const radius = zRect.width/2; 

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        let e = gameState.enemies[i];
        if (e.isBoss) continue; // Boss moves separately
        
        const bRect = e.el.getBoundingClientRect();
        const bX = bRect.left + bRect.width/2;
        const bY = bRect.top + bRect.height/2;
        
        const dx = zX - bX;
        const dy = zY - bY;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        // HIT
        if (dist < radius) {
            damageHero();
            killEnemy(e, false);
            continue;
        }

        e.x += Math.cos(angle) * gameState.speed;
        e.y += Math.sin(angle) * gameState.speed;
        
        e.el.style.transform = `translate(${e.x}px, ${e.y}px) rotate(${angle * 57.29 + 90}deg)`;
    }
}

function movePowerups() {
    for (let p of gameState.powerups) {
        // Gentle floating animation
        p.el.style.transform = `translateY(${Math.sin(Date.now()/500)*5}px)`;
    }
}

function moveBoss() {
    if (!gameState.boss) return;
    
    const hitZone = document.getElementById('hit-zone');
    const zRect = hitZone.getBoundingClientRect();
    const zX = zRect.left + zRect.width/2;
    const zY = zRect.top + zRect.height/2;
    
    const bRect = gameState.boss.el.getBoundingClientRect();
    const bX = bRect.left + bRect.width/2;
    const bY = bRect.top + bRect.height/2;
    
    const dx = zX - bX;
    const dy = zY - bY;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // BOSS HIT
    if (dist < zRect.width/2) {
        damageHero(20); // Boss does double damage
        return;
    }

    gameState.boss.x += Math.cos(angle) * BOSS_SPEED;
    gameState.boss.y += Math.sin(angle) * BOSS_SPEED;
    
    gameState.boss.el.style.transform = `translate(${gameState.boss.x}px, ${gameState.boss.y}px) rotate(${angle * 57.29 + 90}deg)`;
}

function killEnemy(enemy, byPlayer) {
    if(enemy.el.parentNode) enemy.el.remove();
    gameState.enemies = gameState.enemies.filter(e => e !== enemy);

    if (byPlayer) {
        gameState.score++;
        if(gameState.anger > 0) gameState.anger = Math.max(0, gameState.anger - HEAL_AMOUNT);
        updateUI();
        
        // Sound
        const snd = document.getElementById('snd-save');
        if(snd) { snd.currentTime = 0; snd.play().catch(()=>{}); }
        
        // Text & Effect
        createExplosion(enemy.x, enemy.y);
        showFloatingText(enemy.x, enemy.y, saveWords);
    }
}

function collectPowerup(powerup) {
    if(powerup.el.parentNode) powerup.el.remove();
    gameState.powerups = gameState.powerups.filter(p => p !== powerup);
    
    // Heal anger
    gameState.anger = Math.max(0, gameState.anger - POWERUP_HEAL);
    
    // Sound
    document.getElementById('snd-powerup').currentTime = 0;
    document.getElementById('snd-powerup').play().catch(()=>{});
    
    // Effect
    createExplosion(powerup.x, powerup.y, '#4CAF50');
    showFloatingText(powerup.x, powerup.y, powerupWords);
    updateUI();
}

function hitBoss(boss) {
    boss.health--;
    
    if (boss.health <= 0) {
        // Defeat boss
        if(boss.el.parentNode) boss.el.remove();
        gameState.bossActive = false;
        gameState.boss = null;
        gameState.score += 50; // Big bonus!
        
        createExplosion(boss.x, boss.y, '#FF0000');
        showFloatingText(boss.x, boss.y, ["ধ্বংস!", "হার!", "জিৎ!"]);
    } else {
        // Boss hit but not defeated
        boss.el.style.filter = 'drop-shadow(0 0 20px red)';
        setTimeout(() => {
            if (boss.el) boss.el.style.filter = 'drop-shadow(0 0 15px red)';
        }, 200);
        
        showFloatingText(boss.x, boss.y, ["উহ!", "মার!", "আহ!"]);
    }
    
    updateUI();
}

function damageHero(damage = HIT_PENALTY) {
    gameState.anger += damage;
    if (gameState.anger > MAX_ANGER) gameState.anger = MAX_ANGER;
    
    const heroImg = document.getElementById('hero-img');
    const heroContainer = document.getElementById('hero-container');
    const hitZone = document.getElementById('hit-zone');

    // 1. Force Image to Angry
    heroImg.src = IMG_ANGRY;
    
    // 2. Shake
    heroContainer.classList.remove('shake');
    void heroContainer.offsetWidth; // Trigger reflow
    heroContainer.classList.add('shake');
    
    // 3. Red Flash
    hitZone.style.backgroundColor = "rgba(255, 0, 0, 0.4)";
    hitZone.style.borderColor = "red";

    // 4. Sound
    const snd = document.getElementById('snd-hit');
    if(snd) { snd.currentTime = 0; snd.play().catch(()=>{}); }

    // 5. Floating Text (Pain)
    const zRect = hitZone.getBoundingClientRect();
    showFloatingText(zRect.left + zRect.width/2, zRect.top, hitWords);

    // 6. Reset Logic (Fixed)
    // Clear previous timeout so it doesn't swap back to smile too early if hit repeatedly
    if (angerTimeout) clearTimeout(angerTimeout);
    
    angerTimeout = setTimeout(() => {
        if(gameState.active && gameState.anger < MAX_ANGER * 0.7) {
            heroImg.src = IMG_SMILE;
            hitZone.style.backgroundColor = "rgba(255, 0, 0, 0.05)";
            hitZone.style.borderColor = "rgba(255, 0, 0, 0.4)";
        }
    }, 800);

    updateUI();

    if (gameState.anger >= MAX_ANGER) {
        gameOver();
    }
}

function showFloatingText(x, y, wordList) {
    const txt = document.createElement('div');
    txt.className = 'float-text';
    txt.innerText = wordList[Math.floor(Math.random() * wordList.length)];
    // Randomize position slightly
    const rx = x + (Math.random()*40 - 20);
    txt.style.left = rx + 'px';
    txt.style.top = y + 'px';
    document.getElementById('game-area').appendChild(txt);
    setTimeout(() => txt.remove(), 1000);
}

function createExplosion(x, y, color = '#FFD700') {
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.background = color;
        p.style.left = x + 'px'; p.style.top = y + 'px';
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 50 + 20;
        p.style.transform = `translate(${Math.cos(angle)*velocity}px, ${Math.sin(angle)*velocity}px)`;
        document.getElementById('game-area').appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

function gameOver() {
    gameState.active = false;
    // Hide pause button
    document.getElementById('pause-btn').style.display = 'none';
    
    // Ensure he stays angry
    if (angerTimeout) clearTimeout(angerTimeout);
    document.getElementById('hero-img').src = IMG_ANGRY;
    
    // Update original high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('abbasHighScore', gameState.score);
    }
    
    document.getElementById('snd-bgm').pause();
    document.getElementById('snd-over').play().catch(()=>{});
    
    document.getElementById('final-score').innerText = "স্কোর: " + gameState.score;
    updateHighScoreDisplay();
    
    document.getElementById('game-over-screen').style.display = 'flex';
}

function updateUI() {
    document.getElementById('score-box').innerText = "বাঁচানো: " + gameState.score;
    const bar = document.getElementById('anger-bar');
    bar.style.width = gameState.anger + "%";
    
    // Color based on anger level
    if(gameState.anger > 80) bar.style.background = "red";
    else if(gameState.anger > 50) bar.style.background = "linear-gradient(90deg, #ff9800, #ff0000)";
    else bar.style.background = "linear-gradient(90deg, #ffeb3b, #ff9800)";
}

function updateHighScoreDisplay() {
    document.getElementById('high-score').innerText = "সর্বোচ্চ স্কোর: " + gameState.highScore;
}

function shareGame() {
    const text = `আমি পাটোয়ারীর হাত থেকে আব্বাসকে ${gameState.score} বার বাঁচাইছি! 🤣 দেখ তোর কি অবস্থা! #AbbasVsPatuary`;
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({ title: 'Abbas vs Patuary', text: text, url: url }).catch(console.error);
    } else {
        navigator.clipboard.writeText(text + " " + url).then(() => {
            alert("লিঙ্ক কপি করা হয়েছে! বন্ধুদের পাঠান।");
        });
    }
}

// --- WINDOW LOAD ---
window.onload = function() {
    // Set Intro Images
    document.getElementById('intro-abbas').src = IMG_SMILE;
    document.getElementById('intro-pat').src = IMG_ENEMY;
    
    // Try playing intro automatically
    document.getElementById('snd-intro').volume = 0.6;
    document.getElementById('snd-intro').play().catch(()=>{});
    
    // Preload some images
    loadImages();

    // Show rules after 4 seconds
    setTimeout(() => {
        document.getElementById('intro-screen').style.display = 'none';
        document.getElementById('rules-modal').style.display = 'flex';
    }, 4000);
};
