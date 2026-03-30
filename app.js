/* ========================================
   FROMINVEST AG – Dynamic Application Engine
   v2 – High-Conversion Upgrade
   ======================================== */

// ─── FALLBACK DATA ───────────────────────────────────────────────────────────
const FALLBACK_DATA = {
    "last_updated": "2026-03-27",
    "site_config": {
        "company_name": "Frominvest AG",
        "company_location": "Küsnacht, Schweiz",
        "founded_year": 2012,
        "user_count": 12400,
        "default_currency": "EUR",
        "default_country": "all"
    },
    "table_filters": ["Alle", "Deutschland", "Schweiz", "Österreich"],
    "offers": [
        { "id": "erste-at-36", "bank_name": "Erste Bank", "country": "Austria", "interest_rate": 3.40, "duration_months": 36, "minimum_investment": 25000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 14, "cta_link": "#email-form" },
        { "id": "commerzbank-36", "bank_name": "Commerzbank", "country": "Germany", "interest_rate": 3.30, "duration_months": 36, "minimum_investment": 10000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 9, "cta_link": "#email-form" },
        { "id": "erste-at-12", "bank_name": "Erste Bank", "country": "Austria", "interest_rate": 3.15, "duration_months": 12, "minimum_investment": 10000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 11, "cta_link": "#email-form" },
        { "id": "ing-de-12", "bank_name": "ING Deutschland", "country": "Germany", "interest_rate": 3.10, "duration_months": 12, "minimum_investment": 10000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 22, "cta_link": "#email-form" },
        { "id": "commerzbank-12", "bank_name": "Commerzbank", "country": "Germany", "interest_rate": 3.05, "duration_months": 12, "minimum_investment": 5000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 7, "cta_link": "#email-form" },
        { "id": "zkb-ch-36", "bank_name": "Zürcher Kantonalbank", "country": "Switzerland", "interest_rate": 3.00, "duration_months": 36, "minimum_investment": 20000, "currency": "CHF", "risk_level": "low", "highlight_tag": "", "viewers": 5, "cta_link": "#email-form" },
        { "id": "sparkasse-24", "bank_name": "Sparkasse", "country": "Germany", "interest_rate": 3.00, "duration_months": 24, "minimum_investment": 10000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 8, "cta_link": "#email-form" },
        { "id": "deutsche-bank-24", "bank_name": "Deutsche Bank", "country": "Germany", "interest_rate": 2.95, "duration_months": 24, "minimum_investment": 25000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 4, "cta_link": "#email-form" },
        { "id": "raiffeisen-at-24", "bank_name": "Raiffeisenbank Österreich", "country": "Austria", "interest_rate": 2.90, "duration_months": 24, "minimum_investment": 15000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 6, "cta_link": "#email-form" },
        { "id": "ubs-ch-24", "bank_name": "UBS Schweiz", "country": "Switzerland", "interest_rate": 2.85, "duration_months": 24, "minimum_investment": 25000, "currency": "CHF", "risk_level": "low", "highlight_tag": "", "viewers": 18, "cta_link": "#email-form" },
        { "id": "sparkasse-12", "bank_name": "Sparkasse", "country": "Germany", "interest_rate": 2.80, "duration_months": 12, "minimum_investment": 5000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 3, "cta_link": "#email-form" },
        { "id": "bawag-at-12", "bank_name": "BAWAG P.S.K.", "country": "Austria", "interest_rate": 2.75, "duration_months": 12, "minimum_investment": 5000, "currency": "EUR", "risk_level": "low", "highlight_tag": "", "viewers": 2, "cta_link": "#email-form" },
        { "id": "postfinance-ch-24", "bank_name": "PostFinance", "country": "Switzerland", "interest_rate": 2.70, "duration_months": 24, "minimum_investment": 10000, "currency": "CHF", "risk_level": "low", "highlight_tag": "", "viewers": 4, "cta_link": "#email-form" },
        { "id": "zkb-ch-12", "bank_name": "Zürcher Kantonalbank", "country": "Switzerland", "interest_rate": 2.65, "duration_months": 12, "minimum_investment": 10000, "currency": "CHF", "risk_level": "low", "highlight_tag": "", "viewers": 3, "cta_link": "#email-form" },
        { "id": "raiffeisen-ch-12", "bank_name": "Raiffeisen Schweiz", "country": "Switzerland", "interest_rate": 2.55, "duration_months": 12, "minimum_investment": 5000, "currency": "CHF", "risk_level": "low", "highlight_tag": "", "viewers": 2, "cta_link": "#email-form" }
    ]
};

