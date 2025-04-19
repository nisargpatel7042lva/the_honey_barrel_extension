// Import all site-specific scrapers
import { scrapeGeneralRetailSite } from './generalRetail.js';
import { scrapeTotalWine } from './totalWine.js';
import { scrapeReserveBar } from './reserveBar.js';
import { scrapeWineEnthusiast } from './wineEnthusiast.js';

// Site matcher configuration
const SITE_MATCHERS = [
  {
    pattern: /totalwine\.com/i,
    scraper: scrapeTotalWine
  },
  {
    pattern: /reservebar\.com/i,
    scraper: scrapeReserveBar
  },
  {
    pattern: /wineenthusiast\.com/i,
    scraper: scrapeWineEnthusiast
  }
];

/**
 * Gets the appropriate scraper for the current site
 * @param {string} url - Current page URL
 * @returns {Function} - Scraper function for the site
 */
export function getScraper(url) {
  if (!url) return null;
  
  // Check for specific site matchers
  for (const matcher of SITE_MATCHERS) {
    if (matcher.pattern.test(url)) {
      return matcher.scraper;
    }
  }
  
  // Default to general retail scraper
  return scrapeGeneralRetailSite;
}