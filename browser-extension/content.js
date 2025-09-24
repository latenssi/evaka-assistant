console.log("🔧 Evaka Data Capture: Content script loaded");

class EvakaDataCapture {
  constructor() {
    this.reservationData = null;
    this.capturedAt = null;
  }

  isEvakaPage() {
    const url = window.location.href;
    return url.includes("evaka.turku.fi");
  }

  saveReservationData(data) {
    this.reservationData = data;
    this.capturedAt = new Date().toISOString();

    console.log("💾 Reservation data captured:", {
      children: data.children?.length || 0,
      days: data.days?.length || 0,
      capturedAt: this.capturedAt,
      dataSize: JSON.stringify(data).length + " bytes",
    });

    // Store in browser storage for persistence
    this.storeData(data);
  }

  storeData(data) {
    const storageData = {
      reservationData: data,
      capturedAt: this.capturedAt,
      url: window.location.href,
    };

    // Store in chrome.storage.local (persists between sessions)
    chrome.storage.local.set(
      {
        evaka_reservation_data: storageData,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log("❌ Error storing data:", chrome.runtime.lastError);
        } else {
          console.log("✅ Data stored successfully");
        }
      }
    );
  }

  getStoredData(callback) {
    chrome.storage.local.get(["evaka_reservation_data"], (result) => {
      if (chrome.runtime.lastError) {
        console.log("❌ Error retrieving data:", chrome.runtime.lastError);
        callback(null);
      } else {
        callback(result.evaka_reservation_data || null);
      }
    });
  }

  clearStoredData() {
    chrome.storage.local.remove(["evaka_reservation_data"], () => {
      console.log("🗑️ Stored data cleared");
      this.reservationData = null;
      this.capturedAt = null;
    });
  }

  getStatus() {
    return {
      hasData: !!this.reservationData,
      capturedAt: this.capturedAt,
      onEvakaPage: this.isEvakaPage(),
      dataInfo: this.reservationData
        ? {
            children: this.reservationData.children?.length || 0,
            days: this.reservationData.days?.length || 0,
            sizeBytes: JSON.stringify(this.reservationData).length,
          }
        : null,
    };
  }
}

// Initialize the data capture
const evakaDataCapture = new EvakaDataCapture();

// Message handling for popup communication and background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Received message:", request);

  // Handle messages from background script about intercepted API calls
  if (request.type === "API_REQUEST_COMPLETED") {
    console.log(
      "📡 API Request intercepted by background script:",
      request.data
    );

    // Check if this is reservation data
    if (request.data.request?.url?.includes("/api/citizen/reservations")) {
      console.log("📅 Reservation API call detected");
      // The actual response body isn't available in webRequest API
      // But we have the metadata
    }

    return;
  }

  // Existing popup message handling
  if (request.action === "getStatus") {
    const status = evakaDataCapture.getStatus();
    console.log("📤 Sending status to popup:", status);
    sendResponse(status);
    return true;
  }

  if (request.action === "getStoredData") {
    evakaDataCapture.getStoredData((data) => {
      sendResponse({
        success: true,
        data: data,
        hasData: !!data,
      });
    });
    return true;
  }

  if (request.action === "clearData") {
    evakaDataCapture.clearStoredData();
    sendResponse({ success: true, message: "Data cleared" });
    return true;
  }

  if (request.action === "downloadData") {
    const data = evakaDataCapture.reservationData;
    if (data) {
      // Return data to popup for download
      sendResponse({
        success: true,
        data: data,
        filename: `evaka_data_${new Date().toISOString().split("T")[0]}.json`,
      });
    } else {
      sendResponse({ success: false, message: "No data available" });
    }
    return true;
  }

  // Default response for unknown actions
  sendResponse({ error: "Unknown action: " + request.action });
  return true;
});

console.log("🔧 Evaka Data Capture: Ready and waiting for API calls");
