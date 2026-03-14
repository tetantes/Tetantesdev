// ===== FORCE DARK IMMEDIATELY =====
document.documentElement.style.background = '#080808';
document.body.style.background = '#080808';

// ===== TELEGRAM WEBAPP DETECTION =====
const isTelegram = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);

if (isTelegram) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Force dark — DO NOT use tg.themeParams
    document.documentElement.style.setProperty('background', '#080808', 'important');
    document.body.style.setProperty('background', '#080808', 'important');
    document.body.classList.add('tg-mode');

    // Start auto scroll after 2s
    setTimeout(startAutoScroll, 2000);

} else {
    initCursor();
}

// ===== CUSTOM CURSOR (browser only) =====
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

// ===== AUTO SCROLL =====
let autoScrollActive = false;
let autoScrollRAF = null;
const scrollSpeed = 10;

function startAutoScroll() {
    if (autoScrollActive) return;
    autoScrollActive = true;

    function scrollStep() {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        if (window.scrollY >= maxScroll - 5) {
            autoScrollActive = false;
            triggerFlicker();
            return;
        }
        window.scrollBy(0, scrollSpeed);
        autoScrollRAF = requestAnimationFrame(scrollStep);
    }
    autoScrollRAF = requestAnimationFrame(scrollStep);
}

// Pause on touch
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

// ===== SCROLL REVEAL =====
document.querySelectorAll('.project-card, .skill-group, .service-item, .section-header').forEach(el => {
    el.classList.add('reveal');
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// Stagger grids
const gridObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((child, i) => {
                setTimeout(() => child.classList.add('visible'), i * 100);
            });
            gridObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.05 });

document.querySelectorAll('.projects-grid, .skills-grid, .services-list').forEach(el => gridObserver.observe(el));

// ===== NAV SHRINK =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    nav.style.padding = window.scrollY > 50
        ? (isTelegram ? '12px 24px' : '16px 48px')
        : (isTelegram ? '14px 24px' : '24px 48px');
});

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
