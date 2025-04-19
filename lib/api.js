// API interaction functions

/**
 * Fetches listings from BAXUS marketplace API
 * @returns {Promise<Array>} - Promise resolving to array of BAXUS listings
 */
export async function fetchBaxusListings() {
  try {
    const response = await fetch(
      'https://services.baxus.co/api/search/listings?from=0&size=20&listed=true', 
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`BAXUS API error: ${response.status}`);
    }
    
    const data = await response.json();
    return processListingsData(data);
  } catch (error) {
    console.error('Error fetching BAXUS listings:', error);
    return [];
  }
}

/**
 * Processes raw listings data from BAXUS API to standardized format
 * @param {Object} data - Raw API response
 * @returns {Array} - Processed listings
 */
function processListingsData(data) {
  if (!data || !data.hits || !Array.isArray(data.hits)) {
    return [];
  }
  
  return data.hits.map(item => {
    const listing = item._source || {};
    
    return {
      id: listing.id || '',
      name: listing.name || '',
      brand: listing.brand || '',
      vintage: listing.vintage || '',
      volume: listing.volume || '',
      price: parseFloat(listing.price) || 0,
      url: `https://baxus.co/listing/${listing.id}`,
      imageUrl: listing.imageUrl || '',
      category: listing.category || 'unknown'
    };
  });
}