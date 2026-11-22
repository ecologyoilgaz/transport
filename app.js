let OBJECTS = {}, filtered = [], currentPage = 1;
const PER_PAGE = 12;

async function loadData() {
  try {
    const res = await fetch('objects.json');
    if (!res.ok) throw new Error('objects.json not found');
    const data = await res.json();
    OBJECTS = data.objects || data;
    filtered = Object.entries(OBJECTS).map(([id, o]) => ({ id, ...o }));
    renderStats();
    renderCards();
  } catch (e) {
    console.error(e);
    const cards = document.getElementById('cards');
    if (cards) cards.innerHTML = '<p style="color:red">Error loading data</p>';
  }
}

function renderStats() {
  const el = document.getElementById('stats');
  if (!el) return;
  const total = filtered.length;
  const red = filtered.filter(o => o.status === 'red').length;
  const green = filtered.filter(o => o.status === 'green').length;
  const loss = filtered.reduce((s, o) => s + (o.financial_impact?.loss_usd || 0), 0);
  el.innerHTML = `
    <div class="stat"><span class="num">${total}</span><span class="label">Objects</span></div>
    <div class="stat"><span class="num" style="color:var(--red)">${red}</span><span class="label">Gaps</span></div>
    <div class="stat loss-icon"><span class="num" style="color:var(--red);font-size:20px;">${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(loss)}</span><span class="label">Est. Loss</span></div>
    <div class="stat"><span class="num" style="color:var(--green)">${green}</span><span class="label">Verified</span></div>
  `;
}

function renderCards() {
  const el = document.getElementById('cards');
  if (!el) return;
  const start = (currentPage - 1) * PER_PAGE;
  const items = filtered.slice(start, start + PER_PAGE);
  el.innerHTML = items.map(o => {
    let price = '';
    if (o.financial_impact?.loss_usd) {
      const usd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(o.financial_impact.loss_usd);
      price = `<div class="card-meta" style="color:var(--red);font-weight:bold;margin-top:6px;">Loss: ${usd}</div>`;
    }
    return `<a href="object.html?id=${o.id}" class="card ${o.status}">
      <div class="card-title">${o.title}</div>
      <div class="card-meta"><strong>Claimed:</strong> ${o.claimed}</div>
      <div class="card-meta"><strong>Actual:</strong> ${o.actual}</div>
      ${price}
      <div class="card-country">${o.country} · ${o.region}</div>
    </a>`;
  }).join('');
  renderPagination();
}

function renderPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  const pages = Math.ceil(filtered.length / PER_PAGE);
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  el.innerHTML = html;
}

function goPage(p) { currentPage = p; renderCards(); window.scrollTo({top: 0, behavior: 'smooth'}); }

function applyFilters() {
  const status = document.getElementById('filter-status')?.value || '';
  const region = document.getElementById('filter-region')?.value || '';
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase();
  filtered = Object.entries(OBJECTS).map(([id, o]) => ({ id, ...o })).filter(o => {
    if (status && o.status !== status) return false;
    if (region && o.region !== region) return false;
    if (search && !`${o.title} ${o.country}`.toLowerCase().includes(search)) return false;
    return true;
  });
  currentPage = 1;
  renderStats();
  renderCards();
}

function renderMap() {
  if (typeof L === 'undefined' || !document.getElementById('map')) return;
  const map = L.map('map').setView([25, 15], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {attribution:'© OpenStreetMap'}).addTo(map);
  Object.entries(OBJECTS).forEach(([id, o]) => {
    const color = o.status === 'red' ? '#E85D3A' : o.status === 'green' ? '#4DD8A0' : '#7A8A9A';
    L.circleMarker([o.lat || 0, o.lon || 0], {radius: 8, color: color, fillOpacity: 0.8, weight: 2})
      .addTo(map)
      .bindPopup(`<b>${o.title}</b><br>${o.country}<br><a href="object.html?id=${id}">Details →</a>`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  ['filter-status','filter-region','filter-search'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });
});