// ─── DATASTORE ────────────────────────────────────────────────────────────────
const DataStore = {
    data: null,

    // TOP OFFER ALGORITHM
    // Score = (interest_rate × 0.5) + (duration_score × 0.2) + (investment_score × 0.2) + (random_boost × 0.1)
    calculateScore(offer, maxInvestment, minInvestment) {
        const interestScore = offer.interest_rate * 0.5;

        const durationMap = { 6: 1, 12: 2, 24: 3, 36: 4 };
        const durationScore = (durationMap[offer.duration_months] || 2) * 0.2;

        // Normalize: lower investment → higher score (range 0–1)
        const investmentRange = maxInvestment - minInvestment || 1;
        const investmentScore = ((maxInvestment - offer.minimum_investment) / investmentRange) * 0.2;

        const randomBoost = (Math.random() * 0.5) * 0.1;

        return interestScore + durationScore + investmentScore + randomBoost;
    },

    applyTopOfferAlgorithm() {
        if (!this.data || this.data.offers.length === 0) return;

        const allOffers = this.data.offers;
        const maxInvestment = Math.max(...allOffers.map(o => o.minimum_investment));
        const minInvestment = Math.min(...allOffers.map(o => o.minimum_investment));

        // Score every offer
        allOffers.forEach(o => {
            o._score = this.calculateScore(o, maxInvestment, minInvestment);
            o.highlight_tag = ''; // reset all tags
        });

        // Sort by score descending
        allOffers.sort((a, b) => b._score - a._score);

        // Assign badges: #1 = Top Angebot, #2 = Empfohlen, #3 = Beliebt
        allOffers[0].highlight_tag = 'Top Angebot';
        if (allOffers[1]) allOffers[1].highlight_tag = 'Empfohlen';
        if (allOffers[2]) allOffers[2].highlight_tag = 'Beliebt';
    },

    async init() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error("Fetch failed");
            this.data = await response.json();
            console.log("✅ Loaded data.json dynamically");
        } catch (e) {
            console.warn("⚠️ Could not fetch data.json (CORS on file://). Using fallback.");
            this.data = FALLBACK_DATA;
        }

        this.applyTopOfferAlgorithm();
    },

    getOffers(country = "Alle") {
        if (!this.data) return [];
        const all = this.data.offers;
        if (country === "Alle") return all;
        return all.filter(o => {
            if (country === "Deutschland") return o.country === "Germany";
            if (country === "Schweiz")     return o.country === "Switzerland";
            if (country === "Österreich")  return o.country === "Austria";
            return true;
        });
    },

    getMaxRate() {
        if (!this.data || this.data.offers.length === 0) return "0.00";
        const max = Math.max(...this.data.offers.map(o => o.interest_rate));
        return max.toFixed(2);
    },

    getConfig() {
        return this.data ? this.data.site_config : {};
    },

    getLastUpdated() {
        if (!this.data) return "";
        const parts = this.data.last_updated.split('-');
        if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
        return this.data.last_updated;
    }
};

