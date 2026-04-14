# MockMate: AI Technical Interviewer for LeetCode

A Chrome Extension that transforms any LeetCode problem into an interactive mock interview. Powered by the Gemini 2.5 Flash API, it acts as a strict technical interviewer—reviewing your logic, analyzing your time/space complexity, and offering conceptual hints without ever revealing the direct solution.



## Features
* **Dynamic Context Extraction:** Automatically detects the current LeetCode problem description and the programming language you are using.
* **Smart Code Review:** Safely extracts the active code from LeetCode's highly obfuscated Monaco editor (bypassing DOM virtualization limits) to provide real-time logic critiques.
* **Strict Interviewer Prompting:** The LLM is heavily prompt-engineered to act as an evaluator, forcing the candidate to find their own bugs and optimize their own algorithms.
* **Persistent Sessions:** State management ensures your interview history remains intact even if you close the extension popup.

## Tech Stack
* **Languages:** JavaScript, HTML, CSS
* **APIs:** Google Gemini 2.5 Flash API, Chrome Extensions API (Storage, Scripting, ActiveTab)
* **Architecture:** Content Scripts, Service Workers (Popup), Local/Sync Storage

## Installation (Local Development)
1. Clone this repository: `git clone https://github.com/yourusername/mock-interviewer.git`
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the cloned repository folder.
5. Right-click the extension icon, select **Options**, and enter your Gemini API Key.
