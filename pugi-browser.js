/**
 * PUGI BROWSER — Internet app renamed to Pugi
 * GTA-style browser interface with Aviabilet & The Train websites
 */

class PugiBrowser {
  constructor() {
    this.currentUrl = 'pugi://home';
    this.history = [];
    this.currentCity = localStorage.getItem('userCity') || 'Москва';
  }

  // Initialize browser on app launch
  init() {
    this.renderBrowserUI();
    this.attachEventListeners();
  }

  renderBrowserUI() {
    const browserHTML = `
      <div class="pugi-browser">
        <!-- Address Bar -->
        <div class="pugi-addressbar">
          <input 
            type="text" 
            class="pugi-url-input" 
            placeholder="www.pugi.net"
            value="${this.currentUrl}"
          />
          <button class="pugi-back-btn">←</button>
          <button class="pugi-refresh-btn">⟳</button>
        </div>

        <!-- Browser Content -->
        <div class="pugi-content">
          ${this.renderCurrentPage()}
        </div>
      </div>
    `;

    const internetOverlay = document.querySelector('.overlay-internet');
    if (internetOverlay) {
      internetOverlay.innerHTML = browserHTML;
    }
  }

  renderCurrentPage() {
    switch (this.currentUrl) {
      case 'pugi://home':
        return this.renderHomePage();
      case 'www.aviabilet.net':
        return this.renderAviabiletPage();
      case 'www.thetrain.net':
        return this.renderTheTrainPage();
      default:
        return '<div class="pugi-error">404 - Page not found</div>';
    }
  }

  renderHomePage() {
    return `
      <div class="pugi-homepage">
        <div class="pugi-logo">PUGI</div>
        <div class="pugi-searchbar">
          <input type="text" placeholder="Поиск в Pugi..." class="pugi-search-input" />
        </div>
        
        <!-- Banner Grid (2 columns) -->
        <div class="pugi-banner-grid">
          <div class="pugi-banner aviabilet-banner" data-site="www.aviabilet.net">
            <div class="banner-icon">✈️</div>
            <div class="banner-title">Aviabilet</div>
            <div class="banner-desc">Авиабилеты по всей стране</div>
          </div>
          
          <div class="pugi-banner thetrain-banner" data-site="www.thetrain.net">
            <div class="banner-icon">🚂</div>
            <div class="banner-title">The Train</div>
            <div class="banner-desc">Билеты на поезда и электрички</div>
          </div>
        </div>
      </div>
    `;
  }

  renderAviabiletPage() {
    return `
      <div class="aviabilet-page">
        <div class="aviabilet-header">
          <h1>Aviabilet — Авиабилеты</h1>
          <p>Быстрые перелёты по всей стране</p>
        </div>

        <div class="aviabilet-search">
          <div class="flight-from">
            <label>Откуда</label>
            <select class="flight-select from-city">
              <option value="Москва">Москва (МСК)</option>
              <option value="СПБ">Санкт-Петербург (СПБ)</option>
              <option value="Казань">Казань (КЗН)</option>
              <option value="Екатеринбург">Екатеринбург (ЕКБ)</option>
              <option value="Новосибирск">Новосибирск (НВС)</option>
            </select>
          </div>

          <div class="flight-swap">↔️</div>

          <div class="flight-to">
            <label>Куда</label>
            <select class="flight-select to-city">
              <option value="Москва">Москва (МСК)</option>
              <option value="СПБ">Санкт-Петербург (СПБ)</option>
              <option value="Казань">Казань (КЗН)</option>
              <option value="Екатеринбург">Екатеринбург (ЕКБ)</option>
              <option value="Новосибирск">Новосибирск (НВС)</option>
            </select>
          </div>

          <div class="flight-date">
            <label>Дата</label>
            <input type="date" class="flight-date-input" />
          </div>

          <button class="flight-search-btn">Поиск билетов</button>
        </div>

        <div class="flight-results" id="flightResults">
          <!-- Results populated here -->
        </div>
      </div>
    `;
  }

