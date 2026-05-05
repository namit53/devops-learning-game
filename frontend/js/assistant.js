class VirtualAssistant {
  constructor(getHintCallback, getBriefCallback) {
    if (typeof getHintCallback === 'function') {
      this.getHintCallback = getHintCallback;
      this.getBriefCallback = getBriefCallback;
    } else if (getHintCallback && typeof getHintCallback === 'object') {
      this.getHintCallback = getHintCallback.getHint;
      this.getBriefCallback = getHintCallback.getBrief;
    }
    this.chatContainer = document.getElementById('assistantChat');
    this.inputField = document.getElementById('assistantInput');
    this.sendBtn = document.getElementById('assistantSendBtn');
    this.nameField = document.getElementById('assistantName');
    
    // Load saved name or default to Lucifer
    const savedName = localStorage.getItem('assistantName');
    if (savedName) {
      this.nameField.textContent = savedName;
    }

    this.initEvents();
  }

  initEvents() {
    this.sendBtn.addEventListener('click', () => this.handleUserInput());
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleUserInput();
    });

    this.nameField.addEventListener('blur', () => {
      const newName = this.nameField.textContent.trim() || 'Lucifer';
      this.nameField.textContent = newName;
      localStorage.setItem('assistantName', newName);
    });
    
    // Prevent enter key in contenteditable from creating newlines
    this.nameField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.nameField.blur();
      }
    });
  }

  handleUserInput() {
    const text = this.inputField.value.trim();
    if (!text) return;

    this.appendMessage(text, 'user-msg');
    this.inputField.value = '';

    // Process intent
    setTimeout(() => {
      this.processResponse(text.toLowerCase());
    }, 500);
  }

  appendMessage(text, className) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${className}`;
    msgDiv.textContent = text;
    this.chatContainer.appendChild(msgDiv);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  processResponse(text) {
    const COMMAND_EXPLANATIONS = {
      'ls': '`ls` (List): Used to display files and directories in the current directory. The `-la` flag lists all files including hidden ones (starting with a dot) in a detailed format.',
      'cd': '`cd` (Change Directory): Used to navigate between different folders or directories in the system.',
      'chmod': '`chmod` (Change Mode): Modifies the read, write, and execute permissions of a file or directory. For example, `chmod 600` ensures only the owner can read and write.',
      'base64': '`base64`: A utility used to encode or decode data in Base64 format. The `-d` flag decodes encoded text back into plain text.',
      'login': '`login`: The system command used to prompt for authentication credentials to verify agent access clearance.',
      'npm': '`npm` (Node Package Manager): The tool used to manage and install packages and libraries for Node.js projects, such as running `npm install lodash`.',
      'lodash': '`lodash`: A popular JavaScript utility library that offers functions for working with arrays, objects, and strings.',
      'sumby': '`_.sumBy`: A utility function from the Lodash library that returns the sum of specific properties extracted from an array of objects.',
      'lsof': '`lsof` (List Open Files): Displays information about files opened by processes, including internet sockets. Use `lsof -i :3000` to find what is listening on port 3000.',
      'kill': '`kill`: Sends a signal to terminate processes. The `-9` flag sends a SIGKILL signal, forcing the immediate termination of the process by its PID.',
      'evaluate': '`Evaluate`: The command or action used to trigger the pipeline re-run to verify your fixes.'
    };

    for (const [kw, explanation] of Object.entries(COMMAND_EXPLANATIONS)) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(text)) {
        this.appendMessage(explanation, 'assistant-msg');
        return;
      }
    }

    const isBrief = text.includes('brief') || text.includes('summary') || text.includes('objective');
    const isHint = text.includes('hint') || text.includes('help') || text.includes('what should') || text.includes('stuck');
    const isHello = text.includes('hi') || text.includes('hello') || text.includes('hey');
    
    if (isBrief) {
      if (this.getBriefCallback) {
        const brief = this.getBriefCallback();
        this.appendMessage(brief, 'assistant-msg');
      } else {
        this.appendMessage("Your mission objectives and summary can be retrieved by looking at the mission dashboard or asking for specific tips.", 'assistant-msg');
      }
      return;
    }

    if (isHint) {
      if (this.getHintCallback) {
        const hint = this.getHintCallback();
        this.appendMessage(hint, 'assistant-msg');
      } else {
        this.appendMessage("I don't have any specific hints for this phase yet.", 'assistant-msg');
      }
      return;
    }

    if (isHello) {
      this.appendMessage(`Greetings, Operator. I am ${this.nameField.textContent}. How can I assist you?`, 'assistant-msg');
      return;
    }

    this.appendMessage("I am a specialized DCIB assistant. Ask me for a 'hint' or 'brief' if you need guidance on your mission.", 'assistant-msg');
  }
}

// Export for usage if modules were enabled, otherwise available globally
window.VirtualAssistant = VirtualAssistant;
