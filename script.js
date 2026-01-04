    fetch('products.json')
    .then(res => res.json())
    .then(items => {
        const grid = document.getElementById('products')

        items.forEach(item => {
        const card = document.createElement('div')
        card.className = 'card'

        card.innerHTML = `
  <img class="img" src="${item.image}" alt="${item.name}">
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
    }, {
        threshold: 0.2
    })

    cards.forEach(card => observer.observe(card))
    }
