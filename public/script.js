// === Theme Management ===
const getSystemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const applyTheme = (theme) => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
};

// Initialize theme as soon as possible
const savedTheme = localStorage.getItem('theme');
applyTheme(savedTheme || getSystemTheme());

document.addEventListener('DOMContentLoaded', () => {
    // === Theme Toggle ===
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        const htmlElement = document.documentElement;

        const syncIcon = () => {
            if (htmlElement.getAttribute('data-theme') === 'dark') {
                themeIcon.className = 'ph-bold ph-sun';
            } else {
                themeIcon.className = 'ph-bold ph-moon';
            }
        };

        // Initialize icon
        syncIcon();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                if (newTheme === 'dark') htmlElement.setAttribute('data-theme', 'dark');
                else htmlElement.removeAttribute('data-theme');
                syncIcon();
            }
        });

        themeToggle.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            if (newTheme === 'dark') htmlElement.setAttribute('data-theme', 'dark');
            else htmlElement.removeAttribute('data-theme');

            localStorage.setItem('theme', newTheme);
            syncIcon();
        });
    }

    // === Sticky nav shadow ===
    const nav = document.getElementById('nav');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 10);
        });
    }

    // === Mobile menu ===
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const mobileMenuBackdrop = document.getElementById('mobile-menu-backdrop');

    if (mobileMenu && mobileMenuBtn) {
        function openMobileMenu() {
            mobileMenu.classList.add('open');
            document.body.style.overflow = 'hidden';
        }

        function closeMobileMenu() {
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        }

        mobileMenuBtn.addEventListener('click', openMobileMenu);
        if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
        if (mobileMenuBackdrop) mobileMenuBackdrop.addEventListener('click', closeMobileMenu);

        // Close menu when clicking a nav link
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    // === Tab switching ===
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.tab;

                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                tabPanels.forEach(panel => {
                    panel.classList.remove('active');
                    if (panel.id === `tab-${target}`) {
                        panel.classList.add('active');
                    }
                });
            });
        });
    }

    // === Scroll reveal ===
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        reveals.forEach(el => revealObserver.observe(el));
    }

    // === Floating CTA (show after scrolling past hero, hide near footer) ===
    const floatingCta = document.getElementById('floating-cta');
    const hero = document.querySelector('.hero-showcase');
    const footer = document.querySelector('.footer');

    if (floatingCta && hero) {
        let pastHero = false;
        let nearFooter = false;

        function updateFloatingCta() {
            floatingCta.classList.toggle('visible', pastHero && !nearFooter);
        }

        const heroObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                pastHero = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
                updateFloatingCta();
            });
        }, { threshold: 0 });

        const footerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                nearFooter = entry.isIntersecting;
                updateFloatingCta();
            });
        }, { threshold: 0 });

        heroObserver.observe(hero);
        if (footer) footerObserver.observe(footer);
    }

    // === Billing toggle ===
    const billingToggle = document.getElementById('billing-toggle');
    const labelMonthly = document.getElementById('label-monthly');
    const labelYearly = document.getElementById('label-yearly');
    const proPrice = document.getElementById('pro-price');
    const proPeriod = document.getElementById('pro-period');
    const proYearlyNote = document.getElementById('pro-yearly-note');
    window.billingIsYearly = false; // Expose globally for checkout

    if (billingToggle) {
        billingToggle.addEventListener('click', () => {
            window.billingIsYearly = !window.billingIsYearly;
            billingToggle.classList.toggle('yearly', window.billingIsYearly);
            if (labelMonthly) labelMonthly.classList.toggle('active-label', !window.billingIsYearly);
            if (labelYearly) labelYearly.classList.toggle('active-label', window.billingIsYearly);

            if (window.billingIsYearly) {
                if (proPrice) proPrice.textContent = '₹899';
                if (proPeriod) proPeriod.textContent = '/year';
                if (proYearlyNote) proYearlyNote.textContent = 'That\'s just ₹75/month';
            } else {
                if (proPrice) proPrice.textContent = '₹99';
                if (proPeriod) proPeriod.textContent = '/month';
                if (proYearlyNote) proYearlyNote.innerHTML = '&nbsp;';
            }
        });
    }

    // === Capability items → scroll to features tab ===
    document.querySelectorAll('.capability-item[data-tab-target]').forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.dataset.tabTarget;

            // Switch to the correct tab
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            const matchingBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
            const matchingPanel = document.getElementById(`tab-${targetTab}`);
            if (matchingBtn) matchingBtn.classList.add('active');
            if (matchingPanel) matchingPanel.classList.add('active');

            // Scroll to features section
            const featuresSection = document.getElementById('features');
            if (featuresSection) featuresSection.scrollIntoView({ block: 'start' });
        });
    });

    // (Waitlist logic removed)


});
