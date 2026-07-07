// Ambient ember particles
(function(){
  const container = document.getElementById('embers');
  if(!container) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const count = prefersReduced ? 0 : 22;

  for(let i = 0; i < count; i++){
    const p = document.createElement('span');
    p.className = 'ember-particle';
    const left = Math.random() * 100;
    const duration = 7 + Math.random() * 8;
    const delay = Math.random() * 10;
    const drift = (Math.random() * 60 - 30) + 'px';
    const size = 2 + Math.random() * 3;

    p.style.left = left + 'vw';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.setProperty('--drift', drift);
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = delay + 's';

    container.appendChild(p);
  }
})();

// Shopping cart -> WhatsApp order
(function(){
  const WHATSAPP_NUMBER = '5591984370458';
  const cart = []; // { name, size, price, qty }

  const cartBar = document.getElementById('cartBar');
  const cartCount = document.getElementById('cartCount');
  const cartBarTotal = document.getElementById('cartBarTotal');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartItemsEl = document.getElementById('cartItems');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartSend = document.getElementById('cartSend');
  const cartClose = document.getElementById('cartClose');

  if(!cartBar) return;

  function findItem(name, size){
    return cart.find(i => i.name === name && i.size === size);
  }

  function addItem(name, size, price){
    const existing = findItem(name, size);
    if(existing){ existing.qty += 1; }
    else{ cart.push({ name, size, price, qty: 1 }); }
    render();
  }

  function changeQty(name, size, delta){
    const item = findItem(name, size);
    if(!item) return;
    item.qty += delta;
    if(item.qty <= 0){
      const idx = cart.indexOf(item);
      cart.splice(idx, 1);
    }
    render();
  }

  function total(){
    return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function itemCount(){
    return cart.reduce((sum, i) => sum + i.qty, 0);
  }

  function buildMessage(){
    const lines = ['Olá! Quero fazer o seguinte pedido:', ''];
    cart.forEach(i => {
      const sizeLabel = i.size ? ` (${i.size})` : '';
      lines.push(`• ${i.qty}x ${i.name}${sizeLabel} — R$${i.price * i.qty}`);
    });
    lines.push('', `Total: R$${total()}`);
    return lines.join('\n');
  }

  function render(){
    const count = itemCount();
    const t = total();

    cartCount.textContent = count;
    cartBarTotal.textContent = 'R$' + t;
    cartBar.classList.toggle('visible', count > 0);

    cartTotalEl.textContent = 'R$' + t;

    if(cart.length === 0){
      cartItemsEl.innerHTML = '<p class="cart-empty">Ainda não tem nada aqui. Toque num preço no cardápio pra adicionar.</p>';
      cartSend.classList.add('disabled');
    } else {
      cartSend.classList.remove('disabled');
      cartItemsEl.innerHTML = '';
      cart.forEach(i => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        const sizeLabel = i.size ? ` · Tam. ${i.size}` : '';
        row.innerHTML = `
          <div class="cart-item-info">
            <strong>${i.name}</strong>
            <small>${i.qty}x${sizeLabel}</small>
          </div>
          <div class="cart-item-controls">
            <button class="cart-qty-btn" data-action="minus">−</button>
            <span class="cart-item-price">R$${i.price * i.qty}</span>
            <button class="cart-qty-btn" data-action="plus">+</button>
          </div>
        `;
        row.querySelector('[data-action="minus"]').addEventListener('click', () => changeQty(i.name, i.size, -1));
        row.querySelector('[data-action="plus"]').addEventListener('click', () => changeQty(i.name, i.size, 1));
        cartItemsEl.appendChild(row);
      });
    }

    const message = encodeURIComponent(buildMessage());
    cartSend.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  // Wire up all price buttons in the menu
  document.querySelectorAll('button.price').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const size = btn.dataset.size || '';
      const price = parseFloat(btn.dataset.price);
      addItem(name, size, price);

      btn.classList.add('just-added');
      setTimeout(() => btn.classList.remove('just-added'), 350);
    });
  });

  function openDrawer(){
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('visible');
  }
  function closeDrawer(){
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('visible');
  }

  cartBar.addEventListener('click', openDrawer);
  cartClose.addEventListener('click', closeDrawer);
  cartOverlay.addEventListener('click', closeDrawer);

  render();
})();

// Scroll reveal for menu rows
(function(){
  const rows = document.querySelectorAll('.menu-row');
  if(!rows.length) return;

  if(!('IntersectionObserver' in window)){
    rows.forEach(r => r.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  rows.forEach(row => observer.observe(row));
})();