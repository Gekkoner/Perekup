/**
 * CITY-PRIORITIZED FEED
 * Shows listings from user's city first, then other cities
 */

class CityPrioritizedFeed {
  constructor() {
    this.userCity = localStorage.getItem('userCity') || 'Москва';
    this.listings = JSON.parse(localStorage.getItem('listings')) || [];
  }

  /**
   * Sort listings: user's city first, then alphabetically by distance
   */
  getPrioritizedListings(category = null) {
    let filtered = this.listings;

    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }

    // Separate by city
    const userCityListings = filtered.filter(item => item.city === this.userCity);
    const otherListings = filtered.filter(item => item.city !== this.userCity);

    // Sort other listings by city name
    otherListings.sort((a, b) => a.city.localeCompare(b.city));

    // Combine: user city first, then others
    return [...userCityListings, ...otherListings];
  }

  renderFeedWithCityPriority(category = null) {
    const listings = this.getPrioritizedListings(category);
    const cities = {};

    // Group by city
    listings.forEach(listing => {
      if (!cities[listing.city]) {
        cities[listing.city] = [];
      }
      cities[listing.city].push(listing);
    });

    let html = '';

    // Render user's city first
    if (cities[this.userCity]) {
      html += `
        <div class="feed-city-section">
          <div class="city-header your-city">
            <div class="city-name">📍 ${this.userCity} (Ваш город)</div>
            <div class="city-count">${cities[this.userCity].length} объявлений</div>
          </div>
          <div class="city-listings">
            ${cities[this.userCity].map(item => this.renderListingCard(item)).join('')}
          </div>
        </div>
      `;
    }

    // Render other cities
    Object.keys(cities).forEach(city => {
      if (city !== this.userCity) {
        html += `
          <div class="feed-city-section">
            <div class="city-header">
              <div class="city-name">📍 ${city}</div>
              <div class="city-count">${cities[city].length} объявлений</div>
            </div>
            <div class="city-listings">
              ${cities[city].map(item => this.renderListingCard(item)).join('')}
            </div>
          </div>
        `;
      }
    });

    return html;
  }

  renderListingCard(item) {
    const isFromUserCity = item.city === this.userCity;

    return `
      <div class="listing-card ${isFromUserCity ? 'user-city' : 'other-city'}" data-id="${item.id}">
        <div class="listing-image">
          <img src="${item.image}" alt="${item.name}" />
          ${item.hasAuthenticityCheck ? '<div class="auth-badge">✓ Оригинал</div>' : ''}
        </div>

        <div class="listing-info">
          <div class="listing-name">${item.name}</div>
          <div class="listing-city">${item.city}</div>
          <div class="listing-condition">${item.condition}</div>
        </div>

        <div class="listing-footer">
          <div class="listing-price">${item.price}₽</div>
          <div class="listing-seller">от ${item.sellerName}</div>
        </div>
      </div>
    `;
  }

  updateUserCity(newCity) {
    this.userCity = newCity;
    localStorage.setItem('userCity', newCity);
  }
}

/**
 * SELLER BOT CHAT SYSTEM
 * Simulates seller responses and auto-negotiates pickup/delivery
 */

class SellerBotChat {
  constructor() {
    this.listings = JSON.parse(localStorage.getItem('listings')) || [];
    this.chats = JSON.parse(localStorage.getItem('chats')) || {};
  }

  /**
   * Initialize chat for a listing purchase
   * Bot randomly chooses: самовывоз (self-pickup) or доставка (delivery)
   */
  initiateBotChat(buyerId, listingId, listing) {
    const chatId = `${buyerId}-${listingId}`;
    
    if (!this.chats[chatId]) {
      this.chats[chatId] = {
        id: chatId,
        listing,
        messages: [],
        botDeliveryChoice: Math.random() > 0.5 ? 'pickup' : 'delivery',
        status: 'negotiating'
      };
    }

    // Bot sends greeting after 1 second
    setTimeout(() => {
      this.addBotMessage(chatId, 'Привет! Спасибо что заинтересовались товаром 👋');
    }, 1000);

    localStorage.setItem('chats', JSON.stringify(this.chats));
    return chatId;
  }

