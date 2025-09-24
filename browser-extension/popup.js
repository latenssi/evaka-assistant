const status = document.getElementById('status');
const fetchBtn = document.getElementById('fetch-btn');
const downloadBtn = document.getElementById('download-btn');

fetchBtn.onclick = () => {
  status.textContent = 'Fetching...';

  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'fetchReservations'}, response => {
      if (response?.success) {
        status.textContent = 'Data fetched!';
        downloadBtn.disabled = false;
      } else {
        status.textContent = 'Failed to fetch';
      }
    });
  });
};

downloadBtn.onclick = () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'downloadData'}, response => {
      if (response?.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {type: 'application/json'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = response.filename;
        a.click();
      }
    });
  });
};
