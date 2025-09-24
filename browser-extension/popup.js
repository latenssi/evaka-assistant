document.addEventListener("DOMContentLoaded", function () {
  const pageStatus = document.getElementById("page-status");
  const dataStatus = document.getElementById("data-status");
  const refreshBtn = document.getElementById("refresh-btn");
  const downloadBtn = document.getElementById("download-btn");
  const clearBtn = document.getElementById("clear-btn");
  const dataInfo = document.getElementById("data-info");

  // Check current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTab = tabs[0];

    if (currentTab.url.includes("evaka.turku.fi")) {
      pageStatus.textContent = "On Evaka site ✅";
      checkCaptureStatus(currentTab.id);
    } else {
      pageStatus.textContent = "Not on Evaka site";
    }
  });

  function checkCaptureStatus(tabId) {
    // Try to communicate with content script
    chrome.tabs.sendMessage(
      tabId,
      { action: "getStatus" },
      function (response) {
        if (chrome.runtime.lastError) {
          dataStatus.textContent = "Refresh page to activate";
        } else if (response) {
          if (response.hasData) {
            dataStatus.textContent = "Data captured ✅";
            updateDataInfo(response);
            downloadBtn.disabled = false;
            clearBtn.disabled = false;
          } else {
            dataStatus.textContent = "Waiting for API calls";
            dataInfo.style.display = "none";
            downloadBtn.disabled = true;
            clearBtn.disabled = true;
          }
        }
      }
    );
  }

  function updateDataInfo(response) {
    if (response.dataInfo) {
      dataInfo.style.display = "block";

      document.getElementById("children-count").textContent =
        response.dataInfo.children || 0;
      document.getElementById("days-count").textContent =
        response.dataInfo.days || 0;
      document.getElementById("data-size").textContent = formatBytes(
        response.dataInfo.sizeBytes || 0
      );

      if (response.capturedAt) {
        const date = new Date(response.capturedAt);
        document.getElementById("capture-time").textContent =
          date.toLocaleString();
      }
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  refreshBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];

      if (currentTab.url.includes("evaka.turku.fi")) {
        checkCaptureStatus(currentTab.id);
      } else {
        alert("Please navigate to evaka.turku.fi first");
      }
    });
  });

  downloadBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];

      chrome.tabs.sendMessage(
        currentTab.id,
        { action: "downloadData" },
        function (response) {
          if (response && response.success) {
            // Create download
            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = response.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("Data downloaded successfully");
          } else {
            alert(
              "Failed to download data: " +
                (response?.message || "Unknown error")
            );
          }
        }
      );
    });
  });

  clearBtn.addEventListener("click", function () {
    if (confirm("Are you sure you want to clear all stored data?")) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];

        chrome.tabs.sendMessage(
          currentTab.id,
          { action: "clearData" },
          function (response) {
            if (response && response.success) {
              // Update UI
              dataStatus.textContent = "Data cleared";
              dataInfo.style.display = "none";
              downloadBtn.disabled = true;
              clearBtn.disabled = true;
            }
          }
        );
      });
    }
  });

  // Periodic status check
  setInterval(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url.includes("evaka.turku.fi")) {
        checkCaptureStatus(currentTab.id);
      }
    });
  }, 5000);
});
