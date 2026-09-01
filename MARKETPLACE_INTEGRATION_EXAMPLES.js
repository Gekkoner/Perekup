/**
 * MARKETPLACE INTEGRATION EXAMPLES
 * Copy-paste ready code for A8ito marketplace
 */

/* ============ EXAMPLE 1: Initialize Systems on Page Load ============ */

// Add this to your index.html or main app initialization
function initializeAllSystems() {
  // Create instances
  window.feed = new CityPrioritizedFeed();
  window.botChat = new SellerBotChat();
  window.pickupSystem = new PickupSystem();
  window.deliverySystem = new DeliverySystem();
  window.ratingSystem = new SellerRatingSystem();
  window.pugiBrowser = new PugiBrowser();

  console.log('✅ All marketplace systems initialized');
}

// Call on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeAllSystems);

/* ============ EXAMPLE 2: Display Marketplace Feed with City Priority ============ */

function renderMarketplaceFeed(category = null) {
  const feedContainer = document.querySelector('.a8-marketplace-feed');
  if (!feedContainer) return;

  // Get prioritized listings
  const html = window.feed.renderFeedWithCityPriority(category);
  feedContainer.innerHTML = html;

  // Add click listeners to all listing cards
  document.querySelectorAll('.listing-card').forEach(card => {
    card.addEventListener('click', () => {
      const listingId = card.dataset.id;
      const listings = JSON.parse(localStorage.getItem('listings')) || [];
      const listing = listings.find(l => l.id === listingId);

      if (listing) {
        openListingDetail(listing);
      }
    });
  });
}

// Call this after marketplace loads
setTimeout(() => renderMarketplaceFeed('категория'), 500);

/* ============ EXAMPLE 3: Handle Listing Click & Open Chat ============ */

function openListingDetail(listing) {
  const buyerId = 'currentUser'; // Replace with actual user ID
  const chatId = window.botChat.initiateBotChat(buyerId, listing.id, listing);

  // Open chat modal
  const chatHTML = `
    <div class="chat-modal" id="chatModal_${chatId}">
      <div class="chat-overlay"></div>
      <div class="chat-sheet">
        <div class="chat-header">
          <h2>${listing.name}</h2>
          <button class="chat-close">✕</button>
        </div>

        <div class="chat-body">
          <div class="listing-preview">
            <img src="${listing.image}" alt="${listing.name}" />
            <div class="preview-info">
              <div class="preview-name">${listing.name}</div>
              <div class="preview-price">${listing.price}₽</div>
              <div class="preview-seller">от ${listing.sellerName}</div>
            </div>
          </div>

          <div class="chat-messages" id="messages_${chatId}"></div>
        </div>

        <div class="chat-input-area">
          <input 
            type="text" 
            class="chat-input" 
            placeholder="Напишите продавцу..."
            data-chat-id="${chatId}"
            data-listing-id="${listing.id}"
            data-seller-id="${listing.sellerId}"
          />
          <button class="chat-send">➤</button>
        </div>
      </div>
    </div>
  `;

  document.body.innerHTML += chatHTML;
  attachChatListeners(chatId, listing);
}

function attachChatListeners(chatId, listing) {
  // Close modal
  document.querySelector(`#chatModal_${chatId} .chat-close`).addEventListener('click', () => {
    document.getElementById(`chatModal_${chatId}`).remove();
  });

  // Send message
  const input = document.querySelector(`[data-chat-id="${chatId}"]`);
  const sendBtn = document.querySelector(`#chatModal_${chatId} .chat-send`);

  sendBtn.addEventListener('click', () => {
    const message = input.value.trim();
    if (message) {
      window.botChat.handleUserMessage(chatId, message);
      input.value = '';
    }
  });

  // Quick action buttons - Self-pickup or Delivery
  setTimeout(() => {
    const messagesDiv = document.getElementById(`messages_${chatId}`);
    const actionsHTML = `
      <div class="chat-quick-actions">
        <button class="action-btn pickup-btn" data-action="pickup">
          📍 Самовывоз
        </button>
        <button class="action-btn delivery-btn" data-action="delivery">
          🚚 Доставка
        </button>
      </div>
    `;
    messagesDiv.insertAdjacentHTML('beforeend', actionsHTML);

    // Attach action listeners
    document.querySelector(`#chatModal_${chatId} .pickup-btn`).addEventListener('click', () => {
      window.pickupSystem.openSelfPickupModal(
        listing.id,
        listing.sellerId,
        listing.city,
        listing.price
      );
    });

    document.querySelector(`#chatModal_${chatId} .delivery-btn`).addEventListener('click', () => {
      // Check seller rating first
      window.ratingSystem.showRatingWarning(listing.sellerId).then(confirmed => {
        if (confirmed) {
          window.deliverySystem.openDeliveryModal(
            listing.id,
            listing.sellerId,
            listing.city,
            listing.price
          );
        }
      });
    });
  }, 1500);
}

