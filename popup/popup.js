// Popup script
document.addEventListener('DOMContentLoaded', function() {
  const searchUrlButton = document.getElementById('searchUrl');
  const bottleUrlInput = document.getElementById('bottleUrl');
  const bottleImageInput = document.getElementById('bottleImage');
  const resultsSection = document.getElementById('results');
  const resultContent = document.getElementById('resultContent');

  // URL search handler
  searchUrlButton.addEventListener('click', async () => {
    const url = bottleUrlInput.value.trim();
    if (!url) return;

    try {
      // Send message to content script to scrape the URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Navigate to the URL in the current tab
      await chrome.tabs.update(tab.id, { url });
      
      // Wait for page load and then scrape
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          
          // Execute content script
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: scrapeAndSearch
          });
        }
      });
    } catch (error) {
      showError('Error processing URL');
    }
  });

  // Image upload handler
  bottleImageInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // Here you would implement image processing
      // For now, show a message that this feature is coming soon
      showMessage('Image search coming soon! Please use URL search for now.');
    } catch (error) {
      showError('Error processing image');
    }
  });

  function showMessage(message) {
    resultsSection.classList.remove('hidden');
    resultContent.innerHTML = `<p>${message}</p>`;
  }

  function showError(message) {
    resultsSection.classList.remove('hidden');
    resultContent.innerHTML = `<p style="color: red;">${message}</p>`;
  }
});

// Function to be injected into the page
function scrapeAndSearch() {
  // This function will be injected into the page context
  const bottleInfo = window.scrapeProductInfo();
  if (bottleInfo) {
    chrome.runtime.sendMessage({ 
      type: 'BOTTLE_DETECTED', 
      bottleInfo 
    });
  }
}