  /**
   * Handle user message - bot responds with delivery/pickup proposal
   */
  handleUserMessage(chatId, userMessage) {
    const chat = this.chats[chatId];
    if (!chat) return;

    chat.messages.push({
      from: 'buyer',
      text: userMessage,
      timestamp: new Date().toISOString()
    });

    // Bot responds after 2 seconds
    setTimeout(() => {
      if (chat.botDeliveryChoice === 'pickup') {
        this.handlePickupFlow(chatId);
      } else {
        this.handleDeliveryFlow(chatId);
      }
    }, 2000);

    localStorage.setItem('chats', JSON.stringify(this.chats));
  }

  /**
   * PICKUP FLOW: Bot proposes self-pickup meeting
   */
  handlePickupFlow(chatId) {
    const chat = this.chats[chatId];
    const userCity = localStorage.getItem('userCity') || 'Москва';
    const sellerCity = chat.listing.city;

    // Step 1: Bot acknowledges and proposes pickup
    this.addBotMessage(chatId, '✅ Вещь все еще в наличии. Предлагаю самовывоз');

    // Step 2: After 3 seconds, propose meeting time
    setTimeout(() => {
      if (userCity === sellerCity) {
        // Same city - propose direct meeting time
        const time = this.getRandomMeetingTime();
        const location = this.getRandomLocation(sellerCity);
        this.addBotMessage(
          chatId,
          `Можем встретиться ${time} в ${location}`
        );
      } else {
        // Different cities - ask for travel date
        this.addBotMessage(
          chatId,
          `Я в ${sellerCity}. Когда вы сможете приехать? Можно на самолёте за 5 часов или на поезде за 3 дня (билеты в Pugi)`
        );
      }

      chat.status = 'waiting_meeting_confirmation';
    }, 3000);

    localStorage.setItem('chats', JSON.stringify(this.chats));
  }

  /**
   * DELIVERY FLOW: Bot proposes delivery service
   */
  handleDeliveryFlow(chatId) {
    const chat = this.chats[chatId];

    this.addBotMessage(chatId, '✅ Вещь все еще в наличии. Предлагаю доставку');

    setTimeout(() => {
      this.addBotMessage(
        chatId,
        `Доставлю в ваш город за 3 дня. Стоимость доставки зависит от расстояния`
      );

      chat.status = 'delivery_proposed';
    }, 3000);

    localStorage.setItem('chats', JSON.stringify(this.chats));
  }

  /**
   * When buyer confirms meeting, bot sets random time and location
   */
  confirmMeetingWithBot(chatId, buyerDate, buyerTime) {
    const chat = this.chats[chatId];
    if (!chat) return;

    // Format date for display
    const [year, month, day] = buyerDate.split('-');
    const formattedDate = `${day}.${month}.${year}`;

    // Bot confirms and picks location
    const location = this.getRandomLocation(chat.listing.city);
    
    this.addBotMessage(
      chatId,
      `Хорошо, встретимся ${formattedDate} в ${buyerTime} в ${location}`
    );

    chat.status = 'meeting_scheduled';
    chat.meetingDate = buyerDate;
    chat.meetingTime = buyerTime;
    chat.meetingLocation = location;

    localStorage.setItem('chats', JSON.stringify(this.chats));
  }

