/**
 * SELLER RATING SYSTEM
 * Tracks seller behavior (punctuality, fraud, etc)
 */

class SellerRatingSystem {
  constructor() {
    this.sellers = JSON.parse(localStorage.getItem('sellers')) || {};
  }

  /**
   * Initialize seller profile
   */
  initializeSeller(sellerId, sellerName, city) {
    if (!this.sellers[sellerId]) {
      this.sellers[sellerId] = {
        id: sellerId,
        name: sellerName,
        city,
        rating: 5.0, // 0-5 stars
        totalSales: 0,
        successfulDeals: 0,
        cancelledDeals: 0,
        fraudAttempts: 0,
        lateArrivals: 0,
        totalReviews: 0,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('sellers', JSON.stringify(this.sellers));
    }
    return this.sellers[sellerId];
  }

  /**
   * Update seller rating after completed deal
   */
  updateSellerAfterDeal(sellerId, dealOutcome) {
    const seller = this.sellers[sellerId];
    if (!seller) return;

    seller.totalSales++;

    switch (dealOutcome) {
      case 'success':
        seller.successfulDeals++;
        // Rating stays same or slightly increases
        seller.rating = Math.min(5.0, seller.rating + 0.01);
        break;

      case 'buyer_late':
        // Buyer was late (not seller's fault)
        seller.successfulDeals++;
        break;

      case 'fraud_detected':
        // Seller tried to sell fake item
        seller.fraudAttempts++;
        seller.rating = Math.max(0.5, seller.rating - 1.0);
        break;

      case 'cancelled_by_seller':
        // Seller cancelled meeting
        seller.cancelledDeals++;
        seller.rating = Math.max(0.5, seller.rating - 0.5);
        break;

      case 'cancelled_by_buyer':
        // Buyer cancelled (not seller's fault)
        seller.cancelledDeals++;
        break;

      case 'late_arrival':
        // Seller was late for meeting
        seller.lateArrivals++;
        seller.rating = Math.max(0.5, seller.rating - 0.3);
        break;
    }

    // Cap rating
    seller.rating = Math.max(0.5, Math.min(5.0, seller.rating));
    seller.totalReviews++;

    localStorage.setItem('sellers', JSON.stringify(this.sellers));
  }

  /**
   * Show seller info card (rating, stats, etc)
   */
  showSellerCard(sellerId) {
    const seller = this.sellers[sellerId];
    if (!seller) return;

    const stars = this.getRatingStars(seller.rating);
    const trustLevel = this.getTrustLevel(seller.rating);

    const cardHTML = `
      <div class="seller-info-card">
        <div class="seller-header">
          <div class="seller-avatar">${seller.name.charAt(0)}</div>
          <div class="seller-name-section">
            <h3>${seller.name}</h3>
            <div class="seller-location">📍 ${seller.city}</div>
          </div>
        </div>

        <div class="seller-rating-section">
          <div class="seller-rating">
            <div class="rating-stars">${stars}</div>
            <div class="rating-score">${seller.rating.toFixed(1)}</div>
          </div>
          <div class="trust-badge trust-${trustLevel}">
            ${this.getTrustBadgeText(trustLevel)}
          </div>
        </div>

        <div class="seller-stats">
          <div class="stat-item">
            <div class="stat-label">Успешных сделок</div>
            <div class="stat-value">${seller.successfulDeals}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Отменено</div>
            <div class="stat-value">${seller.cancelledDeals}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Попыток подделок</div>
            <div class="stat-value fraud-count">${seller.fraudAttempts}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Опоздания</div>
            <div class="stat-value late-count">${seller.lateArrivals}</div>
          </div>
        </div>

        ${seller.fraudAttempts > 2 ? `
          <div class="seller-warning">
            ⚠️ Этот продавец неоднократно пытался продать подделки
          </div>
        ` : ''}

        ${seller.lateArrivals > 3 ? `
          <div class="seller-warning">
            ⚠️ Продавец часто опаздывает на встречи
          </div>
        ` : ''}
      </div>
    `;

    return this.createElementFromHTML(cardHTML);
  }

  /**
   * Get rating stars visualization
   */
  getRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
      stars += '★';
    }

    if (hasHalf) {
      stars += '◯';
    }

    for (let i = stars.length; i < 5; i++) {
      stars += '☆';
    }

    return stars;
  }

  /**
   * Get trust level badge
   */
  getTrustLevel(rating) {
    if (rating >= 4.5) return 'excellent';
    if (rating >= 4.0) return 'good';
    if (rating >= 3.0) return 'neutral';
    if (rating >= 2.0) return 'poor';
    return 'dangerous';
  }

  getTrustBadgeText(level) {
    const texts = {
      'excellent': '✅ Надёжный',
      'good': '✓ Хороший',
      'neutral': '◯ Средний',
      'poor': '⚠️ Рискованно',
      'dangerous': '🚫 Опасный'
    };
    return texts[level];
  }

  /**
   * Filter marketplace by seller rating
   */
  getListingsByRating(listings, minRating = 0) {
    return listings.filter(listing => {
      const seller = this.sellers[listing.sellerId];
      return seller && seller.rating >= minRating;
    });
  }

  /**
   * Show rating warning before purchase
   */
  showRatingWarning(sellerId) {
    const seller = this.sellers[sellerId];
    if (!seller) return;

    if (seller.rating < 2.0) {
      const warningHTML = `
        <div class="rating-warning-modal">
          <div class="warning-overlay"></div>
          <div class="warning-card">
            <div class="warning-icon">⚠️</div>
            <h3>Низкий рейтинг продавца</h3>
            <p>У этого продавца рейтинг ${seller.rating.toFixed(1)}/5</p>
            <p class="warning-details">
              ${seller.fraudAttempts > 0 ? `Попыток подделок: ${seller.fraudAttempts}<br>` : ''}
              ${seller.lateArrivals > 0 ? `Опоздания: ${seller.lateArrivals}<br>` : ''}
            </p>
            <p class="warning-note">Вы уверены, что хотите продолжить?</p>
            <div class="warning-buttons">
              <button class="warning-cancel">Отмена</button>
              <button class="warning-continue">Продолжить</button>
            </div>
          </div>
        </div>
      `;

      const modal = this.createElementFromHTML(warningHTML);
      document.body.appendChild(modal);

      return new Promise((resolve) => {
        modal.querySelector('.warning-cancel').addEventListener('click', () => {
          modal.remove();
          resolve(false);
        });

        modal.querySelector('.warning-continue').addEventListener('click', () => {
          modal.remove();
          resolve(true);
        });
      });
    }

    return Promise.resolve(true);
  }

  /**
   * Get seller by ID
   */
  getSeller(sellerId) {
    return this.sellers[sellerId];
  }

  /**
   * Get all sellers sorted by rating
   */
  getTopSellers(limit = 10) {
    return Object.values(this.sellers)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Get suspicious sellers (fraud attempts or low rating)
   */
  getSuspiciousSellers() {
    return Object.values(this.sellers).filter(
      seller => seller.fraudAttempts > 0 || seller.rating < 2.0
    );
  }

  createElementFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
  }
}

// Export
window.SellerRatingSystem = SellerRatingSystem;

const ratingSystem = new SellerRatingSystem();
