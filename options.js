document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKey').value.trim();
  chrome.storage.sync.set({ geminiApiKey: apiKey }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved successfully!';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      document.getElementById('apiKey').value = result.geminiApiKey;
    }
  });
});