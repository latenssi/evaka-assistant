// Background script for intercepting HTTP requests to Evaka API

// Store intercepted requests for analysis
const interceptedRequests = new Map();
const interceptedResponses = new Map();

// Listen for outgoing requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Only intercept API calls to Evaka
    if (details.url.includes('/api/')) {
      console.log('🔄 Intercepted Request:', {
        method: details.method,
        url: details.url,
        timestamp: new Date().toISOString(),
        requestBody: details.requestBody,
        tabId: details.tabId
      });

      // Store request data
      interceptedRequests.set(details.requestId, {
        method: details.method,
        url: details.url,
        timestamp: new Date().toISOString(),
        requestBody: details.requestBody,
        tabId: details.tabId
      });
    }
  },
  {
    urls: ["*://evaka.turku.fi/*"]
  },
  ["requestBody"]
);

// Listen for request headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.url.includes('/api/')) {
      // Add headers to stored request data
      if (interceptedRequests.has(details.requestId)) {
        interceptedRequests.get(details.requestId).headers = details.requestHeaders;
      }
    }
  },
  {
    urls: ["*://evaka.turku.fi/*"]
  },
  ["requestHeaders"]
);

// Listen for response headers
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.url.includes('/api/')) {
      console.log('📥 Response Headers:', {
        url: details.url,
        status: details.statusCode,
        headers: details.responseHeaders,
        timestamp: new Date().toISOString()
      });

      // Store response headers
      interceptedResponses.set(details.requestId, {
        url: details.url,
        status: details.statusCode,
        headers: details.responseHeaders,
        timestamp: new Date().toISOString()
      });
    }
  },
  {
    urls: ["*://evaka.turku.fi/*"]
  },
  ["responseHeaders"]
);

// Listen for completed requests
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.url.includes('/api/')) {
      const requestData = interceptedRequests.get(details.requestId);
      const responseData = interceptedResponses.get(details.requestId);

      console.log('✅ Request Completed:', {
        request: requestData,
        response: {
          ...responseData,
          status: details.statusCode
        }
      });

      // Clean up stored data
      interceptedRequests.delete(details.requestId);
      interceptedResponses.delete(details.requestId);

      // Send data to content script or popup if needed
      if (details.tabId !== -1) {
        chrome.tabs.sendMessage(details.tabId, {
          type: 'API_REQUEST_COMPLETED',
          data: {
            request: requestData,
            response: {
              ...responseData,
              status: details.statusCode
            }
          }
        }).catch(() => {
          // Content script might not be ready, that's ok
        });
      }
    }
  },
  {
    urls: ["*://evaka.turku.fi/*"]
  }
);

// Listen for failed requests
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (details.url.includes('/api/')) {
      console.error('❌ Request Failed:', {
        url: details.url,
        error: details.error,
        timestamp: new Date().toISOString()
      });

      // Clean up stored data
      interceptedRequests.delete(details.requestId);
      interceptedResponses.delete(details.requestId);
    }
  },
  {
    urls: ["*://evaka.turku.fi/*"]
  }
);

// API to get intercepted data (for popup or content script)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getInterceptedData') {
    sendResponse({
      requests: Array.from(interceptedRequests.values()),
      responses: Array.from(interceptedResponses.values())
    });
  }
});

console.log('🚀 Evaka Assistant background script loaded - HTTP interception active');