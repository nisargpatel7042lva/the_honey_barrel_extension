// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const bottleImageInput = document.getElementById('bottleImage');
  const loadingSection = document.getElementById('loading');
  const resultsSection = document.getElementById('results');
  const resultContent = document.getElementById('resultContent');

  // Image upload handler
  bottleImageInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      showLoading();
      
      // Read the image file
      const imageUrl = await readImageFile(file);
      
      // Extract text from image using Tesseract.js
      const { data: { text } } = await Tesseract.recognize(
        imageUrl,
        'eng',
        { logger: m => console.log(m) }
      );

      // Extract bottle information from the text
      const bottleInfo = extractBottleInfo(text);
      
      // Fetch and compare with BAXUS listings
      const matches = await findSimilarBottles(bottleInfo);
      
      // Display results
      showResults(matches);
    } catch (error) {
      console.error('Error processing image:', error);
      showError('Error processing image. Please try again.');
    } finally {
      hideLoading();
    }
  });

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  function extractBottleInfo(text) {
    // Extract potential bottle information from OCR text
    const lines = text.split('\n').map(line => line.trim());
    
    // Look for patterns that might indicate bottle name, brand, etc.
    const bottleInfo = {
      name: '',
      brand: '',
      category: detectCategory(text),
      text: text // Keep full text for fuzzy matching
    };

    // Find potential brand and name
    for (const line of lines) {
      if (line.length > 3 && !bottleInfo.brand) {
        bottleInfo.brand = line;
      } else if (line.length > 3 && !bottleInfo.name) {
        bottleInfo.name = line;
      }
    }

    return bottleInfo;
  }

  function detectCategory(text) {
    const lowerText = text.toLowerCase();
    
    const whiskyTerms = ['whisky', 'whiskey', 'bourbon', 'scotch'];
    const wineTerms = ['wine', 'red wine', 'white wine', 'rose', 'champagne'];
    
    for (const term of whiskyTerms) {
      if (lowerText.includes(term)) return 'whisky';
    }
    
    for (const term of wineTerms) {
      if (lowerText.includes(term)) return 'wine';
    }
    
    return 'unknown';
  }

  async function findSimilarBottles(bottleInfo) {
    try {
      const response = await fetch('https://services.baxus.co/api/search/listings?from=0&size=20&listed=true');
      if (!response.ok) throw new Error('Failed to fetch listings');
      
      const data = await response.json();
      const listings = data.hits.map(hit => hit._source);
      
      // Find matches using fuzzy text matching
      return listings.filter(listing => {
        const similarity = calculateSimilarity(bottleInfo, listing);
        return similarity > 0.6; // Threshold for similarity
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }

  function calculateSimilarity(bottleInfo, listing) {
    const normalize = text => text.toLowerCase().replace(/[^\w\s]/g, '');
    
    const bottleText = normalize(bottleInfo.text);
    const listingText = normalize(`${listing.brand} ${listing.name}`);
    
    // Simple contains check - can be improved with better algorithms
    if (bottleText.includes(listingText) || listingText.includes(bottleText)) {
      return 1;
    }
    
    // Check individual words match
    const bottleWords = new Set(bottleText.split(/\s+/));
    const listingWords = new Set(listingText.split(/\s+/));
    
    let matches = 0;
    for (const word of bottleWords) {
      if (listingWords.has(word)) matches++;
    }
    
    return matches / Math.max(bottleWords.size, listingWords.size);
  }

  function showResults(matches) {
    resultsSection.classList.remove('hidden');
    
    if (matches.length === 0) {
      resultContent.innerHTML = '<p>No similar bottles found</p>';
      return;
    }
    
    const html = matches.map(match => `
      <div class="bottle-match">
        <h4>${match.name}</h4>
        <p class="brand">${match.brand}</p>
        <p class="price">$${match.price}</p>
        <a href="https://baxus.co/listing/${match.id}" target="_blank" class="view-button">View on BAXUS</a>
      </div>
    `).join('');
    
    resultContent.innerHTML = html;
  }

  function showLoading() {
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
  }

  function hideLoading() {
    loadingSection.classList.add('hidden');
  }

  function showError(message) {
    resultsSection.classList.remove('hidden');
    resultContent.innerHTML = `<p class="error">${message}</p>`;
  }
});