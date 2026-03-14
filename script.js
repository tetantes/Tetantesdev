// ===== TELEGRAM WEBAPP DETECTION =====
const isTelegram = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== '';

if (isTelegram) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    document.body.classList.add('tg-mode');

    // Match Telegram theme
    document.documentElement.style.setProperty('--bg', tg.themeParams.bg_color || '#080808');

    // Start auto-scroll after page loads
    window.addEventListener('load', () => {
        setTimeout(startAutoScroll, 2000);
    });
} else {
    // Browser mode — enable custom cursor
    initCursor();
}

// ===== CUSTOM CURSOR (browser only) =====
function initCursor() {
    const cursor = document.getElementById('cursor');
    const cursorDot = document.getElementById('cursorDot');

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

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
            cursor.style.transform = 'translate(-50%, -50%) scale(1.8)';
            cursor.style.background = 'rgba(200,241,53,0.1)';
        });
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.background = 'transparent';
        });
    });
}

// ===== AUTO SCROLL (Telegram mode) =====
let autoScrollActive = false;
let autoScrollRAF = null;
let scrollSpeed = 0.6; // px per frame — slow and smooth

function startAutoScroll() {
    if (autoScrollActive) return;
    autoScrollActive = true;

    function scrollStep() {
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const current = window.scrollY;

        if (current >= maxScroll - 5) {
            // Reached bottom — trigger flicker
            autoScrollActive = false;
            triggerFlicker();
            return;
        }

        window.scrollBy(0, scrollSpeed);
        autoScrollRAF = requestAnimationFrame(scrollStep);
    }

    autoScrollRAF = requestAnimationFrame(scrollStep);
}

// Pause auto-scroll if user touches screen
document.addEventListener('touchstart', () => {
    if (autoScrollActive) {
        autoScrollActive = false;
        if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
    }
}, { passive: true });

// ===== FLICKER EFFECT =====
function triggerFlicker() {
    const btn = document.getElementById('contactBtn');
    if (!btn) return;

    // Scroll button into view smoothly
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
        btn.classList.add('flickering');

        // Remove class after animation so it can re-trigger
        btn.addEventListener('animationend', () => {
            btn.classList.remove('flickering');
        }, { once: true });
    }, 600);
}

// ===== SCROLL REVEAL =====
const reveals = document.querySelectorAll(
    '.project-card, .skill-group, .service-item, .section-header'
);
reveals.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

reveals.forEach(el => observer.observe(el));

// Stagger grid children
const gridObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll('.reveal');
            children.forEach((child, i) => {
                setTimeout(() => child.classList.add('visible'), i * 100);
            });
            gridObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.05 });

document.querySelectorAll('.projects-grid, .skills-grid, .services-list').forEach(el => {
    gridObserver.observe(el);
});

// ===== NAV SCROLL SHRINK =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.padding = isTelegram ? '12px 24px' : '16px 48px';
    } else {
        nav.style.padding = isTelegram ? '14px 24px' : '24px 48px';
    }
});

// ===== SMOOTH ANCHOR SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        // Stop auto-scroll when user taps a link
        autoScrollActive = false;
        if (autoScrollRAF) cancelAnimationFrame(autoScrollRAF);
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
