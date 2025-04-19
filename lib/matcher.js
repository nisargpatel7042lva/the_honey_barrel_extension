// Bottle matching functions

/**
 * Finds a matching bottle in BAXUS listings
 * @param {Object} bottleInfo - Bottle info scraped from retail site
 * @param {Array} baxusListings - BAXUS listings to compare against
 * @returns {Object|null} - Matching BAXUS listing or null if no match
 */
export function findMatchingBottle(bottleInfo, baxusListings) {
  if (!bottleInfo || !bottleInfo.name || !baxusListings || !baxusListings.length) {
    return null;
  }
  
  const candidates = [];
  
  // Phase 1: Find potential matches based on normalized name
  const normalizedBottleName = normalizeText(bottleInfo.name);
  
  for (const listing of baxusListings) {
    const normalizedListingName = normalizeText(listing.name);
    
    // Skip if category doesn't match (if available)
    if (bottleInfo.category && 
        listing.category && 
        !categoriesMatch(bottleInfo.category, listing.category)) {
      continue;
    }
    
    // Calculate name similarity score (0-100)
    const nameScore = calculateSimilarity(normalizedBottleName, normalizedListingName);
    
    // Add potential matches to candidates list
    if (nameScore > 65) {
      candidates.push({
        listing,
        scores: {
          name: nameScore,
          brand: 0,
          vintage: 0,
          volume: 0
        },
        totalScore: nameScore
      });
    }
  }
  
  // Phase 2: Check additional attributes to improve matching
  candidates.forEach(candidate => {
    // Check brand similarity if available
    if (bottleInfo.brand && candidate.listing.brand) {
      const brandScore = calculateSimilarity(
        normalizeText(bottleInfo.brand), 
        normalizeText(candidate.listing.brand)
      );
      candidate.scores.brand = brandScore;
      candidate.totalScore += brandScore;
    }
    
    // Check vintage match if available
    if (bottleInfo.vintage && candidate.listing.vintage) {
      if (bottleInfo.vintage === candidate.listing.vintage) {
        candidate.scores.vintage = 100;
        candidate.totalScore += 100;
      }
    }
    
    // Check volume match if available
    if (bottleInfo.volume && candidate.listing.volume) {
      const volumeScore = volumesMatch(bottleInfo.volume, candidate.listing.volume) ? 100 : 0;
      candidate.scores.volume = volumeScore;
      candidate.totalScore += volumeScore;
    }
    
    // Normalize total score
    const scoreFactors = Object.values(candidate.scores).filter(score => score > 0).length;
    if (scoreFactors > 0) {
      candidate.totalScore = candidate.totalScore / scoreFactors;
    }
  });
  
  // Sort candidates by total score (descending)
  candidates.sort((a, b) => b.totalScore - a.totalScore);
  
  // Return highest scoring candidate if it exceeds minimum threshold
  return candidates.length > 0 && candidates[0].totalScore > 70 
    ? candidates[0].listing 
    : null;
}

/**
 * Normalizes text for comparison
 * @param {string} text - Input text
 * @returns {string} - Normalized text
 */
function normalizeText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

/**
 * Calculates similarity between two strings (0-100)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score (0-100)
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // Simple implementation using Levenshtein distance
  // In a production environment, this would use a more sophisticated algorithm
  const longerStr = str1.length > str2.length ? str1 : str2;
  const shorterStr = str1.length > str2.length ? str2 : str1;
  
  if (longerStr.length === 0) return 100;
  
  // Levenshtein distance calculation (simplified)
  // This is a basic implementation - a real extension would use a more optimized version
  const editDistance = levenshteinDistance(longerStr, shorterStr);
  
  return Math.round((1 - editDistance / longerStr.length) * 100);
}

/**
 * Calculates Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} - Edit distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  
  // Increment along the first column of each row
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  // Increment each column in the first row
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill in the rest of the matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

/**
 * Checks if categories match
 * @param {string} category1 - First category
 * @param {string} category2 - Second category
 * @returns {boolean} - True if categories match
 */
function categoriesMatch(category1, category2) {
  const cat1 = normalizeText(category1);
  const cat2 = normalizeText(category2);
  
  // Map common category variations
  const whiskyTerms = ['whisky', 'whiskey', 'bourbon', 'scotch', 'rye'];
  const wineTerms = ['wine', 'red', 'white', 'rose', 'champagne', 'sparkling'];
  
  const isWhisky1 = whiskyTerms.some(term => cat1.includes(term));
  const isWhisky2 = whiskyTerms.some(term => cat2.includes(term));
  
  const isWine1 = wineTerms.some(term => cat1.includes(term));
  const isWine2 = wineTerms.some(term => cat2.includes(term));
  
  // Check if both are in the same category
  return (isWhisky1 && isWhisky2) || (isWine1 && isWine2);
}

/**
 * Checks if volumes match
 * @param {string} volume1 - First volume string
 * @param {string} volume2 - Second volume string
 * @returns {boolean} - True if volumes match
 */
function volumesMatch(volume1, volume2) {
  // Extract numeric value and unit
  const vol1 = normalizeVolume(volume1);
  const vol2 = normalizeVolume(volume2);
  
  if (!vol1 || !vol2) return false;
  
  // Convert both to ml for comparison
  const ml1 = convertToMl(vol1.value, vol1.unit);
  const ml2 = convertToMl(vol2.value, vol2.unit);
  
  return ml1 > 0 && ml2 > 0 && Math.abs(ml1 - ml2) < 10; // Allow small difference
}

/**
 * Normalizes volume string to value and unit
 * @param {string} volumeStr - Volume string (e.g. "750ml", "75cl", "0.75L")
 * @returns {Object|null} - Normalized volume or null if invalid
 */
function normalizeVolume(volumeStr) {
  if (!volumeStr) return null;
  
  // Remove spaces and convert to lowercase
  const str = volumeStr.toLowerCase().replace(/\s+/g, '');
  
  // Try to match common patterns
  const patterns = [
    /^(\d+(?:\.\d+)?)\s*ml$/i,    // ml
    /^(\d+(?:\.\d+)?)\s*cl$/i,    // cl
    /^(\d+(?:\.\d+)?)\s*l$/i,     // l
    /^(\d+(?:\.\d+)?)\s*oz$/i,    // oz
    /^(\d+(?:\.\d+)?)$/i          // just numbers (assume ml)
  ];
  
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      const value = parseFloat(match[1]);
      let unit = str.substring(match[1].length) || 'ml';
      if (!unit || unit === '') unit = 'ml';
      return { value, unit };
    }
  }
  
  return null;
}

/**
 * Converts volume to ml
 * @param {number} value - Volume value
 * @param {string} unit - Volume unit
 * @returns {number} - Volume in ml
 */
function convertToMl(value, unit) {
  switch (unit.toLowerCase()) {
    case 'ml': return value;
    case 'cl': return value * 10;
    case 'l': return value * 1000;
    case 'oz': return value * 29.5735;
    default: return 0;
  }
}