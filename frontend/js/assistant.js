class VirtualAssistant {
  constructor(getHintCallback) {
    this.getHintCallback = getHintCallback;
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
    const isHelp = text.includes('help') || text.includes('what should') || text.includes('brief') || text.includes('hint') || text.includes('stuck');
    const isHello = text.includes('hi') || text.includes('hello') || text.includes('hey');
    
    if (isHelp) {
      const hint = this.getHintCallback();
      this.appendMessage(hint, 'assistant-msg');
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
