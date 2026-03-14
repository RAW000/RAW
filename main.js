import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDMjvCNkx5-2nl5Ybjp49cv2P8YAkOyzsk",
  authDomain: "rawstore111.firebaseapp.com",
  projectId: "rawstore111",
  storageBucket: "rawstore111.firebasestorage.app",
  messagingSenderId: "249110623807",
  appId: "1:249110623807:web:74a827237f3b5efb78ea8a",
  measurementId: "G-RJKZX37KYM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ====== PRODUCTS ======
let allProducts = [];

async function loadProducts() {
  // показываем скелетоны сразу
  showSkeletons(6);
  await loadBanner(); // грузим баннер параллельно

  const querySnapshot = await getDocs(collection(db, "products"));
  let items = [];

  querySnapshot.forEach(doc => {
    items.push({ _id: doc.id, ...doc.data() });
  });

  items.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  allProducts = items;
  renderProducts(items);
  setupFilters();
}

function showSkeletons(count) {
  const grid = document.getElementById('products');
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    grid.innerHTML +=
      '<div class="skeleton-card">' +
        '<div class="skeleton-img"></div>' +
        '<div class="skeleton-line"></div>' +
        '<div class="skeleton-line short"></div>' +
        '<div class="skeleton-line shorter"></div>' +
      '</div>';
  }
}


// ====== BANNER ======
async function loadBanner() {
  try {
    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await getDoc(doc(db, "settings", "banner"));
    if (snap.exists()) {
      const data = snap.data();
      if (data.active && data.text) {
        const banner = document.getElementById('site-banner');
        const t1 = document.getElementById('site-banner-text');
        const t2 = document.getElementById('site-banner-text2');
        const txt = data.text + '    —    ' + data.text + '    —    ';
        t1.textContent = txt;
        t2.textContent = txt;
        banner.style.display = 'block';
        document.body.classList.add('has-banner');
      }
    }
  } catch(e) {}
}

loadBanner();

// ====== BANNER ======
async function loadBanner() {
  try {
    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const snap = await getDoc(doc(db, "settings", "banner"));
    if (snap.exists()) {
      window._bannerData = snap.data();
    } else {
      window._bannerData = { active: false, text: '', position: 0 };
    }
  } catch(e) {
    window._bannerData = { active: false };
  }
}

loadProducts();

// ====== SCROLL LOCK ======
let scrollPos = 0;

function lockBodyScroll() {
  scrollPos = window.scrollY || window.pageYOffset;
  document.body.classList.add('modal-open');
  document.body.style.position = 'fixed';
  document.body.style.top = '-' + scrollPos + 'px';
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

function preventTouchMove(e) {
  const modalContent = document.querySelector('.modal-content');
  if (!modalContent) return;
  if (!modalContent.contains(e.target)) e.preventDefault();
}

function enableTouchLock() {
  document.addEventListener('touchmove', preventTouchMove, { passive: false });
}
function disableTouchLock() {
  document.removeEventListener('touchmove', preventTouchMove, { passive: false });
}

// ====== RENDER ======
function renderProducts(items) {
  const grid = document.getElementById('products');
  grid.innerHTML = '';

  items.forEach((item, index) => {
    // вставляем баннер перед нужным товаром
    if (window._bannerData && window._bannerData.active && window._bannerData.text) {
      const pos = window._bannerData.position ?? 0;
      if (pos > 0 && index === pos) {
        const banner = document.createElement('div');
        banner.className = 'drop-banner';
        banner.innerHTML = '<span>' + window._bannerData.text + '</span>';
        grid.appendChild(banner);
      }
    }
    const card = document.createElement('div');
    card.className = 'card';

    const soldBadge = item.sold
      ? '<div class="sold-badge">SOLD OUT</div>'
      : '';

    const descLines = (item.desc || '').split('\n');
    const priceLine = descLines[0] || '';
    const otherLines = descLines.slice(1).join('\n');

    card.innerHTML =
      '<div style="position:relative">' +
        '<img class="img" src="' + item.image + '" alt="' + item.name + '" loading="lazy">' +
        soldBadge +
      '</div>' +
      '<h2>' + item.name + '</h2>' +
      '<p class="price-line">' + priceLine + '</p>' +
      '<p class="desc-line">' + otherLines + '</p>';

    let _tStartY = 0, _tStartX = 0, _tMoved = false;

    card.addEventListener('touchstart', (e) => {
      _tStartY = e.touches[0].clientY;
      _tStartX = e.touches[0].clientX;
      _tMoved = false;
    }, { passive: true });

    card.addEventListener('touchmove', () => {
      _tMoved = true;
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
      if (_tMoved) return; // был скролл — игнорируем
      e.preventDefault(); // блокируем синтетический click от iOS
      openModal(item);
    }, { passive: false });

    // для десктопа
    card.addEventListener('click', (e) => {
      if (e.pointerType === 'touch') return; // уже обработано touchend
      openModal(item);
    });
    grid.appendChild(card);
  });

  observeCards();
}

function observeCards() {
  const cards = document.querySelectorAll('.card');
  // небольшой stagger — карточки появляются одна за другой быстро
  cards.forEach((c, i) => {
    setTimeout(() => c.classList.add('show'), i * 60);
  });
}

// ====== FILTERS ======
function setupFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');

      const f = newBtn.dataset.filter;
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
  lockBodyScroll();
  enableTouchLock();
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');
  disableTouchLock();
  unlockBodyScroll();
}

// ====== AUTH ======
document.getElementById("login-btn")?.addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-pass").value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    alert("Неверный логин или пароль");
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
  } else {
    document.getElementById("admin-panel").style.display = "none";
  }
});

// ====== EVENTS ======
document.querySelector('.modal-close')?.addEventListener('click', closeModal);
document.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});