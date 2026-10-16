(() => {
    const grid = document.getElementById('children-grid');
    const search = document.getElementById('child-search');
    const currency = document.getElementById('currency-filter');
    const count = document.getElementById('results-count');
    const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
        let profiles = [];
        const money = (amount, code) => new Intl.NumberFormat(code === 'UGX' ? 'en-UG' : 'en-US', {style: 'currency', currency: code, maximumFractionDigits: code === 'UGX' ? 0: 2}).format(Number(amount));
        function card(child) {
        const safePhoto = typeof child.photo_url === 'string' && /^https:\/\//i.test(child.photo_url) ? child.photo_url: '';
        const art = safePhoto ? `<img src="${esc(safePhoto)}" alt="" loading="lazy" referrerpolicy="no-referrer">`: `<div class="child-avatar" aria-hidden="true">${esc((child.display_name || 'Child').trim().charAt(0).toUpperCase())}</div>`;
        const query = new URLSearchParams( {
            purpose: 'children', child: child.id
        });
        return `<div class="col-md-6 col-lg-4"><article class="child-card"><div class="child-art">${art}</div><div class="child-body"><div class="d-flex flex-wrap gap-2 mb-3"><span class="badge rounded-pill text-bg-light border">${esc(child.age_band || 'School age')}</span><span class="badge rounded-pill text-bg-light border">${esc(child.region_label || 'Uganda')}</span></div><h3 class="child-name">${esc(child.display_name)}</h3><div class="meta mb-3">${esc(child.education_level || 'Education and wellbeing support')}</div><p class="story">${esc(child.story)}</p><div class="support-line"><div class="amount">${money(child.sponsorship_amount, child.currency)}<small>Suggested support amount</small></div><a class="btn btn-gom" href="/donate?${query.toString()}" aria-label="Sponsor ${esc(child.display_name)}">Sponsor <span aria-hidden="true">→</span></a></div></div></article></div>`;
        }
        function render() {
        const term = search.value.trim().toLowerCase();
        const selectedCurrency = currency.value;
        const visible = profiles.filter(child => (selectedCurrency === 'all' || child.currency === selectedCurrency) && [child.display_name, child.age_band, child.region_label, child.education_level, child.story].some(value => String(value || '').toLowerCase().includes(term)));
        count.textContent = `${visible.length} ${visible.length === 1 ? 'profile': 'profiles'}`;
        if (!visible.length) {
            grid.innerHTML = `<div class="col-12"><div class="empty-state"><div class="display-5 mb-3" aria-hidden="true">🌱</div><h3 class="h4 fw-bold">${profiles.length ? 'No profiles match those filters': 'New sponsorship profiles are being prepared'}</h3><p class="intro-copy mx-auto" style="max-width:580px">${profiles.length ? 'Try another search term or currency.': 'We only publish profiles after the appropriate consent and safeguarding checks. Please check back soon, or contact our team to discuss current sponsorship opportunities.'}</p><div class="d-flex justify-content-center flex-wrap gap-2">${profiles.length ? '<button class="btn btn-outline-success rounded-pill px-4" id="clear-filters">Clear filters</button>': '<a class="btn btn-gom" href="/contact">Contact our team</a>'}</div></div></div>`;
            document.getElementById('clear-filters')?.addEventListener('click', () => {
                search.value = ''; currency.value = 'all'; render();
            });
            return;
        }
        grid.innerHTML = visible.map(card).join('');
        }
        search.addEventListener('input', render);
        currency.addEventListener('change', render);
        document.getElementById('year').textContent = new Date().getFullYear();
        fetch('/api/sponsorship/children', {headers: {
            Accept: 'application/json'
        },
        cache: 'no-store'})
        .then(response => {if (!response.ok) throw new Error('Unable to load profiles'); return response.json(); })
        .then(data => {profiles = Array.isArray(data.children) ? data.children: []; render(); })
        .catch(() => {count.textContent = 'Profiles unavailable'; grid.innerHTML = '<div class="col-12"><div class="empty-state"><h3 class="h4 fw-bold">We could not load sponsorship profiles</h3><p class="intro-copy mx-auto" style="max-width:560px">Please try again in a moment, or contact our team and we will help you explore sponsorship opportunities.</p><a class="btn btn-gom" href="/contact">Contact our team</a> <button class="btn btn-outline-success rounded-pill px-4" id="retry-load">Try again</button></div></div>'; document.getElementById('retry-load')?.addEventListener('click', ()=>window.location.reload()); });
        })();
