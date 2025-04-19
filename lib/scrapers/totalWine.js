/**
 * TotalWine.com specific scraper
 * @returns {Object|null} - Bottle info or null if no bottle detected
 */
export function scrapeTotalWine() {
  try {
    // Check if we're on a product page
    if (!window.location.pathname.includes('/p/')) {
      return null;
    }
    
    // Extract name from the main product title
    const nameElement = document.querySelector('.pdp-header h1');
    if (!nameElement) return null;
    
    const name = nameElement.textContent.trim();
    
    // Extract brand
    let brand = '';
    const brandElement = document.querySelector('[data-test="product-brand"]');
    if (brandElement) {
      brand = brandElement.textContent.trim();
    }
    
    // Extract price
    let price = 0;
    const priceElement = document.querySelector('.price');
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
    const volumeElement = document.querySelector('.product-qty');
    if (volumeElement) {
      volume = volumeElement.textContent.trim();
    }
    
    // Determine category
    let category = 'unknown';
    const breadcrumbs = document.querySelectorAll('.breadcrumbs a');
    for (const crumb of breadcrumbs) {
      const text = crumb.textContent.toLowerCase();
      if (text.includes('whisky') || text.includes('whiskey') || 
          text.includes('bourbon') || text.includes('scotch')) {
        category = 'whisky';
        break;
      } else if (text.includes('wine') || text.includes('champagne')) {
        category = 'wine';
        break;
      }
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
    console.error('Error scraping TotalWine:', error);
    return null;
  }
}