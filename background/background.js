// Background service worker
import { fetchBaxusListings } from '../lib/api.js';
import { findMatchingBottle } from '../lib/matcher.js';

// Cache for BAXUS listings to reduce API calls
let baxusListingsCache = null;
let lastFetchTime = 0;
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'BOTTLE_DETECTED') {
    handleBottleDetection(message.bottleInfo, sender.tab.id, sendResponse);
    return true; // Indicates we'll respond asynchronously
  }
});

async function handleBottleDetection(bottleInfo, tabId, sendResponse) {
  try {
    // Get BAXUS listings, using cache if available and not expired
    const baxusListings = await getBaxusListings();
    
    // Find matching bottle in BAXUS listings
    const match = findMatchingBottle(bottleInfo, baxusListings);
    
    if (match) {
      // Calculate potential savings
      const savings = bottleInfo.price > match.price ? 
        (bottleInfo.price - match.price).toFixed(2) : 0;
      
      const response = {
        match: true,
        bottleInfo,
        baxusListing: match,
        savings,
        betterDeal: match.price < bottleInfo.price
      };
      
      sendResponse(response);
    } else {
      sendResponse({ match: false, bottleInfo });
    }
  } catch (error) {
    console.error('Error processing bottle:', error);
    sendResponse({ 
      match: false, 
      error: true, 
      message: 'Error processing bottle comparison' 
    });
  }
}

async function getBaxusListings() {
  const now = Date.now();
  
  // Use cache if available and not expired
  if (baxusListingsCache && (now - lastFetchTime) < CACHE_EXPIRY) {
    return baxusListingsCache;
  }
  
  // Fetch fresh listings
  const listings = await fetchBaxusListings();
  baxusListingsCache = listings;
  lastFetchTime = now;
  
  return listings;
}