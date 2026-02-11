let allProducts = [];

// ====== SCROLL LOCK (NO BACKGROUND SCROLL) ======
let scrollPos = 0;

function lockBodyScroll() {
  scrollPos = window.scrollY || window.pageYOffset;

  document.body.classList.add('modal-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPos}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
}

function unlockBodyScroll() {
  document.body.classList.remove('modal-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';

  window.scrollTo(0, scrollPos);
}

// iOS/webview: чтобы при свайпе внутри модалки не двигался фон
function preventTouchMove(e) {
  const modalContent = document.querySelector('.modal-content');
  if (!modalContent) return;

  // разрешаем скролл только внутри .modal-content
  if (!modalContent.contains(e.target)) {
    e.preventDefault();
  }
}

function enableTouchLock() {
  document.addEventListener('touchmove', preventTouchMove, { passive: false });
}
function disableTouchLock() {
  document.removeEventListener('touchmove', preventTouchMove, { passive: false });
}

// ====== LOAD PRODUCTS ======
fetch('products.json')
  .then(res => res.json())
  .then(items => {
    allProducts = items;
    renderProducts(items);
    setupFilters();
  })
  .catch(err => console.error(err));

function renderProducts(items) {
  const grid = document.getElementById('products');
  grid.innerHTML = '';

  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';

    const soldBadge = item.sold
      ? `<div class="sold-badge">SOLD OUT</div>`
      : '';

    const viewsBadge = `<div class="views-badge">${item.views} views</div>`;

    // Parse description to highlight price
    const descLines = (item.desc || '').split('\n');
    const priceLine = descLines[0] || '';
    const otherLines = descLines.slice(1).join('\n');

    card.innerHTML = `
      <div style="position:relative">
        <img class="img" src="${item.image}" alt="${item.name}">
        ${soldBadge}
        ${viewsBadge}
      </div>
      <h2>${item.name}</h2>
      <p class="price-line">${priceLine}</p>
      <p class="desc-line">${otherLines}</p>
    `;

    card.addEventListener('click', () => openModal(item));
    grid.appendChild(card);
  });

  observeCards();
}

function observeCards() {
  const cards = document.querySelectorAll('.card');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.2 });

  cards.forEach(c => observer.observe(c));
}

// ====== FILTERS ======
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const f = btn.dataset.filter;
      let list = [...allProducts];

      if (f === 'clothing') list = list.filter(p => p.category === 'clothing');
      if (f === 'accessories') list = list.filter(p => p.category === 'accessories');
      if (f === 'price-low') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      if (f === 'price-high') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));

      renderProducts(list);
    });
  });
}

// ====== MODAL ======
function openModal(item) {
  const modal = document.getElementById('modal');

  document.getElementById('modal-image').src = item.image;
  document.getElementById('modal-name').textContent = item.name;
  document.getElementById('modal-desc').textContent = item.desc || '';
  document.getElementById('modal-views').textContent = `${item.views} views`;

  const link = document.getElementById('modal-tg-link');
  link.href = item.tgPost || 'https://t.me/RAWSTORE111';

  if (item.sold) {
    link.innerHTML = 'SOLD OUT';
    link.classList.add('sold-out');
  } else {
    link.innerHTML = '<img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="TG">VIEW IN TELEGRAM';
    link.classList.remove('sold-out');
  }

  modal.classList.add('active');

  // 🔥 важно: сначала лочим фон
  lockBodyScroll();
  enableTouchLock();
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');

  disableTouchLock();
  unlockBodyScroll();
}

document.querySelector('.modal-close')?.addEventListener('click', closeModal);
document.querySelector('.modal-overlay')?.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
