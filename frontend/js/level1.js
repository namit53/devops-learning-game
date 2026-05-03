let term = null;
let socket = null;

window.addEventListener('DOMContentLoaded', () => {
  const introCrawl = document.getElementById('introCrawl');
  const skipCrawlBtn = document.getElementById('skipCrawlBtn');
  const crawlContent = document.getElementById('crawlContent');
  
  const closeCrawl = () => {
    if (introCrawl) introCrawl.style.display = 'none';
    if (term) term.focus();
  };

  if (skipCrawlBtn) {
    skipCrawlBtn.addEventListener('click', closeCrawl);
  }
  
  if (crawlContent) {
    crawlContent.addEventListener('animationend', closeCrawl);
  }
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && introCrawl && introCrawl.style.display !== 'none') {
      closeCrawl();
    }
  });

  const container = document.getElementById('xterm-container');
  if (!container) return;

  term = new Terminal({
    theme: { background: '#020402', foreground: '#29ff6a' }, // Match original terminal styling
    cursorBlink: true,
    fontFamily: '"JetBrains Mono", Consolas, Monaco, monospace',
    fontSize: 15
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  term.open(container);
  
  // A small delay ensures the container has correct dimensions before fitting
  setTimeout(() => {
    fitAddon.fit();
    
    // Connect WebSocket
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
      socket.emit('start_lab', { levelId: 'recruitment', cols: term.cols, rows: term.rows });
    });

    let outputBuffer = "";

    socket.on('terminal_output', (data) => {
      // Don't render the magic string to the user
      if (data.includes('__REDIRECT_TO_LEVEL_2__')) {
        setTimeout(() => {
          window.location.href = 'level2.html';
        }, 1000);
        return; // Skip writing this chunk
      }
      
      term.write(data);
      
      outputBuffer += data;
      if (outputBuffer.includes('Candidate 8472')) {
        document.getElementById('obj-identity').classList.add('completed');
      }
      if (outputBuffer.includes('dcib_vault') || outputBuffer.includes('.config')) {
        document.getElementById('obj-vault').classList.add('completed');
      }
      if (outputBuffer.includes('ZGVsdGFTZWN1cmU=')) {
        document.getElementById('obj-encryption').classList.add('completed');
      }
      if (outputBuffer.includes('__REDIRECT_TO_LEVEL_2__')) {
        document.getElementById('obj-clearance').classList.add('completed');
        setTimeout(() => {
          window.location.href = 'level2.html';
        }, 1000);
      }
      
      if (outputBuffer.length > 5000) {
        outputBuffer = outputBuffer.slice(-1000);
      }
    });

    term.onData((data) => {
      socket.emit('terminal_input', data);
    });

    window.addEventListener('resize', () => {
      fitAddon.fit();
      if (socket) {
        socket.emit('terminal_resize', { cols: term.cols, rows: term.rows });
      }
    });
    
    // Initialize Virtual Assistant
    if (window.VirtualAssistant) {
      new window.VirtualAssistant(() => {
        const objIdentity = document.getElementById('obj-identity');
        const objVault = document.getElementById('obj-vault');
        const objEncryption = document.getElementById('obj-encryption');
        const objClearance = document.getElementById('obj-clearance');

        if (!objIdentity || !objIdentity.classList.contains('completed')) {
          return "You must confirm your identity. Look around your current directory using the 'ls -la' command.";
        }
        if (!objVault || !objVault.classList.contains('completed')) {
          return "We have intelligence regarding a hidden vault. Try navigating to '.config/dcib_vault' using the 'cd' command.";
        }
        if (!objEncryption || !objEncryption.classList.contains('completed')) {
          return "You've found the credentials file, but it's locked. Change the file permissions so you can read it. Try 'chmod 600 <filename>'.";
        }
        if (!objClearance || !objClearance.classList.contains('completed')) {
          return "The credentials file is obfuscated in base64. Output its contents and decode it using 'base64 -d'. Once you have the code, type 'login' and enter it.";
        }
        return "You have completed all objectives for this screening phase.";
      });
    }
  }, 50);
});
