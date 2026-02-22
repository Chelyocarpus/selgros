/* ===========================
   ANIMATION CONTROLLER
   Handles JS-driven animation logic:
     – Ripple effects on buttons
     – Scroll reveal (IntersectionObserver)
     – Counter (count-up) animations for stat numbers
     – DOM mutation observer to re-apply effects on dynamically added content
   =========================== */

const AnimationController = (() => {
    /* ─────────────────────────────────────────
       CONSTANTS
    ───────────────────────────────────────── */
    const RIPPLE_CLASS = 'anim-ripple';
    const REVEAL_HIDDEN_CLASS = 'reveal-hidden';
    const REVEAL_VISIBLE_CLASS = 'reveal-visible';
    const COUNT_CLASS = 'count-animating';

    // Selectors that should receive scroll-reveal treatment
    const REVEAL_SELECTORS = [
        '.card',
        '.dashboard-widget',
        '.stats-card',
        '.stat-card',
        '.widget-stat-card',
    ];

    // Selectors for numeric counters
    const COUNTER_SELECTORS = [
        '.stat-value',
        '.stat-number',
        '[data-count]',
    ];

    // Ripple target selectors
    const RIPPLE_SELECTORS = '.btn, .header-btn';

    /* ─────────────────────────────────────────
       REDUCED MOTION CHECK
    ───────────────────────────────────────── */
    function isReducedMotion() {
        return (
            document.body.classList.contains('reduced-motion') ||
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
    }

    /* ─────────────────────────────────────────
       RIPPLE EFFECT
    ───────────────────────────────────────── */
    function createRipple(event) {
        if (isReducedMotion()) return;

        const button = event.currentTarget;
        const existingRipple = button.querySelector(`.${RIPPLE_CLASS}`);
        if (existingRipple) existingRipple.remove();

        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();

        const ripple = document.createElement('span');
        ripple.classList.add(RIPPLE_CLASS);
        ripple.style.cssText = [
            `width: ${diameter}px`,
            `height: ${diameter}px`,
            `left: ${event.clientX - rect.left - radius}px`,
            `top: ${event.clientY - rect.top - radius}px`,
        ].join('; ');

        button.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }

    function attachRippleListeners(root = document) {
        root.querySelectorAll(RIPPLE_SELECTORS).forEach(el => {
            // Avoid duplicate listeners by checking a flag
            if (!el.dataset.rippleAttached) {
                el.addEventListener('click', createRipple);
                el.dataset.rippleAttached = 'true';
            }
        });
    }

    /* ─────────────────────────────────────────
       SCROLL REVEAL
    ───────────────────────────────────────── */
    let revealObserver = null;

    function buildRevealObserver() {
        if (!('IntersectionObserver' in window)) return null;

        return new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    el.classList.remove(REVEAL_HIDDEN_CLASS);
                    el.classList.add(REVEAL_VISIBLE_CLASS);
                    obs.unobserve(el);
                });
            },
            { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
        );
    }

    function observeRevealTargets(root = document) {
        if (isReducedMotion() || !revealObserver) return;

        const selector = REVEAL_SELECTORS.join(', ');
        root.querySelectorAll(selector).forEach(el => {
            if (!el.dataset.revealObserved) {
                el.classList.add(REVEAL_HIDDEN_CLASS);
                revealObserver.observe(el);
                el.dataset.revealObserved = 'true';
            }
        });
    }

    /* ─────────────────────────────────────────
       COUNT-UP ANIMATION
    ───────────────────────────────────────── */
    function animateCounter(el) {
        if (isReducedMotion()) return;

        const rawValue = (el.dataset.count ?? el.textContent ?? '').toString().trim();
        const numericPart = rawValue.replace(/[^0-9.-]/g, '');
        const target = parseFloat(numericPart);
        if (isNaN(target) || target === 0) return;

        // Suffix/prefix preservation
        const prefix = rawValue.slice(0, rawValue.search(/[0-9.-]/));
        const suffix = rawValue.slice(rawValue.lastIndexOf(numericPart.slice(-1)) + 1);
        const isInteger = Number.isInteger(target);
        const decimals = isInteger ? 0 : (numericPart.split('.')[1] || '').length;

        const duration = Math.min(1200, Math.max(400, target * 2));
        const startTime = performance.now();
        const startVal = 0;

        el.classList.add(COUNT_CLASS);

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startVal + (target - startVal) * eased;
            el.textContent = prefix + current.toFixed(decimals) + suffix;

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                el.textContent = prefix + target.toFixed(decimals) + suffix;
                el.classList.remove(COUNT_CLASS);
            }
        }

        requestAnimationFrame(tick);
    }

    let counterObserver = null;

    function buildCounterObserver() {
        if (!('IntersectionObserver' in window)) return null;

        return new IntersectionObserver(
            (entries, obs) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    animateCounter(entry.target);
                    obs.unobserve(entry.target);
                });
            },
            { threshold: 0.5 }
        );
    }

    function observeCounters(root = document) {
        if (isReducedMotion() || !counterObserver) return;

        const selector = COUNTER_SELECTORS.join(', ');
        root.querySelectorAll(selector).forEach(el => {
            const text = (el.dataset.count ?? el.textContent ?? '').trim();
            const hasNumber = /[0-9]/.test(text);
            if (hasNumber && !el.dataset.counterObserved) {
                // Store original value for re-use on re-render
                if (!el.dataset.count) el.dataset.count = text;
                counterObserver.observe(el);
                el.dataset.counterObserved = 'true';
            }
        });
    }

    /* ─────────────────────────────────────────
       STAGGER CHILDREN UTILITY
    ───────────────────────────────────────── */
    const STAGGER_CONTAINER_SELECTORS = [
        '.dashboard-grid',
        '.stats-grid',
        '.cards-grid',
    ];

    function applyStagger(root = document) {
        if (isReducedMotion()) return;
        STAGGER_CONTAINER_SELECTORS.forEach(sel => {
            root.querySelectorAll(sel).forEach(container => {
                if (!container.classList.contains('stagger-children')) {
                    container.classList.add('stagger-children');
                }
            });
        });
    }

    /* ─────────────────────────────────────────
       MUTATION OBSERVER — watch for new DOM
    ───────────────────────────────────────── */
    function watchDOMChanges() {
        if (!('MutationObserver' in window)) return;

        const mutationObs = new MutationObserver(mutations => {
            if (isReducedMotion()) return;

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType !== Node.ELEMENT_NODE) return;
                    // Apply effects to newly added subtrees
                    attachRippleListeners(node);
                    observeRevealTargets(node);
                    observeCounters(node);
                    applyStagger(node);
                });
            });
        });

        mutationObs.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    /* ─────────────────────────────────────────
       INIT
    ───────────────────────────────────────── */
    function init() {
        // Always build observers/listeners regardless of current reduced-motion state
        // so that disabling reduced-motion at runtime (e.g. toggling body.reduced-motion
        // or changing the OS preference) takes effect immediately without a page reload.
        // Every individual callback already calls isReducedMotion() before acting.
        revealObserver = buildRevealObserver();
        counterObserver = buildCounterObserver();

        attachRippleListeners();
        observeRevealTargets();
        observeCounters();
        applyStagger();
        watchDOMChanges();

        // Re-run after tab switch events have settled (dynamic content)
        document.addEventListener('tabSwitched', () => {
            setTimeout(() => {
                observeRevealTargets();
                observeCounters();
                attachRippleListeners();
                applyStagger();
            }, 100);
        });

        // React to OS-level preference changes at runtime
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        motionQuery.addEventListener('change', () => {
            // Re-scan so newly eligible elements are observed when motion is re-enabled
            if (!isReducedMotion()) {
                observeRevealTargets();
                observeCounters();
                attachRippleListeners();
                applyStagger();
            }
        });
    }

    // Kick off after the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return { init, observeRevealTargets, observeCounters, attachRippleListeners };
})();
