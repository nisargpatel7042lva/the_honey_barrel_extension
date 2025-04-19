// Popup script

document.addEventListener('DOMContentLoaded', function() {
  // Check extension status
  checkExtensionStatus();
  
  // Add event listeners for buttons
  const baxusButton = document.querySelector('.primary-button');
  baxusButton.addEventListener('click', function() {
    // Track external link click (for analytics if implemented)
    console.log('BAXUS button clicked');
  });
});

/**
 * Checks the status of the extension and updates the UI accordingly
 */
function checkExtensionStatus() {
  chrome.storage.local.get(['lastScan', 'totalBottlesFound', 'totalSavings'], function(result) {
    updateStatusUI(result);
  });
}

/**
 * Updates the status UI with the latest information
 * @param {Object} data - Extension status data
 */
function updateStatusUI(data) {
  const statusText = document.querySelector('.status p');
  
  if (data.lastScan) {
    const lastScanDate = new Date(data.lastScan);
    const formattedDate = lastScanDate.toLocaleDateString();
    
    let message = 'The Honey Barrel is active and searching for the best prices on BAXUS.';
    
    if (data.totalBottlesFound && data.totalBottlesFound > 0) {
      message += ` We've found ${data.totalBottlesFound} bottles`;
      
      if (data.totalSavings && data.totalSavings > 0) {
        message += ` with potential savings of $${data.totalSavings.toFixed(2)}`;
      }
      
      message += ` since ${formattedDate}.`;
    }
    
    statusText.textContent = message;
  }
}