// ─── GEO ADAPTER ─────────────────────────────────────────────────────────────
const GeoAdapter = {
    userCountry: "Deutschland",
    init() {
        const lang = navigator.language || navigator.userLanguage || '';
        if (lang.includes('CH'))      this.userCountry = "Schweiz";
        else if (lang.includes('AT')) this.userCountry = "Österreich";
        else                          this.userCountry = "Deutschland";

        const badgeText = document.getElementById('hero-badge-text');
        if (badgeText) {
            if (this.userCountry === "Schweiz")       badgeText.textContent = "Schweizer Qualität. Seit 2012.";
            else if (this.userCountry === "Österreich") badgeText.textContent = "Für österreichische Anleger geprüft.";
            else                                       badgeText.textContent = "Für deutsche Anleger geprüft.";
        }
    },
    formatCurrency(amount, currency) {
        return new Intl.NumberFormat(currency === 'CHF' ? 'de-CH' : 'de-DE', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    }
};

// ─── BANK LOGOS MAPPING ───────────────────────────────────────────────────────────
const BankLogos = {
    "Erste Bank": "https://www.google.com/s2/favicons?domain=erstebank.at&sz=128",
    "Commerzbank": "https://www.google.com/s2/favicons?domain=commerzbank.de&sz=128",
    "ING Deutschland": "https://www.google.com/s2/favicons?domain=ing.de&sz=128",
    "Zürcher Kantonalbank": "https://en.wikipedia.org/wiki/Special:FilePath/Z%C3%BCrcher_Kantonalbank_logo.svg?width=512",
    "Sparkasse": "https://www.google.com/s2/favicons?domain=sparkasse.de&sz=128",
    "Deutsche Bank": "https://www.google.com/s2/favicons?domain=deutsche-bank.de&sz=128",
    "Raiffeisenbank Österreich": "https://www.google.com/s2/favicons?domain=raiffeisen.at&sz=128",
    "UBS Schweiz": "https://www.google.com/s2/favicons?domain=ubs.com&sz=128",
    "BAWAG P.S.K.": "https://en.wikipedia.org/wiki/Special:FilePath/BAWAG_P.S.K._logo.svg?width=512",
    "PostFinance": "https://www.google.com/s2/favicons?domain=postfinance.ch&sz=128",
    "Raiffeisen Schweiz": "https://www.google.com/s2/favicons?domain=raiffeisen.ch&sz=128",
    "Credit Suisse": "https://www.google.com/s2/favicons?domain=credit-suisse.com&sz=128"
};

// ─── TABLE ENGINE ─────────────────────────────────────────────────────────────
const TableEngine = {
    currentFilter: "Alle",

    init() {
        this.renderFilters();
        this.renderTable(this.currentFilter);
    },

    renderFilters() {
        const filterContainer = document.getElementById('table-filters');
        if (!filterContainer) return;

        filterContainer.innerHTML = '';
        const filters = (DataStore.data && DataStore.data.table_filters) ||
                        ["Alle", "Deutschland", "Schweiz", "Österreich"];

        filters.forEach(f => {
            const btn = document.createElement('button');
            btn.className = `filter-tab ${f === this.currentFilter ? 'active' : ''}`;
            btn.textContent = f;
            btn.dataset.country = f;
            btn.onclick = () => {
                document.querySelectorAll('.filter-tab').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = f;
                this.renderTable(f);
            };
            filterContainer.appendChild(btn);
        });
    },

    renderTable(country) {
        const tbody = document.getElementById('table-body');
        if (!tbody) return;

        const offers = DataStore.getOffers(country);
        tbody.innerHTML = '';

        if (offers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#8a94a3;">Keine Angebote für diese Region gefunden.</td></tr>`;
            return;
        }

        offers.forEach((o, index) => {
            const isTop = o.highlight_tag === 'Top Angebot';
            const rowClass = isTop ? 'table-row top-offer-row' : 'table-row';
            const avatarClass = isTop ? 'bank-avatar best' : 'bank-avatar';
            const rateClass = isTop ? 'rate-badge best rate-large' : 'rate-badge rate-large';
            const avatarText = o.bank_name.substring(0, 2).toUpperCase();
            
            const avatarContent = BankLogos[o.bank_name] 
                ? `<img src="${BankLogos[o.bank_name]}" alt="${o.bank_name}" onerror="this.onerror=null; this.parentElement.innerHTML='${avatarText}';">`
                : avatarText;

            // Badge HTML
            let badgeHTML = '';
            if (isTop) {
                badgeHTML = `<span class="best-badge badge-top">⭐ Top Angebot</span>`;
            } else if (o.highlight_tag === 'Empfohlen') {
                badgeHTML = `<span class="best-badge badge-empfohlen">Empfohlen</span>`;
            } else if (o.highlight_tag === 'Beliebt') {
                badgeHTML = `<span class="best-badge badge-popular">Beliebt</span>`;
            }

            // Popular note for top 3
            const popularNote = (index < 3) ? `<span class="popular-note">★ Beliebte Wahl bei Anlegern</span>` : '';

            // CTA: Top offer gets premium strong green button
            const ctaClass = isTop ? 'btn-cta-strong' : 'btn btn-table';
            const ctaText = isTop ? 'Jetzt sichern →' : 'Angebot ansehen';

            const tr = document.createElement('tr');
            tr.className = rowClass;
            tr.innerHTML = `
                <td data-label="Bank">
                    <div class="bank-name-cell">
                        <div class="${avatarClass}">${avatarContent}</div>
                        <div class="bank-name-text">
                            <span class="bank-name-main">${o.bank_name}</span>
                            ${badgeHTML}
                            ${popularNote}
                        </div>
                    </div>
                </td>
                <td data-label="Zinssatz p.a."><span class="${rateClass}">${o.interest_rate.toFixed(2)}%</span></td>
                <td><span class="duration-text">${o.duration_months} Monate</span></td>
                <td><span class="investment-text">${GeoAdapter.formatCurrency(o.minimum_investment, o.currency)}</span></td>
                <td>
                    <div class="cta-cell">
                        <a href="${o.cta_link}" class="${ctaClass}">${ctaText}</a>
                        ${o.viewers ? `<span class="viewer-badge"><span class="viewer-dot"></span>${o.viewers} sehen dies</span>` : ''}
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // CSS handles hover states smoothly without triggering layout overflows.
    }
};

// ─── RATE SYNC ────────────────────────────────────────────────────────────────
const RateSync = {
    init() {
        const maxRate = DataStore.getMaxRate();
        document.querySelectorAll('[data-dynamic="max_rate"]').forEach(el => {
            el.textContent = `${maxRate}%`;
        });

        const bankCountEl = document.getElementById('dynamic-bank-count');
        if (bankCountEl && DataStore.data) {
            bankCountEl.textContent = DataStore.data.offers.length + "+";
        }
    }
};

// ─── CALCULATOR ───────────────────────────────────────────────────────────────
const Calculator = {
    init() {
        const invInput  = document.getElementById('calc-investment');
        const invSlider = document.getElementById('calc-investment-slider');
        const durSelect = document.getElementById('calc-duration');
        if (!invInput || !durSelect) return;

        const syncValues = (e) => {
            if (e.target.id === 'calc-investment-slider') invInput.value = invSlider.value;
            else invSlider.value = invInput.value;
            this.calculate();
        };

        invInput.addEventListener('input', syncValues);
        invSlider.addEventListener('input', syncValues);
        durSelect.addEventListener('change', () => this.calculate());
        this.calculate();
    },

    calculate() {
        const invInput   = document.getElementById('calc-investment');
        const durSelect  = document.getElementById('calc-duration');
        const valOutput  = document.getElementById('calc-output-val');
        const rateDisplay = document.getElementById('calc-applied-rate');
        const profitEl   = document.getElementById('calc-profit');
        if (!invInput || !durSelect || !valOutput) return;

        const amount   = parseFloat(invInput.value) || 0;
        const duration = parseInt(durSelect.value)  || 12;

        // Smart: prefer the Top Angebot's rate for the selected duration,
        // then best available rate, then global max as fallback.
        const topOffer = DataStore.data && DataStore.data.offers ? DataStore.data.offers[0] : null;
        const offers  = DataStore.getOffers("Alle");
        const matching = offers.filter(o => o.duration_months === duration);

        let bestRate;
        if (topOffer && topOffer.duration_months === duration) {
            // Calculator aligned with Top Angebot
            bestRate = topOffer.interest_rate;
        } else if (matching.length > 0) {
            bestRate = Math.max(...matching.map(o => o.interest_rate));
        } else {
            bestRate = parseFloat(DataStore.getMaxRate());
        }

        if (rateDisplay) rateDisplay.textContent = `${bestRate.toFixed(2)}% p.a.`;

        const estimatedReturn = amount * (bestRate / 100) * (duration / 12);
        const currency = GeoAdapter.userCountry === "Schweiz" ? "CHF" : "EUR";

        valOutput.textContent = GeoAdapter.formatCurrency(estimatedReturn + amount, currency);
        if (profitEl) profitEl.textContent = `Davon Zinsertrag: ${GeoAdapter.formatCurrency(estimatedReturn, currency)}`;
    }
};

// ─── CTA PERSONALIZER + STICKY BAR ───────────────────────────────────────────
const CTAPersonalizer = {
    stickyShown: false,

    init() {
        const cta = document.getElementById('cta-primary');
        const hasVisited = localStorage.getItem('hasVisited_festgeld');
        
        if (hasVisited && cta) {
            cta.textContent = "Top Angebot sichern";
        } else {
            localStorage.setItem('hasVisited_festgeld', 'true');
        }

        const stickyBar  = document.getElementById('sticky-cta-bar');
        const stickyBtn  = document.getElementById('sticky-cta-btn');
        const stickyLogo = document.getElementById('sticky-cta-logo');
        const stickyTitle = document.getElementById('sticky-cta-title');
        const stickyClose = document.getElementById('sticky-cta-close');

        if (stickyClose) {
            stickyClose.addEventListener('click', () => {
                stickyBar.classList.remove('visible');
                this.stickyShown = true; // prevent re-showing after manual close until reload
            });
        }

        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

            // Update hero CTA text
            if (cta) {
                if (scrollPercent > 50)     cta.textContent = "Kostenlose Angebote erhalten";
                else if (hasVisited)        cta.textContent = "Top Angebot sichern";
                else                        cta.textContent = "Jetzt vergleichen";
            }

            // Show sticky bar after 55% scroll
            if (stickyBar && !this.stickyShown) {
                if (scrollPercent > 55) {
                    const topOffer = DataStore.data && DataStore.data.offers ? DataStore.data.offers[0] : null;
                    if (topOffer) {
                        stickyBar.classList.add('visible');
                        if (stickyLogo) {
                            if (BankLogos[topOffer.bank_name]) {
                                stickyLogo.innerHTML = `<img src="${BankLogos[topOffer.bank_name]}" alt="${topOffer.bank_name}" onerror="this.onerror=null; this.innerHTML='${topOffer.bank_name.substring(0, 2).toUpperCase()}';">`;
                            } else {
                                stickyLogo.textContent = topOffer.bank_name.substring(0, 2).toUpperCase();
                            }
                        }
                        if (stickyTitle) stickyTitle.textContent = topOffer.bank_name;
                        const subtitleEl = document.getElementById('sticky-cta-subtitle');
                        if (subtitleEl) subtitleEl.textContent = `${topOffer.interest_rate.toFixed(2)}% p.a. – Bestes Angebot`;
                        if (stickyBtn) stickyBtn.textContent = 'Jetzt Top-Zinsen sichern';
                    }
                } else {
                    stickyBar.classList.remove('visible');
                }
            }
        }, { passive: true });
    }
};

// ─── TRUST DYNAMICS ──────────────────────────────────────────────────────────
const TrustDynamics = {
    init() {
        const dsDate = DataStore.getLastUpdated();

        const tDisclaimer = document.getElementById('table-disclaimer');
        if (tDisclaimer) {
            tDisclaimer.innerHTML = `Alle Angaben ohne Gewähr. Zinssätze können sich jederzeit ändern. &nbsp;|&nbsp; <strong>Zuletzt aktualisiert: ${dsDate}</strong>`;
        }

        const fUpdated = document.getElementById('footer-last-updated');
        if (fUpdated) fUpdated.textContent = dsDate;

        const config = DataStore.getConfig();
        if (config.user_count) {
            const numStr = config.user_count.toLocaleString('de-DE');
            document.querySelectorAll('[data-dynamic="user_count"]').forEach(el => el.textContent = numStr);
        }

        // Viewer drift
        setInterval(() => {
            document.querySelectorAll('.viewer-badge').forEach(badge => {
                const text = badge.lastChild && badge.lastChild.textContent;
                if (!text) return;
                const match = text.match(/\d+/);
                if (match) {
                    let num = parseInt(match[0]) + Math.floor(Math.random() * 3) - 1;
                    if (num < 2) num = 2;
                    badge.lastChild.textContent = ` ${num} sehen dies`;
                }
            });
        }, 6000);
    }
};

// ─── UI CONTROLLER ───────────────────────────────────────────────────────────
const UIController = {
    init() {
        const navbar = document.getElementById('navbar');

        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });

        // Scroll animations
        const elements = document.querySelectorAll(
            '.email-card, .step-card, .vorteil-card, .trust-stat-card, .trust-item, .section-header, .calc-card'
        );
        elements.forEach(el => {
            el.classList.add('animate-on-scroll');
            const parent = el.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(c => c.classList.contains('animate-on-scroll'));
                const idx = siblings.indexOf(el);
                if (idx >= 0) el.setAttribute('data-delay', Math.min(idx + 1, 5));
            }
        });

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        elements.forEach(el => observer.observe(el));

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    window.scrollTo({
                        top: target.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight - 16,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Stat counter entrance
        setTimeout(() => {
            const stats = document.querySelectorAll('.stat-number');
            stats.forEach(s => { s.style.opacity = '0'; s.style.transform = 'translateY(10px)'; s.style.transition = 'opacity .5s ease, transform .5s ease'; });
            setTimeout(() => {
                stats.forEach((s, i) => setTimeout(() => { s.style.opacity = '1'; s.style.transform = ''; }, i * 150));
            }, 600);
        }, 100);
    }
};

// ─── EMAIL FORM ───────────────────────────────────────────────────────────────
window.handleEmailSubmit = async function (event, formType) {
    event.preventDefault();
    const form = event.target;
    
    // Select inputs based on form type (primary or secondary)
    const firstName = form.querySelector(formType === 'primary' ? '#first-name-primary' : '#first-name-secondary');
    const lastName = form.querySelector(formType === 'primary' ? '#last-name-primary' : '#last-name-secondary');
    const email = form.querySelector(formType === 'primary' ? '#email-input-primary' : '#email-input-secondary');
    const phone = form.querySelector(formType === 'primary' ? '#phone-input-primary' : '#phone-input-secondary');
    
    const successEl = document.getElementById(`email-success-${formType}`);
    const submitBtn = form.querySelector('.btn-form');

    // Validation
    const inputs = [firstName, lastName, email, phone];
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input || !input.value || !input.validity.valid) {
            if (input) {
                input.style.borderColor = '#c53030';
                input.style.boxShadow = '0 0 0 3px rgba(197,48,48,.1)';
                setTimeout(() => { input.style.borderColor = ''; input.style.boxShadow = ''; }, 2000);
            }
            isValid = false;
        }
    });

    if (!isValid) return;

    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Wird gesendet...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.7';

    try {
        const response = await fetch('/api/lead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                firstName: firstName.value,
                lastName: lastName.value,
                email: email.value, 
                phone: phone.value 
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Success case
            successEl.classList.add('show');
            inputs.forEach(input => input.value = ''); // Clear all inputs
            
            submitBtn.textContent = 'Gesendet ✓';
            submitBtn.style.background = '#27ae60';
            submitBtn.style.opacity = '1';

            setTimeout(() => {
                successEl.classList.remove('show');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 5000);
        } else {
            // Server-side validation or error case
            throw new Error(result.message || 'Ein Fehler ist aufgetreten.');
        }
    } catch (error) {
        console.error('❌ Lead processing error:', error);
        submitBtn.textContent = 'Fehler! Nochmal...';
        submitBtn.style.background = '#e74c3c';
        submitBtn.style.opacity = '1';
        
        alert(error.message || 'Verbindung zum Server fehlgeschlagen. Bitte versuchen Sie es später erneut.');

        setTimeout(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
        }, 3000);
    }
};

// ─── COOKIE MANAGER ───────────────────────────────────────────────────────────
const CookieManager = {
    init() {
        const consent = localStorage.getItem('cookie_consent');
        const banner = document.getElementById('cookie-consent');
        const btn = document.getElementById('btn-accept-cookies');
        
        if (!consent && banner) {
            setTimeout(() => {
                banner.classList.add('visible');
            }, 1000);
            
            if (btn) {
                btn.addEventListener('click', () => {
                    localStorage.setItem('cookie_consent', 'true');
                    banner.classList.remove('visible');
                });
            }
        }
    }
};

// ─── BOOT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await DataStore.init();
    GeoAdapter.init();
    TableEngine.init();
    RateSync.init();
    Calculator.init();
    CTAPersonalizer.init();
    TrustDynamics.init();
    UIController.init();
    CookieManager.init();
});