/* ============ EXAMPLE 4: Display Seller Info Card ============ */

function showSellerInfo(sellerId) {
  const card = window.ratingSystem.showSellerCard(sellerId);
  const modalHTML = `
    <div class="seller-modal" id="sellerModal_${sellerId}">
      <div class="seller-overlay"></div>
      <div class="seller-card-container">
        ${card.outerHTML}
        <button class="seller-close">Закрыть</button>
      </div>
    </div>
  `;

  document.body.innerHTML += modalHTML;

  document.querySelector(`#sellerModal_${sellerId} .seller-close`).addEventListener('click', () => {
    document.getElementById(`sellerModal_${sellerId}`).remove();
  });
}

/* ============ EXAMPLE 5: Create Listing as Seller ============ */

function createNewListing() {
  const formHTML = `
    <div class="create-listing-modal">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <h2>Создать объявление</h2>
        
        <input type="text" class="form-input" placeholder="Название товара" id="itemName" />
        <input type="number" class="form-input" placeholder="Цена" id="itemPrice" />
        
        <select class="form-input" id="itemCondition">
          <option>Новое</option>
          <option>Как новое</option>
          <option>Хорошее</option>
          <option>Удовлетворительное</option>
        </select>

        <select class="form-input" id="itemCity">
          <option>Москва</option>
          <option>СПБ</option>
          <option>Казань</option>
          <option>Екатеринбург</option>
          <option>Новосибирск</option>
        </select>

        <label>
          <input type="checkbox" id="authCheck" />
          ✓ Оригинальный товар (включить проверку подлинности)
        </label>

        <button class="create-btn">Опубликовать</button>
        <button class="cancel-btn">Отмена</button>
      </div>
    </div>
  `;

  document.body.innerHTML += formHTML;

  document.querySelector('.create-btn').addEventListener('click', () => {
    const name = document.querySelector('#itemName').value;
    const price = parseFloat(document.querySelector('#itemPrice').value);
    const condition = document.querySelector('#itemCondition').value;
    const city = document.querySelector('#itemCity').value;
    const hasAuth = document.querySelector('#authCheck').checked;

    const listing = window.botChat.createSellerListing(
      name,
      price,
      condition,
      city,
      hasAuth
    );

    // Initialize seller profile
    window.ratingSystem.initializeSeller('sellerId', 'Your Name', city);

    document.querySelector('.create-listing-modal').remove();
    alert('✅ Объявление опубликовано!');
  });

  document.querySelector('.cancel-btn').addEventListener('click', () => {
    document.querySelector('.create-listing-modal').remove();
  });
}

/* ============ EXAMPLE 6: Handle Meeting Arrival ============ */

function checkIfPlayerArrivedAtMeeting(playerCurrentLocation, meetingLocation) {
  // This function is called when player enters a location
  if (playerCurrentLocation === meetingLocation) {
    // Get active meetings for this location
    const meetings = JSON.parse(localStorage.getItem('meetings')) || [];
    const activeMeeting = meetings.find(
      m => m.location === meetingLocation && 
           m.status === 'scheduled' &&
           isTimeInWindow(new Date(), m.date, m.time)
    );

    if (activeMeeting) {
      window.pickupSystem.handleMeetingArrival(activeMeeting.id);
    }
  }
}

function isTimeInWindow(currentTime, meetingDate, meetingTime) {
  // Check if current time is within 1 hour of meeting time
  const [hours, minutes] = meetingTime.split(':');
  const meetingDateTime = new Date(meetingDate);
  meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

  const diff = currentTime - meetingDateTime;
  const minutesDiff = Math.floor(diff / 60000);

  return minutesDiff >= -60 && minutesDiff <= 60;
}

/* ============ EXAMPLE 7: Pugi Browser Integration ============ */