  renderTheTrainPage() {
    return `
      <div class="thetrain-page">
        <div class="thetrain-header">
          <h1>The Train — Поезда</h1>
          <p>Комфортные поездки на любые расстояния</p>
        </div>

        <div class="thetrain-search">
          <div class="train-from">
            <label>Из города</label>
            <select class="train-select from-city">
              <option value="Москва">Москва</option>
              <option value="СПБ">Санкт-Петербург</option>
              <option value="Казань">Казань</option>
              <option value="Екатеринбург">Екатеринбург</option>
              <option value="Новосибирск">Новосибирск</option>
            </select>
          </div>

          <div class="train-swap">⇄</div>

          <div class="train-to">
            <label>В город</label>
            <select class="train-select to-city">
              <option value="Москва">Москва</option>
              <option value="СПБ">Санкт-Петербург</option>
              <option value="Казань">Казань</option>
              <option value="Екатеринбург">Екатеринбург</option>
              <option value="Новосибирск">Новосибирск</option>
            </select>
          </div>

          <div class="train-date">
            <label>Дата</label>
            <input type="date" class="train-date-input" />
          </div>

          <button class="train-search-btn">Поиск поездов</button>
        </div>

        <div class="train-results" id="trainResults">
          <!-- Results populated here -->
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Banner clicks
    document.querySelectorAll('.pugi-banner').forEach(banner => {
      banner.addEventListener('click', () => {
        const site = banner.dataset.site;
        this.navigate(site);
      });
    });

    // URL input navigation
    const urlInput = document.querySelector('.pugi-url-input');
    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.navigate(urlInput.value);
        }
      });
    }

    // Back button
    const backBtn = document.querySelector('.pugi-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }

    // Refresh button
    const refreshBtn = document.querySelector('.pugi-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refresh());
    }

    // Flight search
    const flightSearchBtn = document.querySelector('.flight-search-btn');
    if (flightSearchBtn) {
      flightSearchBtn.addEventListener('click', () => this.searchFlights());
    }

    // Train search
    const trainSearchBtn = document.querySelector('.train-search-btn');
    if (trainSearchBtn) {
      trainSearchBtn.addEventListener('click', () => this.searchTrains());
    }
  }

  navigate(url) {
    this.history.push(this.currentUrl);
    this.currentUrl = url;
    this.renderBrowserUI();
    this.attachEventListeners();
  }

  goBack() {
    if (this.history.length > 0) {
      this.currentUrl = this.history.pop();
      this.renderBrowserUI();
      this.attachEventListeners();
    }
  }

  refresh() {
    this.renderBrowserUI();
    this.attachEventListeners();
  }

  searchFlights() {
    const fromCity = document.querySelector('.from-city').value;
    const toCity = document.querySelector('.to-city').value;
    const date = document.querySelector('.flight-date-input').value;

    const flights = this.generateFlights(fromCity, toCity);
    const resultsHtml = flights.map(flight => `
      <div class="flight-card">
        <div class="flight-time">${flight.departure} → ${flight.arrival}</div>
        <div class="flight-duration">Время в пути: ${flight.duration}</div>
        <div class="flight-price">${flight.price}₽</div>
        <button class="flight-book-btn" data-flight="${JSON.stringify(flight).replace(/"/g, '&quot;')}">
          Купить билет
        </button>
      </div>
    `).join('');

    document.getElementById('flightResults').innerHTML = resultsHtml;

    document.querySelectorAll('.flight-book-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const flight = JSON.parse(e.target.dataset.flight.replace(/&quot;/g, '"'));
        this.purchaseFlight(flight);
      });
    });
  }

  searchTrains() {
    const fromCity = document.querySelector('.from-city').value;
    const toCity = document.querySelector('.to-city').value;
    const date = document.querySelector('.train-date-input').value;

    const trains = this.generateTrains(fromCity, toCity);
    const resultsHtml = trains.map(train => `
      <div class="train-card">
        <div class="train-time">${train.departure} → ${train.arrival}</div>
        <div class="train-duration">Время в пути: ${train.duration}</div>
        <div class="train-type">Класс: ${train.type}</div>
        <div class="train-price">${train.price}₽</div>
        <button class="train-book-btn" data-train="${JSON.stringify(train).replace(/"/g, '&quot;')}">
          Купить билет
        </button>
      </div>
    `).join('');

    document.getElementById('trainResults').innerHTML = resultsHtml;

    document.querySelectorAll('.train-book-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const train = JSON.parse(e.target.dataset.train.replace(/&quot;/g, '"'));
        this.purchaseTrain(train);
      });
    });
  }

  generateFlights(from, to) {
    const hours = ['08:00', '12:30', '16:45', '19:00'];
    return hours.map((time, i) => ({
      departure: time,
      arrival: this.addHours(time, 5),
      duration: '5 часов',
      price: 5000 + i * 1000,
      from,
      to
    }));
  }

  generateTrains(from, to) {
    const hours = ['06:00', '14:00', '20:30'];
    return hours.map((time, i) => ({
      departure: time,
      arrival: this.addHours(time, 72),
      duration: '3 дня',
      type: ['Плацкарт', 'Купе', 'СВ'][i],
      price: 3000 + i * 2000,
      from,
      to
    }));
  }

  addHours(timeStr, hours) {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m + hours * 60;
    const newH = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  purchaseFlight(flight) {
    this.showTravelAnimation('flight', flight.from, flight.to);
    localStorage.setItem('userCity', flight.to);
    this.currentCity = flight.to;
  }

  purchaseTrain(train) {
    this.showTravelAnimation('train', train.from, train.to);
    localStorage.setItem('userCity', train.to);
    this.currentCity = train.to;
  }

  showTravelAnimation(type, from, to) {
    const overlay = document.createElement('div');
    overlay.className = 'travel-animation';
    overlay.innerHTML = `
      <div class="travel-screen">
        <div class="travel-icon">${type === 'flight' ? '✈️' : '🚂'}</div>
        <div class="travel-text">
          ${type === 'flight' ? 'Вылет через 5 минут!' : 'Отправление через 5 минут!'}
        </div>
        <div class="travel-route">${from} → ${to}</div>
      </div>
    `;
    document.querySelector('.phone').appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('fade-out');
      setTimeout(() => {
        overlay.remove();
        this.showArrivalMessage(to);
      }, 500);
    }, 3000);
  }

  showArrivalMessage(city) {
    const message = document.createElement('div');
    message.className = 'arrival-message';
    message.innerHTML = `
      <div class="arrival-text">Вы прилетели в ${city}! ✈️</div>
    `;
    document.querySelector('.phone').appendChild(message);

    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => message.remove(), 500);
    }, 2000);
  }
}

// Initialize when Internet app is opened
const pugiBrowser = new PugiBrowser();
