(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const skills = ['Community outreach', 'Teaching', 'Healthcare', 'Fundraising', 'Administration', 'Communications', 'Logistics', 'IT and digital', 'Counselling', 'Event support', 'Other'];
    let csrf = '';
    let snapshot = null;
    $('year').textContent = new Date().getFullYear();
    skills.forEach(skill => {
        const col = document.createElement('div'); col.className = 'col-6 col-md-4'; const label = document.createElement('label'); label.className = 'form-check border rounded-3 p-2 ps-5 h-100'; const input = document.createElement('input'); input.type = 'checkbox'; input.className = 'form-check-input skill-check'; input.value = skill; input.id = 'skill-'+skill.toLowerCase().replace(/[^a-z0-9]+/g, '-'); const text = document.createElement('span'); text.className = 'small'; text.textContent = skill; label.htmlFor = input.id; label.append(input, text); col.append(label); $('skillsList').append(col);
    });
    function escapeText(value) {
        return String(value ?? '');
    }
    function showAlert(message, type = 'danger') {
        const el = $('globalAlert'); el.className = 'alert alert-'+type; el.textContent = message;
    }
    function hideAlert() {
        $('globalAlert').classList.add('d-none');
    }
    function statusBadge(status) {
        const s = document.createElement('span'); s.className = 'status '+String(status || 'pending').toLowerCase().replace(/[^a-z_]/g, ''); s.textContent = String(status || 'pending').replaceAll('_', ' '); return s;
    }
    function empty(message) {
        const el = document.createElement('div'); el.className = 'empty'; el.textContent = message; return el;
    }
    function addRecord(container, title, description, status, date, extra) {
        const row = document.createElement('div'); row.className = 'record'; const top = document.createElement('div'); top.className = 'd-flex flex-wrap justify-content-between align-items-start gap-2'; const left = document.createElement('div'); const h = document.createElement('div'); h.className = 'fw-bold'; h.textContent = title; const p = document.createElement('div'); p.className = 'small-muted mt-1'; p.textContent = description || ''; left.append(h, p); top.append(left, statusBadge(status)); row.append(top); if (date) {
            const d = document.createElement('div'); d.className = 'small-muted mt-2'; d.textContent = 'Submitted: '+new Date(date).toLocaleDateString(); row.append(d);
        } if (extra) {
            const x = document.createElement('p'); x.className = 'small mt-2 mb-0'; x.textContent = extra; row.append(x);
        } container.append(row);
    }
    function money(row) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: 'currency', currency: row.currency || 'UGX', maximumFractionDigits: 2
            }).format(Number(row.amount));
        } catch {
            return `${row.currency || 'UGX'} ${row.amount}`;
        }
    }
    async function api(path, options = {}) {
        const headers = {
            Accept: 'application/json',
            ...(options.body? {
                'Content-Type': 'application/json'
            }: {}),
            ...(options.method && options.method !== 'GET'? {
                'X-CSRF-Token': csrf
            }: {}),
            ...(options.headers || {})}; const response = await fetch(path, {
                credentials: 'same-origin', cache: 'no-store', ...options, headers
            }); const data = await response.json().catch(()=>({})); if (!response.ok) {
            const error = new Error(data.error || 'Request failed. Please try again.'); error.status = response.status; throw error;
        } return data;
    }
    async function load() {
        try {
            const me = await api('/auth/me'); if (!(me.roles || []).includes('public_user')) {
                location.replace('/'); return;
            } csrf = me.csrfToken || ''; $('csrfToken').value = csrf;
            const data = await api('/api/account/overview'); snapshot = data; csrf = data.csrfToken || csrf; $('csrfToken').value = csrf;
            const user = me.user || {}; const name = [user.firstName,
                user.lastName].filter(Boolean).join(' ') || 'Community Member'; $('fullName').textContent = name; $('email').textContent = user.email || 'Email not provided'; $('avatar').textContent = name.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'M';
            render(data); $('loading').classList.add('d-none'); $('dashboard').classList.remove('d-none');
        } catch(e) {
            if (e.status === 401 || e.status === 403) {
                location.replace('/'); return;
            } $('loading').classList.add('d-none'); showAlert(e.message || 'We could not load your account. Please try again.'); const b = document.createElement('button'); b.className = 'btn btn-outline-mercy btn-sm ms-2'; b.textContent = 'Try again'; b.onclick = ()=> {
                hideAlert(); $('loading').classList.remove('d-none'); load();
            }; $('globalAlert').append(' ', b);
        }
    }
    function render(data) {
        const p = data.profile || {}; ['phone',
            'location',
            'availability',
            'motivation'].forEach(key => $(key).value = p[key] || ''); $('interests').value = Array.isArray(p.interests)?p.interests.join(', '): ''; document.querySelectorAll('.skill-check').forEach(c => c.checked = Array.isArray(p.skills) && p.skills.includes(c.value));
        const verification = p.verification_status || 'Not submitted'; $('volunteerStatus').textContent = verification.replaceAll('_', ' '); $('verificationBadge').className = 'status '+(p.verification_status || 'pending'); $('verificationBadge').textContent = verification.replaceAll('_', ' '); if (p.review_note) {
            $('reviewNote').textContent = 'Foundation review note: '+p.review_note; $('reviewNote').classList.remove('d-none');
        } else $('reviewNote').classList.add('d-none');
        const programs = $('programList'); programs.replaceChildren(); if (!data.programs?.length) programs.append(empty('There are no open programs available for registration right now.')); else data.programs.forEach(program => {
            const card = document.createElement('div'); card.className = 'record'; const head = document.createElement('div'); head.className = 'd-flex flex-wrap justify-content-between gap-2'; const title = document.createElement('strong'); title.textContent = program.name; const btn = document.createElement('button'); btn.className = 'btn btn-sm btn-outline-mercy'; btn.textContent = 'Register'; btn.onclick = ()=>register(program.id, program.name, btn); head.append(title, btn); card.append(head); const desc = document.createElement('p'); desc.className = 'small-muted mt-2 mb-1'; desc.textContent = program.description || 'Learn more about this community initiative.'; card.append(desc); if (program.start_date || program.end_date) {
                const dates = document.createElement('div'); dates.className = 'small-muted'; dates.textContent = `Dates: ${program.start_date || 'To be announced'} – ${program.end_date || 'To be announced'}`; card.append(dates);
            }programs.append(card);
        });
        const regs = $('registrationList'); regs.replaceChildren(); if (!data.registrations?.length)regs.append(empty('Your program registrations will appear here.')); else data.registrations.forEach(r => {
            addRecord(regs, r.program_name, r.message, r.status, r.created_at); if (r.status === 'pending') {
                const b = document.createElement('button'); b.className = 'btn btn-sm btn-outline-secondary mb-3'; b.textContent = 'Withdraw request'; b.onclick = ()=>withdraw('registrations', r.id); regs.append(b);
            }});
        const apps = $('applicationList'); apps.replaceChildren(); if (!data.applications?.length)apps.append(empty('You have not submitted any applications yet.')); else data.applications.forEach(a => {
            addRecord(apps, a.title, a.application_type.replaceAll('_', ' '), a.status, a.created_at, a.staff_note?`Foundation update: ${a.staff_note}`: ''); if (['submitted', 'information_requested'].includes(a.status)) {
                const b = document.createElement('button'); b.className = 'btn btn-sm btn-outline-secondary mb-3'; b.textContent = 'Withdraw application'; b.onclick = ()=>withdraw('applications', a.id); apps.append(b);
            }});
        const donations = $('donationList'); donations.replaceChildren(); if (!data.donations?.length)donations.append(empty('No donations linked to this account email were found. If you donated using another email, contact the foundation for help.')); else data.donations.forEach(d => {
            const title = `${money(d)} · ${d.purpose || 'General support'}`; const ref = d.merchant_reference || 'Reference unavailable'; addRecord(donations, title, `Reference: ${ref}`, d.status, d.created_at, d.paid_at?`Payment date: ${new Date(d.paid_at).toLocaleDateString()}`: '');
        });
    }
    async function refresh() {
        hideAlert(); const data = await api('/api/account/overview'); snapshot = data; csrf = data.csrfToken || csrf; $('csrfToken').value = csrf; render(data);
    }
    async function register(id, name, button) {
        const message = prompt(`Optional message for your registration to “${name}”:`) || ''; button.disabled = true; try {
            await api('/api/account/registrations', {
                method: 'POST', body: JSON.stringify({
                    programId: id, message
                })}); showAlert('Your registration request has been submitted.', 'success'); await refresh();
        }catch(e) {
            showAlert(e.message);
        }finally {
            button.disabled = false;
        }}
    async function withdraw(type, id) {
        if (!confirm('Withdraw this request? This cannot be undone from your account.'))return; try {
            await api(`/api/account/${type}/${encodeURIComponent(id)}/withdraw`, {
                method: 'POST', body: JSON.stringify({})}); showAlert('Your request has been withdrawn.', 'success'); await refresh();
        }catch(e) {
            showAlert(e.message);
        }}
    $('volunteerForm').addEventListener('submit', async e=> {
        e.preventDefault(); const msg = $('profileMessage'); msg.textContent = 'Saving…'; const payload = {
            phone: $('phone').value, location: $('location').value, availability: $('availability').value, skills: [...document.querySelectorAll('.skill-check:checked')].map(x => x.value), interests: $('interests').value.split(',').map(x => x.trim()).filter(Boolean), motivation: $('motivation').value
        }; try {
            await api('/api/account/volunteer-profile', {
                method: 'PUT', body: JSON.stringify(payload)}); msg.textContent = 'Profile saved successfully.'; showAlert('Your volunteer profile has been saved.', 'success'); await refresh();
        }catch(err) {
            msg.textContent = ''; showAlert(err.message);
        }});
    $('applicationForm').addEventListener('submit', async e=> {
        e.preventDefault(); try {
            await api('/api/account/applications', {
                method: 'POST', body: JSON.stringify({
                    applicationType: $('applicationType').value, title: $('applicationTitle').value, message: $('applicationMessage').value
                })}); $('applicationForm').reset(); showAlert('Your application has been submitted for review.', 'success'); await refresh();
        }catch(err) {
            showAlert(err.message);
        }});
    $('logoutForm').addEventListener('submit', e=> {
        if (!csrf) {
            e.preventDefault(); showAlert('Your security token is unavailable. Reload the page before signing out.'); return;
        } $('logoutButton').disabled = true; $('logoutButton').textContent = 'Signing out…';
    });
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', ()=> {
        document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b === button)); document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('d-none', p.id !== `tab-${button.dataset.tab}`));
    }));
    load();
})();
