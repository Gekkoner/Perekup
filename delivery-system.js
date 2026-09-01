/**
 * DELIVERY SYSTEM
 * Handles delivery logistics, tracking, and completion
 */

class DeliverySystem {
  constructor() {
    this.deliveries = JSON.parse(localStorage.getItem('deliveries')) || [];
    this.userCity = localStorage.getItem('userCity') || 'Москва';
  }

  /**
   * Calculate delivery cost based on distance
   */
  calculateDeliveryCost(fromCity, toCity) {
    const distances = {
      'Москва': { 'СПБ': 700, 'Казань': 800, 'Екатеринбург': 1800, 'Новосибирск': 3300 },
      'СПБ': { 'Москва': 700, 'Казань': 1500, 'Екатеринбург': 2400, 'Новосибирск': 3900 },
      'Казань': { 'Москва': 800, 'СПБ': 1500, 'Екатеринбург': 1000, 'Новосибирск': 2500 },
      'Екатеринбург': { 'Москва': 1800, 'СПБ': 2400, 'Казань': 1000, 'Новосибирск': 1500 },
      'Новосибирск': { 'Москва': 3300, 'СПБ': 3900, 'Казань': 2500, 'Екатеринбург': 1500 }
    };

    const distance = distances[fromCity]?.[toCity] || 1000;
    const costPerKm = 2; // 2₽ per km
    return Math.round(distance * costPerKm);
  }

