/**
 * General retail site scraper that attempts to identify bottle info
 * using common patterns found across e-commerce sites
 * @returns {Object|null} - Bottle info or null if no bottle detected
 */
export function scrapeGeneralRetailSite() {
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
 * @returns {boolean} - True if page appears to be a product page
 */
function isProductPage() {
  // Product pages typically have:
  // 1. Product images
  // 2. Price information
  // 3. Add to cart buttons
  
  const hasProductImage = document.querySelector('img[id*="product"], img[class*="product"], .product-image, .product-img');
  const hasPriceElement = document.querySelector('[class*="price"], [id*="price"], .price, span.amount');
  const hasAddToCartButton = document.querySelector('button[id*="add-to-cart"], button[class*="add-to-cart"], .add-to-cart, [class*="buy-now"]');
  
  return !!(hasProductImage && hasPriceElement && hasAddToCartButton);
}

/**
 * Extracts product name from the page
 * @returns {string} - Product name
 */
function extractProductName() {
  // Try common product name selectors
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
      return cleanProductName(element.textContent.trim());
    }
  }
  
  // Fallback to page title
  const title = document.title;
  if (title) {
    // Clean up title - remove site name and other common elements
    return cleanProductName(title.split('|')[0].split('-')[0].trim());
  }
  
  return '';
}

/**
 * Cleans product name from common patterns
 * @param {string} name - Raw product name
 * @returns {string} - Cleaned product name
 */
function cleanProductName(name) {
  if (!name) return '';
  
  // Remove common suffixes like "- 750ML" or "| 80 Proof"
  return name
    .replace(/(\d+\s*ml|\d+\s*cl|\d+\s*l)$/i, '')
    .replace(/\d+\s*proof/i, '')
    .replace(/\s*-\s*$/, '')
    .replace(/\s*\|\s*$/, '')
    .trim();
}

/**
 * Extracts brand name from the page
 * @returns {string} - Brand name
 */
function extractBrand() {
  // Try common brand selectors
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
  
  // Try extracting from product name
  const productName = extractProductName();
  if (productName) {
    // First word is often the brand
    const firstWord = productName.split(' ')[0];
    if (firstWord && firstWord.length > 2) {
      return firstWord;
    }
  }
  
  return '';
}

/**
 * Extracts price from the page
 * @returns {number} - Price as a number
 */
function extractPrice() {
  // Try common price selectors
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
      // Extract numeric value using regex
      const match = text.match(/[\d,.]+/);
      if (match) {
        // Convert to number, removing any non-numeric chars except decimal point
        return parseFloat(match[0].replace(/[^\d.]/g, ''));
      }
    }
  }
  
  // Try looking for data attributes
  const priceElements = document.querySelectorAll('[data-price]');
  for (const el of priceElements) {
    const price = el.getAttribute('data-price');
    if (price) {
      return parseFloat(price);
    }
  }
  
  return 0;
}

/**
 * Extracts vintage year from the page
 * @returns {string} - Vintage year
 */
function extractVintage() {
  // Look for vintage in product name or description
  const productName = extractProductName();
  const nameMatch = productName.match(/\b(19|20)\d{2}\b/);
  if (nameMatch) {
    return nameMatch[0];
  }
  
  // Look for vintage in description
  const descriptionElements = document.querySelectorAll('.product-description, .product__description, [itemprop="description"]');
  for (const el of descriptionElements) {
    const text = el.textContent;
    const match = text.match(/\b(19|20)\d{2}\b/);
    if (match) {
      return match[0];
    }
  }
  
  // Look for specific vintage elements
  const vintageElements = document.querySelectorAll('[class*="vintage"], [id*="vintage"]');
  for (const el of vintageElements) {
    const text = el.textContent;
    const match = text.match(/\b(19|20)\d{2}\b/);
    if (match) {
      return match[0];
    }
  }
  
  return '';
}

/**
 * Extracts volume information from the page
 * @returns {string} - Volume information
 */
function extractVolume() {
  // Common volume patterns in product names and specs
  const volumePatterns = [
    /(\d+(?:\.\d+)?)\s*ml/i,
    /(\d+(?:\.\d+)?)\s*cl/i,
    /(\d+(?:\.\d+)?)\s*l\b/i,
    /(\d+(?:\.\d+)?)\s*oz/i,
    /(\d+(?:\.\d+)?)\s*liter/i
  ];
  
  // Look in product name
  const productName = extractProductName();
  for (const pattern of volumePatterns) {
    const match = productName.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  // Look in product specifications
  const specElements = document.querySelectorAll('.product-specs, .product-details, .product__details, .product-info, [class*="specification"]');
  for (const el of specElements) {
    const text = el.textContent;
    for (const pattern of volumePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
  }
  
  // Look for volume in structured data
  const volumeElements = document.querySelectorAll('[class*="volume"], [id*="volume"], [data-volume]');
  for (const el of volumeElements) {
    const text = el.textContent.trim();
    if (text) {
      for (const pattern of volumePatterns) {
        const match = text.match(pattern);
        if (match) {
          return match[0];
        }
      }
    }
  }
  
  return '';
}

/**
 * Detects product category (whisky or wine)
 * @returns {string} - Detected category
 */
function detectCategory() {
  const pageText = document.body.textContent.toLowerCase();
  const productName = extractProductName().toLowerCase();
  
  // Check for whisky terms
  const whiskyTerms = ['whisky', 'whiskey', 'bourbon', 'scotch', 'rye'];
  for (const term of whiskyTerms) {
    if (productName.includes(term) || pageText.includes(term)) {
      return 'whisky';
    }
  }
  
  // Check for wine terms
  const wineTerms = ['wine', 'red wine', 'white wine', 'rose', 'champagne', 'sparkling wine'];
  for (const term of wineTerms) {
    if (productName.includes(term) || pageText.includes(term)) {
      return 'wine';
    }
  }
  
  // Check for breadcrumbs or category elements
  const categoryElements = document.querySelectorAll('.breadcrumbs, .breadcrumb, [itemprop="breadcrumb"], .product-category');
  for (const el of categoryElements) {
    const text = el.textContent.toLowerCase();
    
    for (const term of whiskyTerms) {
      if (text.includes(term)) return 'whisky';
    }
    
    for (const term of wineTerms) {
      if (text.includes(term)) return 'wine';
    }
  }
  
  return 'unknown';
}