// Content script that runs on all pages
import { getScraper } from '../lib/scrapers/index.js';

// Don't rerun on the same page
let hasRun = false;

// Track if we're currently checking a bottle
let isCheckingBottle = false;

// Popup related variables
let currentPopup = null;
const POPUP_DISPLAY_TIME = 10000; // 10 seconds

// Start detection after the page has fully loaded
window.addEventListener('load', initBottleDetection);

/**
 * Initializes bottle detection on the page
 */
function initBottleDetection() {
  // Don't run on BAXUS itself
  if (window.location.hostname.includes('baxus.co')) {
    return;
  }
  
  // Don't rerun on the same page
  if (hasRun) return;
  hasRun = true;
  
  // Wait for page to stabilize (important for dynamic sites)
  setTimeout(detectBottle, 1500);
}

/**
 * Attempts to detect a bottle on the current page
 */
async function detectBottle() {
  // Prevent concurrent checks
  if (isCheckingBottle) return;
  isCheckingBottle = true;
  
  try {
    // Get appropriate scraper for the current site
    const scraper = getScraper(window.location.href);
    if (!scraper) {
      isCheckingBottle = false;
      return;
    }
    
    // Attempt to scrape bottle info
    const bottleInfo = scraper();
    if (!bottleInfo || !bottleInfo.name || !bottleInfo.price) {
      isCheckingBottle = false;
      return;
    }
    
    // Send bottle info to background script for processing
    chrome.runtime.sendMessage(
      { type: 'BOTTLE_DETECTED', bottleInfo },
      handleComparisonResult
    );
  } catch (error) {
    console.error('Error in bottle detection:', error);
    isCheckingBottle = false;
  }
}

/**
 * Handles the comparison result from the background script
 * @param {Object} result - Comparison result
 */
function handleComparisonResult(result) {
  isCheckingBottle = false;
  
  if (!result || result.error) {
    return;
  }
  
  // If we found a match, show the popup
  if (result.match) {
    showComparisonPopup(result);
  }
}

/**
 * Shows the comparison popup with the results
 * @param {Object} result - Comparison result data
 */
function showComparisonPopup(result) {
  // Remove any existing popup
  if (currentPopup) {
    document.body.removeChild(currentPopup);
  }
  
  // Create popup element
  const popup = document.createElement('div');
  popup.className = 'honey-barrel-popup';
  popup.setAttribute('aria-live', 'polite');
  
  // Set popup content based on comparison result
  const { bottleInfo, baxusListing, savings, betterDeal } = result;
  
  let statusClass = betterDeal ? 'better-deal' : 'no-savings';
  let savingsText = '';
  
  if (betterDeal) {
    savingsText = `Save $${savings}`;
  } else {
    savingsText = 'No savings available';
  }
  
  // Create popup HTML content
  popup.innerHTML = `
    <div class="honey-barrel-header">
      <span class="honey-barrel-logo"></span>
      <h3>The Honey Barrel</h3>
      <button class="honey-barrel-close" aria-label="Close">&times;</button>
    </div>
    <div class="honey-barrel-content">
      <div class="honey-barrel-match-info">
        <h4>${bottleInfo.name}</h4>
        <div class="honey-barrel-price-comparison">
          <div class="honey-barrel-retail-price">
            <span class="label">Retail:</span>
            <span class="price">$${bottleInfo.price.toFixed(2)}</span>
          </div>
          <div class="honey-barrel-baxus-price">
            <span class="label">BAXUS:</span>
            <span class="price">$${baxusListing.price.toFixed(2)}</span>
          </div>
        </div>
        <div class="honey-barrel-savings ${statusClass}">
          ${savingsText}
        </div>
      </div>
      ${betterDeal ? 
        `<a href="${baxusListing.url}" class="honey-barrel-action-button" target="_blank">
          View on BAXUS
        </a>` : 
        '<div class="honey-barrel-no-action">This is the best price we found</div>'
      }
    </div>
  `;
  
  // Add the popup to the page
  document.body.appendChild(popup);
  currentPopup = popup;
  
  // Add event listener for close button
  const closeButton = popup.querySelector('.honey-barrel-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(popup);
    currentPopup = null;
  });
  
  // Automatically remove popup after display time
  setTimeout(() => {
    if (currentPopup === popup && document.body.contains(popup)) {
      document.body.removeChild(popup);
      currentPopup = null;
    }
  }, POPUP_DISPLAY_TIME);
}

// Listen for URL changes on single page applications
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href;
    hasRun = false;
    setTimeout(initBottleDetection, 1000);
  }
});

observer.observe(document, { subtree: true, childList: true });