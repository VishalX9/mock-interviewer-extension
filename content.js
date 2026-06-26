function getLeetCodeDescription() {
  const descriptionContainer = document.querySelector('[data-track-load="description_content"]');
  if (descriptionContainer) return descriptionContainer.innerText;

  const proseContainer = document.querySelector('.prose');
  if (proseContainer) return proseContainer.innerText;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) return metaDescription.content;

  return "Could not locate the problem description.";
}

function getLeetCodeLanguage() {
  const knownLanguages = ['C++', 'Java', 'Python', 'Python3', 'C', 'C#', 'JavaScript', 'TypeScript', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Go', 'Ruby', 'Scala', 'Rust'];
  const buttons = Array.from(document.querySelectorAll('button'));
  const matchedBtn = buttons.find(b => knownLanguages.includes(b.innerText.trim()));
  
  if (matchedBtn) return matchedBtn.innerText.trim();

  const listboxButton = document.querySelector('button[aria-haspopup="listbox"]');
  if (listboxButton && listboxButton.innerText) return listboxButton.innerText.trim();

  return "the programming language you are using";
}

function getFullEditorCode() {

  const viewLines = document.querySelectorAll('.view-line');
  if (viewLines.length > 0) {
    return Array.from(viewLines).map(line => line.textContent || line.innerText).join('\n');
  }
  return ""; 
}

chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "GET_PROBLEM_CONTEXT") {
    sendResponse({ 
      text: getLeetCodeDescription(), 
      language: getLeetCodeLanguage() 
    });
  } 
  else if (req.type === "GET_CURRENT_CODE") {
    sendResponse({ 
      code: getFullEditorCode() 
    });
  }
});
