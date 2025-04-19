/**
 * WineEnthusiast.com specific scraper
 * @returns {Object|null} - Bottle info or null if no bottle detected
 */
export function scrapeWineEnthusiast() {
  try {
    // Check if we're on a product page
    if (!document.querySelector('.product-detail')) {
      return null;
    }
    
    // Extract name from the main product title
    const nameElement = document.querySelector('h1.product-name');
    if (!nameElement) return null;
    
    const name = nameElement.textContent.trim();
    
    // Extract brand
    let brand = '';
    // WineEnthusiast often includes brand in product name
    const nameParts = name.split(' ');
    if (nameParts.length > 0) {
      brand = nameParts[0];
    }
    
    // Extract price
    let price = 0;
    const priceElement = document.querySelector('.price-sales, .price');
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
    const volumeElement = document.querySelector('.product-variations select option[selected]');
    if (volumeElement) {
      volume = volumeElement.textContent.trim();
    }
    
    // Determine category based on URL or breadcrumbs
    let category = 'unknown';
    if (window.location.pathname.includes('/wine/') || 
        window.location.pathname.includes('/champagne/')) {
      category = 'wine';
    } else if (window.location.pathname.includes('/spirits/') ||
               window.location.pathname.includes('/whiskey/') || 
               window.location.pathname.includes('/bourbon/')) {
      category = 'whisky';
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
    console.error('Error scraping WineEnthusiast:', error);
    return null;
  }
}