  /**
   * Open delivery modal
   */
  openDeliveryModal(listingId, sellerId, sellerCity, itemPrice) {
    const userCity = this.userCity;
    const deliveryCost = this.calculateDeliveryCost(sellerCity, userCity);
    const totalCost = itemPrice + deliveryCost;

    const modalHTML = `
      <div class="delivery-modal" id="deliveryModal">
        <div class="delivery-overlay"></div>
        <div class="delivery-sheet">
          <div class="delivery-header">
            <h2>Доставка</h2>
            <button class="delivery-close">✕</button>
          </div>

          <div class="delivery-content">
            <div class="delivery-info-card">
              <div class="delivery-route">
                <div class="delivery-city-from">
                  <div class="delivery-city-label">Из города</div>
                  <div class="delivery-city-name">${sellerCity}</div>
                </div>
                <div class="delivery-arrow">→</div>
                <div class="delivery-city-to">
                  <div class="delivery-city-label">В город</div>
                  <div class="delivery-city-name">${userCity}</div>
                </div>
              </div>

              <div class="delivery-details">
                <div class="delivery-detail-row">
                  <span>Цена товара</span>
                  <strong>${itemPrice}₽</strong>
                </div>
                <div class="delivery-detail-row">
                  <span>Стоимость доставки</span>
                  <strong>${deliveryCost}₽</strong>
                </div>
                <div class="delivery-detail-row total">
                  <span>Итого</span>
                  <strong>${totalCost}₽</strong>
                </div>
              </div>

              <div class="delivery-timing">
                <div class="timing-badge">⏱️ Доставка за 3 дня</div>
              </div>
            </div>

            <div class="delivery-address-section">
              <label>Адрес доставки (необязательно)</label>
              <input 
                type="text" 
                class="delivery-address-input" 
                placeholder="Укажите адрес для более точной доставки"
              />
            </div>

            <button class="delivery-confirm-btn" data-listing="${listingId}" data-seller="${sellerId}" data-cost="${totalCost}">
              Подтвердить доставку
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.createElementFromHTML(modalHTML));
    this.attachDeliveryListeners();
  }

  attachDeliveryListeners() {
    // Close modal
    document.querySelector('.delivery-close')?.addEventListener('click', () => {
      document.getElementById('deliveryModal')?.remove();
    });

    // Confirm delivery
    document.querySelector('.delivery-confirm-btn')?.addEventListener('click', (e) => {
      const listingId = e.target.dataset.listing;
      const sellerId = e.target.dataset.seller;
      const totalCost = parseFloat(e.target.dataset.cost);
      const address = document.querySelector('.delivery-address-input')?.value || 'По адресу доставки';

      this.createDelivery(listingId, sellerId, totalCost, address);
      document.getElementById('deliveryModal')?.remove();
    });
  }

  createDelivery(listingId, sellerId, cost, address) {
    const deliveryId = 'delivery_' + Date.now();
    const listing = this.getListingData(listingId);

    const delivery = {
      id: deliveryId,
      listingId,
      sellerId,
      buyerId: 'currentUser',
      cost,
      address,
      fromCity: listing.city,
      toCity: this.userCity,
      status: 'preparing', // preparing -> shipped -> delivered
      createdAt: new Date().toISOString(),
      shippedAt: null,
      deliveredAt: null,
      trackingNumber: this.generateTrackingNumber()
    };

    this.deliveries.push(delivery);
    localStorage.setItem('deliveries', JSON.stringify(this.deliveries));

    // Deduct money from buyer
    let balance = parseFloat(localStorage.getItem('balance') || '0');
    balance -= cost;
    localStorage.setItem('balance', balance.toString());

    // Send message to seller via chat
    this.sendDeliveryMessageToSeller(sellerId, delivery);

    // Start delivery process
    this.startDelivery(delivery);
  }

  sendDeliveryMessageToSeller(sellerId, delivery) {
    const messageText = `Заказываю доставку в ${delivery.toCity}. Адрес: ${delivery.address}`;

    let chats = JSON.parse(localStorage.getItem('chats')) || {};
    if (!chats[sellerId]) chats[sellerId] = [];
    
    chats[sellerId].push({
      from: 'buyer',
      text: messageText,
      timestamp: new Date().toISOString(),
      deliveryId: delivery.id
    });

    // Seller confirms after 2 seconds
    setTimeout(() => {
      chats[sellerId].push({
        from: 'seller',
        text: `✅ Принял! Упакую и отправлю сегодня. Трек: ${delivery.trackingNumber}`,
        timestamp: new Date().toISOString(),
        deliveryId: delivery.id
      });
      localStorage.setItem('chats', JSON.stringify(chats));
    }, 2000);
  }

  startDelivery(delivery) {
    // Show confirmation
    const confirmHTML = `
      <div class="delivery-confirm-card">
        <div class="delivery-success-icon">📦</div>
        <h3>Доставка заказана!</h3>
        <p>Трек-номер: <strong>${delivery.trackingNumber}</strong></p>
        <p class="delivery-eta">Доставка за 3 дня</p>
        <button class="delivery-ok-btn">Ок</button>
      </div>
    `;

    const card = this.createElementFromHTML(confirmHTML);
    document.body.appendChild(card);

    card.querySelector('.delivery-ok-btn').addEventListener('click', () => {
      card.remove();
      // Start delivery timer
      this.simulateDelivery(delivery);
    });
  }

  simulateDelivery(delivery) {
    const deliveryDuration = 3 * 24 * 60 * 60 * 1000; // 3 days in ms
    const shippingDuration = 1 * 24 * 60 * 60 * 1000; // 1 day to prepare

    // Mark as shipped after 1 day
    setTimeout(() => {
      const idx = this.deliveries.findIndex(d => d.id === delivery.id);
      if (idx !== -1) {
        this.deliveries[idx].status = 'shipped';
        this.deliveries[idx].shippedAt = new Date().toISOString();
        localStorage.setItem('deliveries', JSON.stringify(this.deliveries));

        // Notify buyer
        this.showDeliveryNotification(delivery, 'shipped');
      }
    }, shippingDuration);

    // Mark as delivered after 3 days
    setTimeout(() => {
      const idx = this.deliveries.findIndex(d => d.id === delivery.id);
      if (idx !== -1) {
        this.deliveries[idx].status = 'delivered';
        this.deliveries[idx].deliveredAt = new Date().toISOString();
        localStorage.setItem('deliveries', JSON.stringify(this.deliveries));

        // Complete purchase
        this.completeDeliveryPurchase(delivery);
      }
    }, deliveryDuration);
  }

  showDeliveryNotification(delivery, status) {
    let message = '';
    let icon = '';

    if (status === 'shipped') {
      message = `Посылка отправлена из ${delivery.fromCity}!`;
      icon = '🚚';
    } else if (status === 'delivered') {
      message = `Посылка доставлена в ${delivery.toCity}!`;
      icon = '📬';
    }

    const notifHTML = `
      <div class="delivery-notification">
        <div class="notif-icon">${icon}</div>
        <div class="notif-text">${message}</div>
      </div>
    `;

    const notif = this.createElementFromHTML(notifHTML);
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.classList.add('fade-out');
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  }

  completeDeliveryPurchase(delivery) {
    const listing = this.getListingData(delivery.listingId);

    // Add item to inventory
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    inventory.push({
      id: 'item_' + Date.now(),
      ...listing,
      purchasedAt: new Date().toISOString(),
      purchasedFrom: delivery.sellerId,
      deliveryMethod: 'delivery',
      deliveryId: delivery.id
    });

    // Add money to seller (minus delivery cost)
    let sellerBalance = parseFloat(localStorage.getItem('sellerBalance') || '0');
    const sellerEarnings = listing.price; // Seller gets full price, system takes delivery cost
    sellerBalance += sellerEarnings;

    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('sellerBalance', sellerBalance.toString());

    // Show success
    this.showDeliveryCompleteMessage(listing, delivery);
  }

  showDeliveryCompleteMessage(listing, delivery) {
    const messageHTML = `
      <div class="delivery-complete-modal">
        <div class="complete-overlay"></div>
        <div class="complete-card">
          <div class="complete-icon">✅</div>
          <h2>Товар доставлен!</h2>
          <div class="complete-item">
            <p class="complete-name">${listing.name}</p>
            <p class="complete-price">${listing.price}₽</p>
          </div>
          <p class="complete-note">Спасибо за покупку!</p>
          <button class="complete-ok">Закрыть</button>
        </div>
      </div>
    `;

    const modal = this.createElementFromHTML(messageHTML);
    document.body.appendChild(modal);

    modal.querySelector('.complete-ok').addEventListener('click', () => modal.remove());
  }

  /**
   * SELLER SIDE: Mark order as ready to ship
   */
  markOrderAsShipped(deliveryId) {
    const idx = this.deliveries.findIndex(d => d.id === deliveryId);
    if (idx !== -1) {
      this.deliveries[idx].status = 'shipped';
      this.deliveries[idx].shippedAt = new Date().toISOString();
      localStorage.setItem('deliveries', JSON.stringify(this.deliveries));
    }
  }

  /**
   * Get delivery tracking info
   */
  getDeliveryTracking(deliveryId) {
    const delivery = this.deliveries.find(d => d.id === deliveryId);
    if (!delivery) return null;

    const progress = this.getDeliveryProgress(delivery.status);

    return {
      ...delivery,
      progress,
      statusText: this.getStatusText(delivery.status)
    };
  }

  getDeliveryProgress(status) {
    const stages = {
      'preparing': 33,
      'shipped': 66,
      'delivered': 100
    };
    return stages[status] || 0;
  }

  getStatusText(status) {
    const texts = {
      'preparing': 'Подготовка',
      'shipped': 'В пути',
      'delivered': 'Доставлено'
    };
    return texts[status] || 'Неизвестно';
  }

  generateTrackingNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let tracking = '';

    for (let i = 0; i < 3; i++) {
      tracking += letters[Math.floor(Math.random() * letters.length)];
    }

    for (let i = 0; i < 7; i++) {
      tracking += numbers[Math.floor(Math.random() * numbers.length)];
    }

    return tracking;
  }

  getListingData(listingId) {
    const listings = JSON.parse(localStorage.getItem('listings')) || [];
    return listings.find(l => l.id === listingId);
  }

  createElementFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
  }

  getAllDeliveries() {
    return this.deliveries;
  }

  getDeliveriesByBuyer(buyerId) {
    return this.deliveries.filter(d => d.buyerId === buyerId);
  }

  getDeliveriesBySeller(sellerId) {
    return this.deliveries.filter(d => d.sellerId === sellerId);
  }
}

// Export
window.DeliverySystem = DeliverySystem;

const deliverySystem = new DeliverySystem();
