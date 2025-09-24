const apiClient = new EvakaApiClient();
const uiEnhancer = new UIEnhancer();

function watchMonthlyTitle(): void {
  const observer = new MutationObserver(() => {
    const titleElement = uiEnhancer.getMonthlyTitleElement();
    if (titleElement) {
      const dateRange = DateUtils.parseDateRange(titleElement.textContent || "");
      const currentDateRange = apiClient.getCurrentDateRange();

      if (
        dateRange &&
        JSON.stringify(dateRange) !== JSON.stringify(currentDateRange)
      ) {
        console.log("Month changed:", dateRange);

        // Clear projections and data when month changes
        uiEnhancer.clearProjections();
        apiClient.clearData();

        // Fetch new data for the new month
        apiClient.fetchReservations(dateRange).then((reservationData) => {
          if (reservationData) {
            uiEnhancer.enhanceMonthlyInfo(reservationData);
          }
        });
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Check initial state
  const titleElement = uiEnhancer.getMonthlyTitleElement();
  if (titleElement) {
    const dateRange = DateUtils.parseDateRange(titleElement.textContent || "");
    if (dateRange) {
      apiClient.fetchReservations(dateRange).then((reservationData) => {
        if (reservationData) {
          uiEnhancer.enhanceMonthlyInfo(reservationData);
        }
      });
    }
  }
}

// Start watching when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", watchMonthlyTitle);
} else {
  watchMonthlyTitle();
}