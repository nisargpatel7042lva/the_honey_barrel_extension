// Content script that runs on all pages
const BAXUS_API = 'https://services.baxus.co/api/search/listings';

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
    console.log('Honey Barrel: Running detectBottle');
    // Get bottle info
    const bottleInfo = scrapeProductInfo();
    console.log('Honey Barrel: Scraped bottle info', bottleInfo);
    if (!bottleInfo || !bottleInfo.name || !bottleInfo.price) {
      isCheckingBottle = false;
      return;
    }
    
    // Send bottle info to background for matching
    chrome.runtime.sendMessage({
      type: 'BOTTLE_DETECTED',
      bottleInfo: bottleInfo
    }, (response) => {
      if (response && response.match) {
        showComparisonPopup({
          match: true,
          bottleInfo: response.bottleInfo,
          baxusListing: response.baxusListing,
          savings: response.savings,
          betterDeal: response.betterDeal
        });
      }
      isCheckingBottle = false;
    });
  } catch (error) {
    console.error('Error in bottle detection:', error);
    isCheckingBottle = false;
  }
}

/**
 * Scrapes product information from the current page
 */
function scrapeProductInfo() {
  // Check if current page likely contains a single product
  if (!isProductPage()) return null;
  
  try {
    // Extract product details from the page
    const bottleInfo = {
      name: extractProductName(),
      brand: extractBrand(),
      price: extractPrice(),
      vintage: extractVintage(),
      volume: extractVolume(),
      category: detectCategory(),
      url: window.location.href,
    };

    // Only return if we have at minimum a name and price
    if (bottleInfo.name && bottleInfo.price > 0) {
      return bottleInfo;
    }
    
    return null;
  } catch (error) {
    console.error('Error scraping bottle info:', error);
    return null;
  }
}

/**
 * Determines if current page is likely a product page
 */
function isProductPage() {
  const hasProductImage = document.querySelector('img[id*="product"], img[class*="product"], .product-image, .product-img');
  const hasPriceElement = document.querySelector('[class*="price"], [id*="price"], .price, span.amount');
  const hasAddToCartButton = document.querySelector('button[id*="add-to-cart"], button[class*="add-to-cart"], .add-to-cart, [class*="buy-now"]');
  
  return !!(hasProductImage && hasPriceElement && hasAddToCartButton);
}

/**
 * Extracts product name from the page
 */
function extractProductName() {
  const selectors = [
    'h1[itemprop="name"]',
    'h1.product-title',
    'h1.product-name',
    'h1.product_title',
    'h1.product_name',
    '.product-title h1',
    '[data-testid="product-name"]',
    '#productTitle',
    '.product-single__title',
    '.product-name h1',
    'h1:first-of-type'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return document.title.split('|')[0].split('-')[0].trim();
}

/**
 * Extracts brand name from the page
 */
function extractBrand() {
  const selectors = [
    '[itemprop="brand"]',
    '.product-brand',
    '.product_brand',
    '[data-testid="product-brand"]',
    '.brand-name',
    '.product-meta__vendor',
    '.vendor'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return '';
}

/**
 * Extracts price from the page
 */
function extractPrice() {
  const selectors = [
    '[itemprop="price"]',
    '[data-price-type="finalPrice"]',
    '.product-price',
    '.price-item--regular',
    '.current-price',
    '#priceblock_ourprice',
    '.price-sales',
    '.sales',
    '[data-testid="price"]',
    '.product__price',
    '.price'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      const text = element.textContent.trim();
      const match = text.match(/[\d,.]+/);
      if (match) {
        return parseFloat(match[0].replace(/[^\d.]/g, ''));
      }
    }
  }
  
  return 0;
}

/**
 * Extracts vintage year from the page
 */
function extractVintage() {
  const productName = extractProductName();
  const nameMatch = productName.match(/\b(19|20)\d{2}\b/);
  if (nameMatch) {
    return nameMatch[0];
  }
  
  return '';
}

/**
 * Extracts volume information from the page
 */
function extractVolume() {
  const volumePatterns = [
    /(\d+(?:\.\d+)?)\s*ml/i,
    /(\d+(?:\.\d+)?)\s*cl/i,
    /(\d+(?:\.\d+)?)\s*l\b/i,
    /(\d+(?:\.\d+)?)\s*oz/i
  ];
  
  const productName = extractProductName();
  for (const pattern of volumePatterns) {
    const match = productName.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return '';
}

/**
 * Detects product category (whisky or wine)
 */
function detectCategory() {
  const pageText = document.body.textContent.toLowerCase();
  const productName = extractProductName().toLowerCase();
  
  const whiskyTerms = ['whisky', 'whiskey', 'bourbon', 'scotch', 'rye'];
  const wineTerms = ['wine', 'red wine', 'white wine', 'rose', 'champagne'];
  
  for (const term of whiskyTerms) {
    if (productName.includes(term) || pageText.includes(term)) {
      return 'whisky';
    }
  }
  
  for (const term of wineTerms) {
    if (productName.includes(term) || pageText.includes(term)) {
      return 'wine';
    }
  }
  
  return 'unknown';
}

/**
 * Shows the comparison popup with the results
 */
function showComparisonPopup(result) {
  console.log('Honey Barrel: Showing popup', result);
  if (currentPopup) {
    document.body.removeChild(currentPopup);
  }
  
  const popup = document.createElement('div');
  popup.className = 'honey-barrel-popup';
  
  const { bottleInfo, baxusListing, savings, betterDeal } = result;
  
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
        <div class="honey-barrel-savings ${betterDeal ? 'better-deal' : 'no-savings'}">
          ${betterDeal ? `Save $${savings}` : 'No savings available'}
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
  
  document.body.appendChild(popup);
  currentPopup = popup;
  
  const closeButton = popup.querySelector('.honey-barrel-close');
  closeButton.addEventListener('click', () => {
    document.body.removeChild(popup);
    currentPopup = null;
  });
  
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