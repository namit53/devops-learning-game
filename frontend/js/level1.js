// Initialize Reward System
if (window.RewardSystem) {
  window.RewardSystem.init();
}

let term;
let socket;

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
    socket = io(window.location.origin);

    socket.on('connect', () => {
      socket.emit('start_lab', { levelId: 'recruitment', cols: term.cols, rows: term.rows });
    });

    let outputBuffer = "";
    const state = {
      identityFlag: false,
      vaultFlag: false,
      encryptionFlag: false,
      clearanceFlag: false,
      completed: false
    };

    socket.on('terminal_output', (data) => {
      // Don't render the magic string to the user
      if (data.includes('__REDIRECT_TO_LEVEL_2__')) {
        if (state.completed) return;
        state.completed = true;

        // Ensure last objective is ticked
        const objClearance = document.getElementById('obj-clearance');
        if (objClearance && !objClearance.classList.contains('completed')) {
          objClearance.classList.add('completed');
        }
        
        if (window.RewardSystem) window.RewardSystem.showFlag('Clearance Granted', 200, true);

        const totalScore = window.RewardSystem ? window.RewardSystem.getScore() : 100;
        const username = localStorage.getItem('devops_player_username') || 'shadow_dev';
        
        fetch(`http://localhost:3000/api/players/${username}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            levelId: 'level_1',
            status: 'completed',
            score: totalScore,
            badge: 'recruitment_cleared',
            objectives: window.RewardSystem ? window.RewardSystem.getObjectives() : []
          })
        }).catch(err => console.error(err));

        setTimeout(() => {
          if (window.RewardSystem) {
            window.RewardSystem.showLevelComplete('level_1', 'Recruitment Screening', totalScore, () => {
              window.location.href = 'level2.html';
            });
          } else {
            window.location.href = 'level2.html';
          }
        }, 1500);
        return; // Skip writing this chunk
      }
      
      term.write(data);
      
      outputBuffer += data;
      
      // Objective: Identity Confirmed
      if (outputBuffer.includes('Candidate 8472')) {
        const el = document.getElementById('obj-identity');
        if (el && !el.classList.contains('completed')) {
          el.classList.add('completed');
          if (window.RewardSystem && !state.identityFlag) {
            window.RewardSystem.showFlag('Identity Confirmed', 100);
            state.identityFlag = true;
          }
        }
      }
      
      // Objective: Vault Discovered (Triggered by entering the directory)
      if (outputBuffer.includes('.config/dcib_vault')) {
        const el = document.getElementById('obj-vault');
        if (el && !el.classList.contains('completed')) {
          el.classList.add('completed');
          if (window.RewardSystem && !state.vaultFlag) {
            window.RewardSystem.showFlag('Vault Discovered', 100);
            state.vaultFlag = true;
          }
        }
      }
      
      // Objective: Encryption Bypassed
      if (outputBuffer.includes('ZGVsdGFTZWN1cmU=')) {
        const el = document.getElementById('obj-encryption');
        if (el && !el.classList.contains('completed')) {
          el.classList.add('completed');
          if (window.RewardSystem && !state.encryptionFlag) {
            window.RewardSystem.showFlag('Encryption Bypassed', 100);
            state.encryptionFlag = true;
          }
        }
      }

      // Objective: Clearance Granted (Triggered by successful login)
      // Objective: Clearance Granted (Triggered by successful login)
      if (outputBuffer.includes('Authentication successful.')) {
        const el = document.getElementById('obj-clearance');
        if (el && !el.classList.contains('completed')) {
          el.classList.add('completed');
          // Final objective points
          if (window.RewardSystem && !state.clearanceFlag) {
            window.RewardSystem.showFlag('Clearance Granted', 100);
            state.clearanceFlag = true;
          }
        }
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
      }, () => {
        return "Level 1: Recruitment Screening. Your mission is to gain clearance for DCIB access. Current goals are: (1) Confirm Identity, (2) Discover the hidden Vault, (3) Bypass File Encryption, (4) Submit the Decoded Clearance Code.";
      });
    }
  }, 50);
});