  /**
   * When buyer arrives late (more than 30 min)
   * Bot sends angry message with 50/50 chance: cancel or give second chance
   */
  handleLateArrival(chatId, minutesLate) {
    const chat = this.chats[chatId];
    if (!chat) return;

    // First message - complaint
    this.addBotMessage(
      chatId,
      `Я прождал вас пол часа, это неподобающее поведение`
    );

    // Random decision: cancel or second chance
    const cancel = Math.random() > 0.5;

    setTimeout(() => {
      if (cancel) {
        this.addBotMessage(chatId, '❌ Сделка отменена');
        chat.status = 'cancelled';

        // Clear chat after 2 seconds
        setTimeout(() => {
          delete this.chats[chatId];
          localStorage.setItem('chats', JSON.stringify(this.chats));
        }, 2000);
      } else {
        // Give second chance
        const nextTime = this.getRandomMeetingTime();
        const nextLocation = this.getRandomLocation(chat.listing.city);

        this.addBotMessage(
          chatId,
          `Могу дать вам последний шанс. В ${nextTime} в ${nextLocation}`
        );

        chat.status = 'second_chance';
        chat.secondChanceTime = nextTime;
        chat.secondChanceLocation = nextLocation;
      }

      localStorage.setItem('chats', JSON.stringify(this.chats));
    }, 2000);
  }

  /**
   * If buyer misses second chance meeting
   */
  handleSecondChanceMissed(chatId) {
    const chat = this.chats[chatId];
    if (!chat) return;

    this.addBotMessage(chatId, '❌ Сделка отменена. Вы больше не добро пожаловать');

    chat.status = 'permanently_cancelled';

    // Delete chat
    setTimeout(() => {
      delete this.chats[chatId];
      localStorage.setItem('chats', JSON.stringify(this.chats));
    }, 2000);
  }

  /**
   * Add message to chat and update UI
   */
  addBotMessage(chatId, text) {
    const chat = this.chats[chatId];
    if (!chat) return;

    chat.messages.push({
      from: 'seller',
      text,
      timestamp: new Date().toISOString()
    });

    localStorage.setItem('chats', JSON.stringify(this.chats));

    // Trigger UI update
    this.updateChatUI(chatId, chat);
  }

  updateChatUI(chatId, chat) {
    const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (!chatElement) return;

    const messagesContainer = chatElement.querySelector('.chat-messages');
    if (!messagesContainer) return;

    const lastMessage = chat.messages[chat.messages.length - 1];
    const messageHTML = `
      <div class="chat-message ${lastMessage.from}">
        <div class="message-content">${lastMessage.text}</div>
        <div class="message-time">${this.formatTime(lastMessage.timestamp)}</div>
      </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * SELLER LISTING CREATION: Bot negotiates with buyers
   */
  createSellerListing(itemName, price, condition, city, hasAuthenticityCheck = false) {
    const listing = {
      id: 'listing_' + Date.now(),
      name: itemName,
      price,
      condition,
      city,
      hasAuthenticityCheck,
      sellerName: 'Продавец',
      image: '/placeholder.jpg',
      category: 'общее',
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.listings.push(listing);
    localStorage.setItem('listings', JSON.stringify(this.listings));

    return listing;
  }

  // Utility functions
  getRandomMeetingTime() {
    const times = ['09:00', '12:00', '15:00', '18:00', '20:00'];
    return times[Math.floor(Math.random() * times.length)];
  }

  getRandomLocation(city) {
    const locations = {
      'Москва': ['Красная площадь', 'Парк Горького', 'ТЦ Макси', 'Кафе на Тверской'],
      'СПБ': ['Дворцовая площадь', 'Парк 300-летия', 'ТЦ Галерея', 'Кафе у Невы'],
      'Казань': ['Площадь Тысячелетия', 'Парк Кремля', 'ТЦ Атмосфера', 'Кафе в центре'],
      'Екатеринбург': ['Площадь Росси', 'Парк Таганский', 'ТЦ Пассаж', 'Кафе на проспекте'],
      'Новосибирск': ['Площадь Ленина', 'Центральный парк', 'ТЦ Титан', 'Кафе на Красном']
    };

    const cityLocations = locations[city] || ['Центр города'];
    return cityLocations[Math.floor(Math.random() * cityLocations.length)];
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  getChat(chatId) {
    return this.chats[chatId];
  }

  getAllChats() {
    return this.chats;
  }
}

// Export classes
window.CityPrioritizedFeed = CityPrioritizedFeed;
window.SellerBotChat = SellerBotChat;

// Initialize
const feed = new CityPrioritizedFeed();
const botChat = new SellerBotChat();
