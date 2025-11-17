/**
 * In-Memory Runtime Cache for Public ReachMe URLs
 * Avoids database lookups on every hit
 */

class PublicReachMeCache {
  constructor() {
    // Map: urlCode -> { userId, publicReachMeId, isActive, deactivateAt }
    this.urlMap = new Map();

    // Map: userId -> Set of urlCodes
    this.userUrlsMap = new Map();
  }

  /**
   * Add or update a public ReachMe URL in cache
   */
  set(urlCode, data) {
    const { userId, publicReachMeId, isActive, deactivateAt } = data;

    this.urlMap.set(urlCode, {
      userId,
      publicReachMeId,
      isActive,
      deactivateAt: deactivateAt ? new Date(deactivateAt) : null,
    });

    // Update user's URL set
    if (!this.userUrlsMap.has(userId)) {
      this.userUrlsMap.set(userId, new Set());
    }
    this.userUrlsMap.get(userId).add(urlCode);
  }

  /**
   * Get public ReachMe data by URL code
   */
  get(urlCode) {
    return this.urlMap.get(urlCode);
  }

  /**
   * Check if URL code exists
   */
  has(urlCode) {
    return this.urlMap.has(urlCode);
  }

  /**
   * Deactivate a URL
   */
  deactivate(urlCode) {
    const data = this.urlMap.get(urlCode);
    if (data) {
      data.isActive = false;
      this.urlMap.set(urlCode, data);
    }
  }

  /**
   * Update deactivation time
   */
  updateDeactivateAt(urlCode, deactivateAt) {
    const data = this.urlMap.get(urlCode);
    if (data) {
      data.deactivateAt = deactivateAt ? new Date(deactivateAt) : null;
      this.urlMap.set(urlCode, data);
    }
  }

  /**
   * Get all URLs for a user
   */
  getUserUrls(userId) {
    const urlCodes = this.userUrlsMap.get(userId);
    if (!urlCodes) return [];

    return Array.from(urlCodes).map((code) => ({
      urlCode: code,
      ...this.urlMap.get(code),
    }));
  }

  /**
   * Remove URL from cache
   */
  delete(urlCode) {
    const data = this.urlMap.get(urlCode);
    if (data) {
      // Remove from user's URL set
      const userUrls = this.userUrlsMap.get(data.userId);
      if (userUrls) {
        userUrls.delete(urlCode);
        if (userUrls.size === 0) {
          this.userUrlsMap.delete(data.userId);
        }
      }
    }
    this.urlMap.delete(urlCode);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.urlMap.clear();
    this.userUrlsMap.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      totalUrls: this.urlMap.size,
      totalUsers: this.userUrlsMap.size,
      activeUrls: Array.from(this.urlMap.values()).filter((d) => d.isActive)
        .length,
    };
  }
}

// Singleton instance
const publicReachMeCache = new PublicReachMeCache();

module.exports = publicReachMeCache;
