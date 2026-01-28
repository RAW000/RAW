let allProducts = [];

fetch('products.json')
    .then(res => res.json())
    .then(items => {
        allProducts = items;
        // Загружаем реальные счетчики для всех товаров
        loadRealViewCounts(items);
        setupFilters();
    })

// Загрузка реальных счетчиков просмотров
async function loadRealViewCounts(items) {
    const updatedItems = await Promise.all(
        items.map(async (item, index) => {
            try {
                // Пробуем получить существующий счетчик
                let response = await fetch(`https://api.countapi.xyz/get/rawstore111/product-${index}`);
                let data = await response.json();
                
                // Если счетчик не существует (status 404), создаем его
                if (data.value === undefined) {
                    console.log(`Создаем счетчик для product-${index} со значением ${item.views}`);
                    response = await fetch(`https://api.countapi.xyz/set/rawstore111/product-${index}?value=${item.views}`);
                    data = await response.json();
                }
                
                // Используем значение из API
                if (data.value !== undefined) {
                    item.views = data.value;
                }
            } catch (error) {
                console.log('CountAPI недоступен, используем статичные цифры');
            }
            return item;
        })
    );
    
    renderProducts(updatedItems);
}

function renderProducts(items) {
    const grid = document.getElementById('products');
    grid.innerHTML = '';

    items.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;

        // SOLD OUT стикер
        const soldBadge = item.sold ? '<div class="sold-badge">SOLD OUT</div>' : '';
        
        // Счетчик просмотров
        const viewsBadge = `<div class="views-badge">${item.views} views</div>`;

        card.innerHTML = `
            <div style="position: relative;">
                <img class="img" src="${item.image}" alt="${item.name}">
                ${soldBadge}
                ${viewsBadge}
            </div>
            <h2>${item.name}</h2>
            <p>${item.desc}</p>
        `;

        // Клик по карточке открывает модалку
        card.addEventListener('click', () => openModal(item, index));
        
        grid.appendChild(card);
    });

    observeCards();
}

function observeCards() {
    const cards = document.querySelectorAll('.card');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, { threshold: 0.2 });
    cards.forEach(card => observer.observe(card));
}

// ФИЛЬТРЫ
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Убираем active со всех
            filterBtns.forEach(b => b.classList.remove('active'));
            // Добавляем на текущую
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            let filtered = [...allProducts];
            
            if (filter === 'clothing') {
                filtered = allProducts.filter(p => p.category === 'clothing');
            } else if (filter === 'accessories') {
                filtered = allProducts.filter(p => p.category === 'accessories');
            } else if (filter === 'price-low') {
                filtered = allProducts.sort((a, b) => a.price - b.price);
            } else if (filter === 'price-high') {
                filtered = allProducts.sort((a, b) => b.price - a.price);
            }
            
            renderProducts(filtered);
        });
    });
}

// МОДАЛЬНОЕ ОКНО с увеличением счетчика
async function openModal(item, index) {
    const modal = document.getElementById('modal');
    const modalImage = document.getElementById('modal-image');
    const modalName = document.getElementById('modal-name');
    const modalDesc = document.getElementById('modal-desc');
    const modalTgLink = document.getElementById('modal-tg-link');
    const modalViews = document.getElementById('modal-views');
    
    modalImage.src = item.image;
    modalName.textContent = item.name;
    modalDesc.textContent = item.desc;
    modalTgLink.href = item.tgPost || "https://t.me/RAWSTORE111";
    
    // Увеличиваем счетчик при открытии модалки
    try {
        const response = await fetch(`https://api.countapi.xyz/hit/rawstore111/product-${index}`);
        const data = await response.json();
        modalViews.textContent = `${data.value} views`;
        
        // Обновляем счетчик в массиве
        allProducts[index].views = data.value;
        
        // Обновляем badge на карточке
        const card = document.querySelector(`[data-index="${index}"]`);
        if (card) {
            const viewsBadge = card.querySelector('.views-badge');
            if (viewsBadge) {
                viewsBadge.textContent = `${data.value} views`;
            }
        }
    } catch (error) {
        // Если API недоступен, показываем статичное значение
        modalViews.textContent = `${item.views} views`;
    }
    
    // Если SOLD OUT, меняем текст кнопки
    if (item.sold) {
        modalTgLink.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="TG">
            SOLD OUT - CHECK TG FOR MORE
        `;
        modalTgLink.style.background = 'rgba(255, 0, 0, 0.2)';
        modalTgLink.style.border = '1px solid rgba(255, 0, 0, 0.5)';
    } else {
        // Возвращаем обычный вид если товар в наличии
        modalTgLink.innerHTML = `
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="TG">
            VIEW IN TELEGRAM
        `;
        modalTgLink.style.background = 'rgba(255, 255, 255, 0.1)';
        modalTgLink.style.border = '1px solid rgba(255, 255, 255, 0.4)';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // блокируем скролл
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Закрытие модалки
document.querySelector('.modal-close').addEventListener('click', closeModal);
document.querySelector('.modal-overlay').addEventListener('click', closeModal);

// Закрытие по ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});