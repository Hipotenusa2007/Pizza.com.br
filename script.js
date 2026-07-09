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
// Painel de impressão — conecta numa impressora térmica Bluetooth de 58mm
// e imprime o pedido colado no campo de texto, formatado como cupom.

(function(){
  const LINE_WIDTH = 32; // caracteres por linha em impressoras 58mm (fonte padrão)

  // UUIDs mais comuns usados por impressoras térmicas Bluetooth clonadas.
  // Nem toda impressora usa o mesmo UUID — se a sua não conectar, me avisa
  // a marca/modelo pra eu ajustar essa lista.
  const CANDIDATE_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb',
    '0000ff00-0000-1000-8000-00805f9b34fb',
    '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    '0000ffe0-0000-1000-8000-00805f9b34fb',
  ];

  let device = null;
  let writeChar = null;

  const connectBtn = document.getElementById('connectBtn');
  const printBtn = document.getElementById('printBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const clienteNome = document.getElementById('clienteNome');
  const pedidoTexto = document.getElementById('pedidoTexto');

  function setStatus(connected, text){
    statusDot.classList.toggle('connected', connected);
    statusText.textContent = text;
    printBtn.disabled = !connected;
  }

  function bluetoothSupported(){
    return 'bluetooth' in navigator;
  }

  async function connectPrinter(){
    if(!bluetoothSupported()){
      setStatus(false, 'Bluetooth não disponível neste navegador (use Chrome no Android)');
      return;
    }

    try{
      setStatus(false, 'Procurando impressora...');

      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: CANDIDATE_SERVICES,
      });

      setStatus(false, 'Conectando em ' + (device.name || 'impressora') + '...');

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      writeChar = null;
      for(const service of services){
        const chars = await service.getCharacteristics();
        for(const char of chars){
          if(char.properties.write || char.properties.writeWithoutResponse){
            writeChar = char;
            break;
          }
        }
        if(writeChar) break;
      }

      if(!writeChar){
        setStatus(false, 'Conectou, mas não achei como enviar dados. Me manda o modelo da impressora.');
        return;
      }

      setStatus(true, 'Conectado: ' + (device.name || 'impressora'));

      device.addEventListener('gattserverdisconnected', () => {
        setStatus(false, 'Impressora desconectada');
      });

    } catch(err){
      console.error(err);
      setStatus(false, 'Não conectou. Tenta de novo ou me manda o modelo da impressora.');
    }
  }

  // Remove acentos pra garantir compatibilidade com impressoras que não
  // suportam UTF-8 corretamente.
  function stripAccents(str){
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function wrapLine(text){
    const clean = stripAccents(text);
    const words = clean.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
      if((current + ' ' + word).trim().length > LINE_WIDTH){
        lines.push(current.trim());
        current = word;
      } else {
        current = (current + ' ' + word).trim();
      }
    });
    if(current) lines.push(current);
    return lines;
  }

  function centerLine(text){
    const clean = stripAccents(text);
    const pad = Math.max(0, Math.floor((LINE_WIDTH - clean.length) / 2));
    return ' '.repeat(pad) + clean;
  }

  function buildReceiptBytes(){
    const bytes = [];
    const push = (...arr) => bytes.push(...arr);
    const pushText = (str) => {
      const encoder = new TextEncoder();
      push(...encoder.encode(stripAccents(str)));
    };

    // Inicializa impressora
    push(0x1B, 0x40);

    // Cabeçalho centralizado, negrito, fonte dupla
    push(0x1B, 0x61, 0x01); // centralizar
    push(0x1D, 0x21, 0x11); // fonte dupla altura+largura
    pushText('MEIRELLES');
    push(0x0A);
    push(0x1D, 0x21, 0x00); // fonte normal
    pushText('Pizzaria Meirelles');
    push(0x0A);
    push(0x1B, 0x61, 0x00); // alinhar à esquerda
    pushText('-'.repeat(LINE_WIDTH));
    push(0x0A);

    // Data e cliente
    const now = new Date();
    const dataStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    pushText(dataStr);
    push(0x0A);

    const nome = clienteNome.value.trim();
    if(nome){
      pushText('Cliente: ' + nome);
      push(0x0A);
    }

    pushText('-'.repeat(LINE_WIDTH));
    push(0x0A);
    push(0x0A);

    // Corpo do pedido
    const pedido = pedidoTexto.value.trim();
    if(pedido){
      pedido.split('\n').forEach(line => {
        if(line.trim() === ''){
          push(0x0A);
          return;
        }
        wrapLine(line).forEach(wrapped => {
          pushText(wrapped);
          push(0x0A);
        });
      });
    }

    push(0x0A);
    pushText('-'.repeat(LINE_WIDTH));
    push(0x0A);
    push(0x1B, 0x61, 0x01); // centralizar
    pushText('Obrigado pela preferencia!');
    push(0x0A);
    push(0x1B, 0x61, 0x00);

    // Alimenta papel pro corte manual
    push(0x0A, 0x0A, 0x0A, 0x0A);

    return new Uint8Array(bytes);
  }

  async function printReceipt(){
    if(!writeChar){
      setStatus(false, 'Conecta a impressora primeiro');
      return;
    }
    if(!pedidoTexto.value.trim()){
      pedidoTexto.focus();
      return;
    }

    printBtn.disabled = true;
    const originalLabel = printBtn.querySelector('span') ? printBtn.querySelector('span').textContent : printBtn.textContent;

    try{
      const data = buildReceiptBytes();
      const CHUNK = 180; // limite seguro por pacote BLE
      for(let i = 0; i < data.length; i += CHUNK){
        const slice = data.slice(i, i + CHUNK);
        if(writeChar.properties.writeWithoutResponse){
          await writeChar.writeValueWithoutResponse(slice);
        } else {
          await writeChar.writeValue(slice);
        }
        await new Promise(r => setTimeout(r, 30));
      }
      setStatus(true, 'Cupom enviado! ✓');
    } catch(err){
      console.error(err);
      setStatus(true, 'Erro ao imprimir. Tenta de novo.');
    } finally{
      printBtn.disabled = false;
    }
  }

  connectBtn.addEventListener('click', connectPrinter);
  printBtn.addEventListener('click', printReceipt);

  if(!bluetoothSupported()){
    setStatus(false, 'Bluetooth não disponível — abra este painel no Chrome do Android');
  }
})();