function openPugiBrowser() {
  const browserHTML = `
    <div class="pugi-browser" id="pugiBrowserApp">
      <div class="pugi-addressbar">
        <button class="pugi-back-btn">←</button>
        <input type="text" class="pugi-url-input" value="pugi.app/home" />
        <button class="pugi-refresh-btn">⟳</button>
      </div>

      <div class="pugi-content" id="pugiContent">
        <div class="pugi-homepage">
          <div class="pugi-logo">Pugi</div>
          
          <div class="pugi-searchbar">
            <input type="text" class="pugi-search-input" placeholder="Поиск маршрутов..." />
          </div>

          <div class="pugi-banner-grid">
            <div class="pugi-banner aviabilet-banner" data-app="aviabilet">
              <div class="banner-icon">✈️</div>
              <div class="banner-title">Aviabilet</div>
              <div class="banner-desc">Рейсы самолета (5 часов)</div>
            </div>
            <div class="pugi-banner thetrain-banner" data-app="thetrain">
              <div class="banner-icon">🚂</div>
              <div class="banner-title">The Train</div>
              <div class="banner-desc">Поезда (3 дня)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add to DOM
  const mainApp = document.querySelector('.app-container');
  mainApp.insertAdjacentHTML('beforeend', browserHTML);

  // Attach listeners
  document.querySelectorAll('.pugi-banner').forEach(banner => {
    banner.addEventListener('click', () => {
      const app = banner.dataset.app;
      if (app === 'aviabilet') {
        window.pugiBrowser.showAviabiletPage();
      } else if (app === 'thetrain') {
        window.pugiBrowser.showTheTrainPage();
      }
    });
  });
}

/* ============ EXAMPLE 8: Authenticity Check on Purchase ============ */

function startAuthenticityCheck(listing, meetingData) {
  if (!listing.hasAuthenticityCheck) {
    // No check needed
    completePurchase(listing);
    return;
  }

  // Show buyer side check (always passes)
  window.pickupSystem.showAuthenticationCheck(listing, meetingData);

  // After check passes, complete purchase
  setTimeout(() => {
    completePurchase(listing);
  }, 5000);
}

function completePurchase(listing) {
  // Add to inventory
  let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
  inventory.push({
    id: 'item_' + Date.now(),
    ...listing,
    purchasedAt: new Date().toISOString()
  });

  // Deduct money
  let balance = parseFloat(localStorage.getItem('balance') || '0');
  balance -= listing.price;

  // Update seller balance
  let sellerBalance = parseFloat(localStorage.getItem('sellerBalance') || '0');
  sellerBalance += listing.price;

  localStorage.setItem('inventory', JSON.stringify(inventory));
  localStorage.setItem('balance', balance.toString());
  localStorage.setItem('sellerBalance', sellerBalance.toString());

  // Show success
  const successHTML = `
    <div class="purchase-success">
      <div class="success-card">
        <div class="success-icon">✅</div>
        <h2>Покупка завершена!</h2>
        <p>${listing.name}</p>
        <div class="success-price">-${listing.price}₽</div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', successHTML);

  setTimeout(() => {
    document.querySelector('.purchase-success').remove();
  }, 3000);

  // Update seller rating
  window.ratingSystem.updateSellerAfterDeal(listing.sellerId, 'success');
}

/* ============ EXAMPLE 9: Display Seller Rating Before Purchase ============ */

async function confirmPurchaseWithRatingCheck(listing) {
  const seller = window.ratingSystem.getSeller(listing.sellerId);

  if (seller && seller.rating < 2.0) {
    // Show warning
    const confirmed = await window.ratingSystem.showRatingWarning(listing.sellerId);
    if (!confirmed) {
      return; // User cancelled
    }
  }

  // Proceed with purchase
  startAuthenticityCheck(listing, {});
}

/* ============ EXAMPLE 10: Travel via Pugi ============ */

function travelToCity(fromCity, toCity, travelType) {
  const duration = travelType === 'flight' ? 5 : 3; // hours or days

  // Show travel animation
  const animationHTML = `
    <div class="travel-animation" id="travelAnim">
      <div class="travel-screen">
        <div class="travel-icon">${travelType === 'flight' ? '✈️' : '🚂'}</div>
        <div class="travel-text">Путешествие в ${toCity}</div>
        <div class="travel-route">${fromCity} → ${toCity}</div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', animationHTML);

  // Simulate travel
  setTimeout(() => {
    // Update player city
    localStorage.setItem('userCity', toCity);
    window.feed.updateUserCity(toCity);

    // Show arrival message
    const arrivalHTML = `
      <div class="arrival-message">
        ✅ Вы прибыли в ${toCity}!
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', arrivalHTML);

    // Fade out animation
    document.getElementById('travelAnim').classList.add('fade-out');

    setTimeout(() => {
      document.getElementById('travelAnim').remove();
      document.querySelector('.arrival-message').remove();

      // Refresh feed for new city
      renderMarketplaceFeed();
    }, 1500);
  }, duration * 1000);
}

/* ============ QUICK START CHECKLIST ============ */

/*
  1. ✅ Add all <script> tags to index.html:
     - city-feed-and-bot-chat.js
     - delivery-system.js
     - seller-rating-system.js
     - self-pickup-system.js (not provided yet, needs creation)
     
  2. ✅ Import all CSS files:
     - styles-self-pickup.css
     - styles-delivery-rating.css
     
  3. ✅ Call initializeAllSystems() on page load
     
  4. ✅ Replace marketplace feed rendering with renderMarketplaceFeed()
     
  5. ✅ Add listing click handlers with openListingDetail()
     
  6. ✅ Connect game location system with checkIfPlayerArrivedAtMeeting()
     
  7. ✅ Add Pugi browser via openPugiBrowser()
     
  8. ✅ Use confirmPurchaseWithRatingCheck() before any purchase
     
  9. ✅ Use travelToCity() when booking flights/trains
     
  10. ✅ Show seller info with showSellerInfo(sellerId)
*/

console.log('✅ Integration examples loaded!');
console.log('Ready to integrate with marketplace.');
