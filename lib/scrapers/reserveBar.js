/**
 * ReserveBar.com specific scraper
 * @returns {Object|null} - Bottle info or null if no bottle detected
 */
export function scrapeReserveBar() {
  try {
    // Check if we're on a product page
    if (!document.querySelector('.product-single')) {
      return null;
    }
    
    // Extract name from the main product title
    const nameElement = document.querySelector('.product-single__title');
    if (!nameElement) return null;
    
    const name = nameElement.textContent.trim();
    
    // Extract brand
    let brand = '';
    const brandElement = document.querySelector('.product-single__vendor');
    if (brandElement) {
      brand = brandElement.textContent.trim();
    }
    
    // Extract price
    let price = 0;
    const priceElement = document.querySelector('.product__price');
    if (priceElement) {
      const priceText = priceElement.textContent.trim();
      const priceMatch = priceText.match(/\$[\d,.]+/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
      }
    }
    
    // Extract vintage
    let vintage = '';
    if (name.match(/\b(19|20)\d{2}\b/)) {
      vintage = name.match(/\b(19|20)\d{2}\b/)[0];
    }
    
    // Extract volume 
    let volume = '';
    const sizeElements = document.querySelectorAll('.single-option-selector option');
    for (const option of sizeElements) {
      const text = option.textContent.trim();
      if (text.match(/\d+\s*ml|\d+\s*cl|\d+\s*l/i)) {
        volume = text;
        break;
      }
    }
    
    // Determine category
    let category = 'unknown';
    // ReserveBar uses a structured hierarchy visible in the URL
    if (window.location.pathname.includes('/whiskey/') || 
        window.location.pathname.includes('/bourbon/') || 
        window.location.pathname.includes('/scotch/')) {
      category = 'whisky';
    } else if (window.location.pathname.includes('/wine/')) {
      category = 'wine';
    }
    
    return {
      name,
      brand,
      price,
      vintage,
      volume,
      category,
      url: window.location.href
    };
  } catch (error) {
    console.error('Error scraping ReserveBar:', error);
    return null;
  }
}