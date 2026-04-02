/* ========================================
   FestgeldPlaner – JavaScript
   Scroll animations, email handling, navbar
   ======================================== */

// --- Navbar scroll effect ---
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
}, { passive: true });

// --- Scroll-triggered animations ---
function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.email-card, .step-card, .vorteil-card, .trust-stat-card, .trust-item, .table-row, .section-header'
    );

    elements.forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        // Add stagger delay to grid children
        const parent = el.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.classList.contains('animate-on-scroll'));
            const siblingIndex = siblings.indexOf(el);
            if (siblingIndex >= 0) {
                el.setAttribute('data-delay', Math.min(siblingIndex + 1, 5));
            }
        }
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// --- Email form handling ---
function handleEmailSubmit(event, formType) {
    event.preventDefault();

    const form = event.target;
    const input = form.querySelector('.email-input');
    const successEl = document.getElementById(`email-success-${formType}`);
    const submitBtn = form.querySelector('.btn-form');

    if (!input.value || !input.validity.valid) {
        input.style.borderColor = '#c53030';
        input.style.boxShadow = '0 0 0 3px rgba(197, 48, 48, 0.1)';
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.boxShadow = '';
        }, 2000);
        return;
    }

    // Simulate submission
    submitBtn.textContent = 'Wird gesendet...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    setTimeout(() => {
        // Show success
        successEl.classList.add('show');
        input.value = '';
        submitBtn.textContent = 'Gesendet ✓';
        submitBtn.style.background = '#27ae60';
        submitBtn.style.opacity = '1';

        // Reset after 4 seconds
        setTimeout(() => {
            successEl.classList.remove('show');
            submitBtn.textContent = formType === 'primary' ? 'Kostenlose Angebote erhalten' : 'Jetzt sichern';
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 4000);
    }, 800);
}

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        e.preventDefault();
        const target = document.querySelector(targetId);
        if (target) {
            const navHeight = navbar.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// --- Angebot ansehen buttons → scroll to email form ---
// (Already handled by href="#email-form" links)

// --- Counter animation for hero stats ---
function animateCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const text = stat.textContent;
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(10px)';
        stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    setTimeout(() => {
        statNumbers.forEach((stat, i) => {
            setTimeout(() => {
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, i * 150);
        });
    }, 600);
}

// --- Table row hover micro-interaction ---
document.querySelectorAll('.table-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
        row.style.transform = 'scale(1.005)';
    });
    row.addEventListener('mouseleave', () => {
        row.style.transform = 'scale(1)';
    });
});

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    animateCounters();
});


