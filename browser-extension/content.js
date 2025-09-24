let reservationData = null;
let currentDateRange = null;

// Parse date range from the monthly summary title
function parseDateRange(titleText) {
  // Extract dates from "Läsnäolot 01.09. - 30.09.2025"
  const match = titleText.match(/(\d{2})\.(\d{2})\.\s*-\s*(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) {
    const [, fromDay, fromMonth, toDay, toMonth, year] = match;
    const from = `${year}-${fromMonth.padStart(2, '0')}-${fromDay.padStart(2, '0')}`;
    const to = `${year}-${toMonth.padStart(2, '0')}-${toDay.padStart(2, '0')}`;
    return { from, to };
  }
  return null;
}

// Fetch reservations with specific date range
async function fetchReservations(dateRange = null) {
  try {
    let from, to;

    if (dateRange) {
      from = dateRange.from;
      to = dateRange.to;
    } else {
      // Fallback to current month
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }

    const response = await fetch(`/api/citizen/reservations?from=${from}&to=${to}`, {
      headers: { 'Accept': 'application/json' },
      credentials: 'include'
    });

    if (response.ok) {
      reservationData = await response.json();
      currentDateRange = { from, to };
      return reservationData;
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
  return null;
}

// Watch for changes in the monthly summary title
function watchMonthlyTitle() {
  const observer = new MutationObserver(() => {
    const titleElement = document.querySelector('[data-qa="monthly-summary-info-title"]');
    if (titleElement) {
      const dateRange = parseDateRange(titleElement.textContent);
      if (dateRange && JSON.stringify(dateRange) !== JSON.stringify(currentDateRange)) {
        console.log('Month changed:', dateRange);
        currentDateRange = dateRange;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Check initial state
  const titleElement = document.querySelector('[data-qa="monthly-summary-info-title"]');
  if (titleElement) {
    const dateRange = parseDateRange(titleElement.textContent);
    if (dateRange) {
      currentDateRange = dateRange;
    }
  }
}

// Start watching when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watchMonthlyTitle);
} else {
  watchMonthlyTitle();
}

// Handle popup messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchReservations") {
    fetchReservations(currentDateRange).then(data => {
      sendResponse({ success: !!data, data });
    });
    return true;
  }

  if (request.action === "downloadData") {
    const dateStr = currentDateRange ?
      `${currentDateRange.from}_${currentDateRange.to}` :
      new Date().toISOString().split('T')[0];

    sendResponse({
      success: !!reservationData,
      data: reservationData,
      filename: `evaka_reservations_${dateStr}.json`
    });
  }
});
