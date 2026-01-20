fetch('products.json')
    .then(res => res.json())
    .then(items => {
        const grid = document.getElementById('products')

        items.forEach(item => {
            const card = document.createElement('div')
            card.className = 'card'

            // Если в JSON нет ссылки tgPost, кнопка будет вести просто в канал
            const link = item.tgPost || "https://t.me/RAWSTORE111";

            card.innerHTML = `
                <div style="position: relative;">
                    <img class="img" src="${item.image}" alt="${item.name}">
                    <a href="${link}" target="_blank" class="tg-icon-link">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" alt="TG">
                    </a>
                </div>
                <h2>${item.name}</h2>
                <p>${item.desc}</p>
            `
            grid.appendChild(card)
        })

        observeCards()
    })

function observeCards() {
    const cards = document.querySelectorAll('.card')
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show')
            }
        })
    }, { threshold: 0.2 })
    cards.forEach(card => observer.observe(card))
}
