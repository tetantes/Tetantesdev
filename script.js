// ===== FORCE DARK =====
document.documentElement.style.background = '#080808';
document.body.style.background = '#080808';

// ===== TELEGRAM =====
const isTelegram = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
let tg = null;

if (isTelegram) {
    tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    document.documentElement.style.setProperty('background', '#080808', 'important');
    document.body.style.setProperty('background', '#080808', 'important');
    document.body.classList.add('tg-mode');

    // Personalized greeting
    const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
    if (user && user.first_name) {
        document.getElementById('heroGreeting').textContent = `Hey ${user.first_name} 👋 Let's build something`;
    }

    // Telegram Main Button
    tg.MainButton.setText('💬 Hire Me');
    tg.MainButton.color = '#c8f135';
    tg.MainButton.textColor = '#080808';
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
        tg.openTelegramLink('https://t.me/Ademuyiwa2017');
    });

    setTimeout(startAutoScroll, 2000);
} else {
    initCursor();
}

// ===== TYPING EFFECT =====
const lines = ['I BUILD', 'TELEGRAM', 'BOTS THAT', 'WORK.'];
const lineIds = ['typeLine1', 'typeLine2', 'typeLine3', 'typeLine4'];
let lineIndex = 0;
let charIndex = 0;
let typingStarted = false;

function typeNextLine() {
    if (lineIndex >= lines.length) return;
    const el = document.getElementById(lineIds[lineIndex]);
    if (!el) return;

    el.style.opacity = '1';

    if (charIndex < lines[lineIndex].length) {
        el.textContent = lines[lineIndex].substring(0, charIndex + 1);
        charIndex++;
        setTimeout(typeNextLine, 60);
    } else {
        lineIndex++;
        charIndex = 0;
        if (lineIndex < lines.length) {
            setTimeout(typeNextLine, 120);
        }
    }
}

// Start typing after page loads
window.addEventListener('load', () => {
    setTimeout(() => {
        typeNextLine();
    }, 400);
});

// ===== PARTICLES =====
const canvas = document.getElementById('particlesCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const particles = [];
const EMOJIS = ['🤖', '⛏️', '💰', '📱', '🛡️', '🎯', '💬', '🔧'];

for (let i = 0; i < 18; i++) {
    particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        size: Math.random() * 14 + 10,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        opacity: Math.random() * 0.12 + 0.04,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
    });
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.font = `${p.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;

        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
        if (p.y < -50) p.y = canvas.height + 50;
        if (p.y > canvas.height + 50) p.y = -50;
    });
    requestAnimationFrame(drawParticles);
}
drawParticles();

// ===== CUSTOM CURSOR =====
function initCursor() {
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursorDot');
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
    });

    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.12;
        cursorY += (mouseY - cursorY) * 0.12;
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.querySelectorAll('a, button, .project-card, .service-item').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%,-50%) scale(1.8)';
            cursor.style.background = 'rgba(200,241,53,0.1)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%,-50%) scale(1)';
            cursor.style.background = 'transparent';
        });
    });
}

// ===== PROGRESS BAR =====
const progressBar = document.getElementById('progressBar');
window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const pct = (scrollTop / docHeight) * 100;
    progressBar.style.width = pct + '%';
});

// ===== BACK TO TOP =====
const backTop = document.getElementById('backTop');
window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        backTop.classList.add('visible');
    } else {
        backTop.classList.remove('visible');
    }
});

// ===== ACTIVE NAV =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[data-section]');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 100) {
            current = sec.id;
        }
    });
    navLinks.forEach(a => {
        a.classList.remove('active');
        if (a.dataset.section === current) a.classList.add('active');
    });
});

// ===== NAV SHRINK =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.style.padding = window.scrollY > 50
        ? (isTelegram ? '12px 24px' : '16px 48px')
        : (isTelegram ? '14px 24px' : '24px 48px');
});

// ===== COUNT-UP STATS =====
function animateCountUp(el) {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 1500;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = Math.round(eased * target);
        el.textContent = val + suffix;
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.stat-num').forEach(animateCountUp);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ===== AUTO SCROLL =====
let autoScrollActive = false;
let autoScrollRAF = null;
const scrollSpeed = 3.5;

function startAutoScroll() {
    if (autoScrollActive) return;
    autoScrollActive = true;

    function scrollStep() {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        if (window.scrollY >= maxScroll - 5) {
            autoScrollActive = false;
            triggerFlicker();
            // Haptic feedback
            if (isTelegram && tg) {
                try { tg.HapticFeedback.notificationOccurred('success'); } catch(e) {}
            }
            return;
        }
        window.scrollBy(0, scrollSpeed);
        autoScrollRAF = requestAnimationFrame(scrollStep);
    }
    autoScrollRAF = requestAnimationFrame(scrollStep);
}

document.addEventListener('touchstart', () => {
    if (autoScrollActive) {
        autoScrollActive = false;
        if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
    }
}, { passive: true });

// ===== FLICKER =====
function triggerFlicker() {
    const btn = document.getElementById('contactBtn');
    if (!btn) return;
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
        btn.classList.add('flickering');
        btn.addEventListener('animationend', () => btn.classList.remove('flickering'), { once: true });
    }, 600);
}

// ===== SMOOTH ANCHOR =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        autoScrollActive = false;
        if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
