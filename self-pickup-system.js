/**
 * SELF-PICKUP SYSTEM
 * Meeting scheduling, legitimacy checks, penalties for delays
 */

class SelfPickupSystem {
  constructor() {
    this.meetings = JSON.parse(localStorage.getItem('meetings')) || [];
    this.userCity = localStorage.getItem('userCity') || 'Москва';
    this.meetingLocations = {
      'Москва': ['Красная площадь', 'Парк Горького', 'ТЦ Макси', 'Кафе на Тверской'],
      'СПБ': ['Дворцовая площадь', 'Парк 300-летия', 'ТЦ Галерея', 'Кафе у Невы'],
      'Казань': ['Площадь Тысячелетия', 'Парк Кремля', 'ТЦ Атмосфера', 'Кафе в центре'],
      'Екатеринбург': ['Площадь Росси', 'Парк Таганский', 'ТЦ Пассаж', 'Кафе на проспекте'],
      'Новосибирск': ['Площадь Ленина', 'Центральный парк', 'ТЦ Титан', 'Кафе на Красно��']
    };
  }

  /**
   * Open self-pickup modal when user selects "Самовывоз" option
   */
  openSelfPickupModal(listingId, sellerId, sellerCity, itemPrice) {
    const userCity = this.userCity;
    const isSameCity = userCity === sellerCity;

    const modalHTML = `
      <div class="self-pickup-modal" id="selfPickupModal">
        <div class="sp-overlay"></div>
        <div class="sp-sheet">
          <div class="sp-header">
            <h2>Самовывоз</h2>
            <button class="sp-close">✕</button>
          </div>

          <div class="sp-content">
            ${isSameCity ? this.renderSameCityPickup(listingId, sellerId) : this.renderDifferentCityPickup(sellerCity, itemPrice)}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.createElementFromHTML(modalHTML));
    this.attachPickupListeners();
  }

  renderSameCityPickup(listingId, sellerId) {
    return `
      <div class="sp-same-city">
        <div class="sp-info-block">
          <div class="sp-label">Вы оба в городе ${this.userCity}</div>
          <p class="sp-desc">Назначьте дату и время встречи</p>
        </div>

        <div class="sp-datetime-picker">
          <div class="sp-date-section">
            <label>Дата встречи</label>
            <input type="date" class="sp-date-input" />
          </div>

          <div class="sp-time-section">
            <label>Время встречи</label>
            <div class="sp-time-options">
              <button class="sp-time-btn" data-time="09:00">09:00</button>
              <button class="sp-time-btn" data-time="12:00">12:00</button>
              <button class="sp-time-btn" data-time="15:00">15:00</button>
              <button class="sp-time-btn" data-time="18:00">18:00</button>
            </div>
            <input type="time" class="sp-time-custom" placeholder="Или своё время" />
          </div>
        </div>

        <button class="sp-confirm-btn" data-listing="${listingId}" data-seller="${sellerId}">
          Назначить встречу
        </button>
      </div>
    `;
  }

  renderDifferentCityPickup(sellerCity, itemPrice) {
    return `
      <div class="sp-different-city">
        <div class="sp-location-card">
          <div class="sp-location-row">
            <div class="sp-location-you">
              <div class="sp-location-label">Вы находитесь</div>
              <div class="sp-location-city">${this.userCity}</div>
            </div>
            <div class="sp-location-icon">↔️</div>
            <div class="sp-location-seller">
              <div class="sp-location-label">Продавец</div>
              <div class="sp-location-city">${sellerCity}</div>
            </div>
          </div>
        </div>

        <div class="sp-travel-options">
          <div class="sp-option-card airplane">
            <div class="sp-option-icon">✈️</div>
            <div class="sp-option-title">Самолёт</div>
            <div class="sp-option-time">~5 часов</div>
            <div class="sp-option-price">${5000}₽</div>
          </div>

          <div class="sp-option-card train">
            <div class="sp-option-icon">🚂</div>
            <div class="sp-option-title">Поезд</div>
            <div class="sp-option-time">~3 дня</div>
            <div class="sp-option-price">${3000}₽</div>
          </div>
        </div>

        <div class="sp-info-message">
          <div class="sp-info-icon">ℹ️</div>
          <p>Купить билеты можно в приложении <strong>Pugi</strong></p>
        </div>

        <button class="sp-continue-btn" data-seller-city="${sellerCity}">
          Продолжить
        </button>
      </div>
    `;
  }

  renderMeetingScheduler(sellerId, sellerCity) {
    return `
      <div class="sp-meeting-scheduler">
        <div class="sp-scheduler-header">
          <h3>Назначить встречу в ${sellerCity}</h3>
        </div>

        <div class="sp-datetime-picker">
          <div class="sp-date-section">
            <label>Дата встречи</label>
            <input type="date" class="sp-date-input" />
          </div>

          <div class="sp-time-section">
            <label>Время встречи</label>
            <div class="sp-time-options">
              <button class="sp-time-btn" data-time="09:00">09:00</button>
              <button class="sp-time-btn" data-time="12:00">12:00</button>
              <button class="sp-time-btn" data-time="15:00">15:00</button>
              <button class="sp-time-btn" data-time="18:00">18:00</button>
            </div>
          </div>
        </div>

        <button class="sp-confirm-btn" data-seller="${sellerId}">
          Назначить встречу
        </button>
      </div>
    `;
  }

  attachPickupListeners() {
    // Time button selection
    document.querySelectorAll('.sp-time-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.sp-time-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
      });
    });

    // Close modal
    document.querySelector('.sp-close')?.addEventListener('click', () => {
      document.getElementById('selfPickupModal')?.remove();
    });

    // Confirm meeting (same city)
    document.querySelector('.sp-confirm-btn')?.addEventListener('click', (e) => {
      const date = document.querySelector('.sp-date-input')?.value;
      const timeBtn = document.querySelector('.sp-time-btn.selected');
      const time = timeBtn?.dataset.time || document.querySelector('.sp-time-custom')?.value;

      if (!date || !time) {
        alert('Выберите дату и время');
        return;
      }

      const listingId = e.target.dataset.listing;
      const sellerId = e.target.dataset.seller;

      this.createMeeting(listingId, sellerId, date, time);
      document.getElementById('selfPickupModal')?.remove();
    });

    // Different city - continue button
    document.querySelector('.sp-continue-btn')?.addEventListener('click', () => {
      const sellerCity = document.querySelector('.sp-continue-btn').dataset.sellerCity;
      // Replace content with meeting scheduler
      const scheduler = this.renderMeetingScheduler(null, sellerCity);
      document.querySelector('.sp-content').innerHTML = scheduler;
      this.attachPickupListeners();
    });
  }

  createMeeting(listingId, sellerId, date, time) {
    const meetingId = 'meeting_' + Date.now();
    
    const meeting = {
      id: meetingId,
      listingId,
      sellerId,
      buyerId: 'currentUser',
      date,
      time,
      city: this.userCity,
      location: this.getRandomLocation(this.userCity),
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 2
    };

    this.meetings.push(meeting);
    localStorage.setItem('meetings', JSON.stringify(this.meetings));

    // Send message to seller via chat
    this.sendMeetingMessageToSeller(sellerId, meeting);
    
    // Set reminder notification
    this.setMeetingReminder(meeting);
  }

  sendMeetingMessageToSeller(sellerId, meeting) {
    const [year, month, day] = meeting.date.split('-');
    const formattedDate = `${day}.${month}.${year}`;
    const messageText = `Давайте я буду у вас ${formattedDate} в ${meeting.time}`;

    // Add to chat with seller
    const chatMessage = {
      from: 'buyer',
      text: messageText,
      timestamp: new Date().toISOString(),
      meetingId: meeting.id
    };

    // Store in chat history
    let chats = JSON.parse(localStorage.getItem('chats')) || {};
    if (!chats[sellerId]) chats[sellerId] = [];
    chats[sellerId].push(chatMessage);
    localStorage.setItem('chats', JSON.stringify(chats));

    // Seller responds after 2 seconds
    setTimeout(() => {
      const sellerResponse = {
        from: 'seller',
        text: `Хорошо, встретимся ${meeting.location}`,
        timestamp: new Date().toISOString(),
        meetingId: meeting.id
      };
      chats[sellerId].push(sellerResponse);
      localStorage.setItem('chats', JSON.stringify(chats));
    }, 2000);
  }

  setMeetingReminder(meeting) {
    const meetingTime = new Date(`${meeting.date}T${meeting.time}`);
    const reminderTime = new Date(meetingTime.getTime() - 60 * 60 * 1000); // 1 hour before

    const now = new Date();
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        this.showMeetingReminder(meeting);
      }, timeUntilReminder);
    }
  }

  showMeetingReminder(meeting) {
    const [year, month, day] = meeting.date.split('-');
    const formattedDate = `${day}.${month}.${year}`;

    const reminderHTML = `
      <div class="meeting-reminder">
        <div class="reminder-content">
          <div class="reminder-icon">🔔</div>
          <div class="reminder-title">Встреча через час!</div>
          <div class="reminder-details">
            <div>📍 ${meeting.location}</div>
            <div>🕐 ${meeting.time}</div>
            <div>📅 ${formattedDate}</div>
          </div>
          <button class="reminder-close">Ок</button>
        </div>
      </div>
    `;

    const reminderEl = this.createElementFromHTML(reminderHTML);
    document.body.appendChild(reminderEl);

    reminderEl.querySelector('.reminder-close').addEventListener('click', () => {
      reminderEl.remove();
    });
  }

  /**
   * Check if user is on time for meeting
   * If more than 30 minutes late, seller cancels or gives second chance
   */
  checkMeetingArrival(meetingId) {
    const meeting = this.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const meetingTime = new Date(`${meeting.date}T${meeting.time}`);
    const now = new Date();
    const minutesLate = Math.floor((now - meetingTime) / 60000);

    if (minutesLate > 30) {
      this.handleLateDeal(meeting);
    } else if (minutesLate > 0) {
      this.showWarning(`Вы на ${minutesLate} минут опоздали`);
    } else {
      this.startPurchaseProcess(meeting);
    }
  }

  handleLateDeal(meeting) {
    const chats = JSON.parse(localStorage.getItem('chats')) || {};
    const sellerId = meeting.sellerId;

    if (!chats[sellerId]) chats[sellerId] = [];

    // Seller first message
    const firstMsg = {
      from: 'seller',
      text: 'Я прождал вас пол часа, это неподобающее поведение',
      timestamp: new Date().toISOString()
    };
    chats[sellerId].push(firstMsg);

    // Seller second message - random choice
    const cancelOrSecondChance = Math.random() > 0.5;

    setTimeout(() => {
      if (cancelOrSecondChance) {
        const cancelMsg = {
          from: 'seller',
          text: 'Сделка отменена',
          timestamp: new Date().toISOString()
        };
        chats[sellerId].push(cancelMsg);
        meeting.status = 'cancelled';

        // Remove meeting from chat
        setTimeout(() => {
          chats[sellerId] = [];
          localStorage.setItem('chats', JSON.stringify(chats));
        }, 2000);
      } else {
        // Give second chance
        const nextTime = this.getRandomMeetingTime();
        const nextLocation = this.getRandomLocation(meeting.city);

        const secondChanceMsg = {
          from: 'seller',
          text: `Могу дать вам последний шанс, в ${nextTime} в ${nextLocation}`,
          timestamp: new Date().toISOString()
        };
        chats[sellerId].push(secondChanceMsg);

        meeting.attempts = 1;
        meeting.secondChanceTime = nextTime;
        meeting.secondChanceLocation = nextLocation;
      }

      localStorage.setItem('meetings', JSON.stringify(this.meetings));
      localStorage.setItem('chats', JSON.stringify(chats));
    }, 1500);
  }

  startPurchaseProcess(meeting) {
    const listingId = meeting.listingId;
    const listing = this.getListingData(listingId);

    // Check if item has authenticity check
    if (listing.hasAuthenticityCheck) {
      this.showAuthenticityCheck(listing, meeting);
    } else {
      this.showPurchaseConfirmation(listing, meeting);
    }
  }

  /**
   * LEGITIMACY CHECK (Легитчек)
   * For items marked as authentic, show verification UI
   */
  showAuthenticityCheck(listing, meeting) {
    const checkHTML = `
      <div class="auth-check-modal">
        <div class="auth-overlay"></div>
        <div class="auth-sheet">
          <div class="auth-header">
            <h2>Легитчек</h2>
          </div>

          <div class="auth-content">
            <div class="auth-item-preview">
              <img src="${listing.image}" alt="Item" />
            </div>

            <div class="auth-info">
              <p class="auth-title">${listing.name}</p>
              <p class="auth-status">Проверка подлинности...</p>
            </div>

            <div class="auth-checks">
              <div class="auth-check-step">
                <div class="auth-check-icon">✓</div>
                <div class="auth-check-text">Проверка материала</div>
              </div>
              <div class="auth-check-step">
                <div class="auth-check-icon">✓</div>
                <div class="auth-check-text">Проверка логотипа</div>
              </div>
              <div class="auth-check-step">
                <div class="auth-check-icon">✓</div>
                <div class="auth-check-text">Проверка швов</div>
              </div>
              <div class="auth-check-step">
                <div class="auth-check-icon">✓</div>
                <div class="auth-check-text">Проверка упаковки</div>
              </div>
              <div class="auth-check-step">
                <div class="auth-check-icon">✓</div>
                <div class="auth-check-text">Проверка серийного номера</div>
              </div>
            </div>

            <div class="auth-result">
              <div class="auth-result-badge">✓ ОРИГИНАЛ</div>
              <p class="auth-result-text">Товар прошел все проверки</p>
            </div>

            <button class="auth-confirm-btn" data-meeting="${meeting.id}" data-listing="${listing.id}">
              Оплатить и забрать
            </button>
          </div>
        </div>
      </div>
    `;

    const modal = this.createElementFromHTML(checkHTML);
    document.body.appendChild(modal);

    // Animate checks
    const checks = modal.querySelectorAll('.auth-check-step');
    checks.forEach((check, i) => {
      setTimeout(() => {
        check.classList.add('completed');
      }, (i + 1) * 600);
    });

    // Confirm button
    modal.querySelector('.auth-confirm-btn').addEventListener('click', (e) => {
      this.completePurchase(meeting, listing);
      modal.remove();
    });
  }

  showPurchaseConfirmation(listing, meeting) {
    const confirmHTML = `
      <div class="purchase-confirm-modal">
        <div class="confirm-overlay"></div>
        <div class="confirm-sheet">
          <div class="confirm-header">
            <h2>Завершить покупку</h2>
          </div>

          <div class="confirm-content">
            <div class="confirm-item">
              <img src="${listing.image}" alt="Item" />
              <div class="confirm-details">
                <p class="confirm-title">${listing.name}</p>
                <p class="confirm-price">${listing.price}₽</p>
              </div>
            </div>

            <button class="purchase-btn" data-meeting="${meeting.id}" data-listing="${listing.id}">
              Оплатить и забрать
            </button>
          </div>
        </div>
      </div>
    `;

    const modal = this.createElementFromHTML(confirmHTML);
    document.body.appendChild(modal);

    modal.querySelector('.purchase-btn').addEventListener('click', (e) => {
      this.completePurchase(meeting, listing);
      modal.remove();
    });
  }

  completePurchase(meeting, listing) {
    // Update meeting status
    meeting.status = 'completed';

    // Add item to inventory
    let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
    inventory.push({
      id: 'item_' + Date.now(),
      ...listing,
      purchasedAt: new Date().toISOString(),
      purchasedFrom: meeting.sellerId
    });

    // Deduct money from balance
    let balance = parseFloat(localStorage.getItem('balance') || '0');
    balance -= listing.price;

    localStorage.setItem('meetings', JSON.stringify(this.meetings));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('balance', balance.toString());

    this.showPurchaseSuccess(listing, meeting);
  }

  showPurchaseSuccess(listing, meeting) {
    const successHTML = `
      <div class="purchase-success">
        <div class="success-card">
          <div class="success-icon">✓</div>
          <h2>Покупка завершена!</h2>
          <p>${listing.name}</p>
          <p class="success-price">-${listing.price}₽</p>
        </div>
      </div>
    `;

    const el = this.createElementFromHTML(successHTML);
    document.body.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 3000);
  }

  /**
   * SELLER SIDE: Fake legitimacy check for fraudulent items
   */
  showSellerAuthenticationCheck(listing, meeting) {
    // 25% chance to pass (green wheel)
    const isPassed = Math.random() < 0.25;

    const wheelHTML = `
      <div class="seller-auth-wheel">
        <div class="wheel-overlay"></div>
        <div class="wheel-container">
          <div class="auth-wheel" style="--rotation: ${isPassed ? 90 : 270}deg">
            <div class="wheel-segment green" style="--percent: 25%"></div>
            <div class="wheel-segment red" style="--percent: 75%"></div>
          </div>

          ${!isPassed ? `
            <div class="auth-result-negative" style="display: ${!isPassed ? 'block' : 'none'}">
              <div class="buyer-accusation">
                "Ты меня обманул это реплика!"
              </div>

              <div class="seller-choice-buttons">
                <button class="choice-reduce">Снизить цену как у реплики</button>
                <button class="choice-robbed">Согласиться и потерять деньги</button>
              </div>
            </div>
          ` : `
            <div class="auth-result-positive">
              <p>✓ ОРИГИНАЛ - Товар продан!</p>
            </div>
          `}
        </div>
      </div>
    `;

    const modal = this.createElementFromHTML(wheelHTML);
    document.body.appendChild(modal);

    if (isPassed) {
      setTimeout(() => modal.remove(), 2000);
    } else {
      modal.querySelector('.choice-reduce')?.addEventListener('click', () => {
        // Reduce price to replica level
        this.completeSale(meeting, listing, true);
        modal.remove();
      });

      modal.querySelector('.choice-robbed')?.addEventListener('click', () => {
        // Lose random amount of money
        this.robSeller(meeting, listing);
        modal.remove();
      });
    }
  }

  robSeller(meeting, listing) {
    const robberyPercent = Math.random() * 0.6 + 0.2; // 20-80%
    const robbedAmount = Math.round((listing.price * robberyPercent) / 1000) * 1000;

    let balance = parseFloat(localStorage.getItem('sellerBalance') || '0');
    balance -= robbedAmount;

    localStorage.setItem('sellerBalance', balance.toString());

    const alertHTML = `
      <div class="robbery-alert">
        <div class="alert-icon">⚠️</div>
        <h3>Вас обокрали!</h3>
        <p>-${robbedAmount}₽</p>
        <button class="alert-ok">Ок</button>
      </div>
    `;

    const alert = this.createElementFromHTML(alertHTML);
    document.body.appendChild(alert);

    alert.querySelector('.alert-ok').addEventListener('click', () => alert.remove());
  }

  completeSale(meeting, listing, isReplica) {
    const finalPrice = isReplica ? listing.price * 0.3 : listing.price;

    let sellerBalance = parseFloat(localStorage.getItem('sellerBalance') || '0');
    sellerBalance += finalPrice;

    localStorage.setItem('sellerBalance', sellerBalance.toString());

    this.showSaleSuccess(listing, finalPrice);
  }

  showSaleSuccess(listing, amount) {
    const successHTML = `
      <div class="sale-success">
        <div class="success-card">
          <div class="success-icon">💰</div>
          <h2>Товар продан!</h2>
          <p>${listing.name}</p>
          <p class="success-price">+${amount}₽</p>
        </div>
      </div>
    `;

    const el = this.createElementFromHTML(successHTML);
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 3000);
  }

  // Utility functions
  getRandomLocation(city) {
    const locations = this.meetingLocations[city] || ['Центр города'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getRandomMeetingTime() {
    const times = ['09:00', '12:00', '15:00', '18:00', '20:00'];
    return times[Math.floor(Math.random() * times.length)];
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

  showWarning(text) {
    const warningHTML = `
      <div class="warning-toast">
        <div class="warning-content">
          ⚠️ ${text}
        </div>
      </div>
    `;
    const el = this.createElementFromHTML(warningHTML);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

// Initialize
const pickupSystem = new SelfPickupSystem();
