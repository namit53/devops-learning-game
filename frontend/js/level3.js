const state = {
  stage: 1,
  // 1: initial, waiting for scan
  // 3: scan clean, waiting for grep
  // 4: file found, waiting for checkout
  // 5: checked out, waiting for scan to detect threat
  // 5.5: threat detected, waiting for log
  // 5.8: log executed, waiting for player to type 'jia tan'
  // 6: attacker identified, waiting for revert
  // 6.5: reverted partial, waiting for rebase
  // 7: completed
};

const hints = {
  1: "Try clicking the 'Run DCIB Scan' button to see what we're dealing with.",
  3: "The current tree is clean. Maybe an old script is calling an old commit? Try searching the codebase for git commands: `git grep \"git checkout\"`",
  4: "We found a suspicious script! It checks out 'a17c9e4'. Try checking out that commit yourself: `git checkout a17c9e4`",
  5: "You've checked out the suspicious commit. Now run the DCIB Scan again to analyze it.",
  5.5: "We found the malicious code! Now find who introduced this commit. Try `git log` or `git show a17c9e4`.",
  5.8: "Look closely at the author of the malicious commit. Type their full name to me.",
  6: "We know who did it. Now we need to clean the system completely. Try reverting the bad commit first: `git revert <commit_hash>`",
  6.5: "Good, but the commit still exists in history! To completely erase it, you need to rewrite history. Try: `git rebase -i` (Note: for this lab, just typing it will simulate the process)."
};

const sysClock = document.getElementById('systemClock');
function updateClock() {
  const now = new Date();
  sysClock.textContent = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

const chatContainer = document.getElementById('assistantChat');
const assistantInput = document.getElementById('assistantInput');
const assistantSendBtn = document.getElementById('assistantSendBtn');

function addChatMessage(msg, sender = 'assistant') {
  const div = document.createElement('div');
  div.className = `chat-message ${sender}-msg`;
  div.innerHTML = msg;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function handleHintRequest() {
  const hint = hints[state.stage] || "I don't have any more hints right now. Follow your instincts, Agent.";
  addChatMessage(hint, 'assistant');
}

// Button Events
document.getElementById('hintBtn').addEventListener('click', handleHintRequest);

assistantSendBtn.addEventListener('click', () => {
  const val = assistantInput.value.trim().toLowerCase();
  if (!val) return;
  addChatMessage(assistantInput.value, 'player');
  assistantInput.value = '';
  
  if (state.stage === 5.8 && val.includes('jia tan')) {
    state.stage = 6;
    document.getElementById('obj-2').classList.add('completed');
    setTimeout(() => {
      addChatMessage("Correct. Jia Tan is the attacker. We know who did it. Now we need to clean the system completely. Try reverting the bad commit first.", 'assistant');
    }, 2000);
    return;
  }

  if (val.includes('hint') || val.includes('help')) {
    handleHintRequest();
  } else {
    addChatMessage("I am focusing on monitoring the terminal. Ask for a 'hint' if you need guidance.", 'assistant');
  }
});

assistantInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') assistantSendBtn.click();
});

document.getElementById('whatIsAttackBtn').addEventListener('click', () => {
  addChatMessage("What is this issue?", 'player');
  setTimeout(() => {
    addChatMessage(`Think of Git like a time machine.<br><br>
Even if a file is deleted today, its past versions still exist in history.<br><br>
Attackers exploit this by:
<ul style="margin-top:0.5rem; margin-bottom:0.5rem; padding-left:1.5rem;">
  <li>Adding a malicious script in an old commit</li>
  <li>Deleting it later so the current files look clean</li>
  <li>Then creating a file that secretly pulls that old version back using Git</li>
</ul>
So even though everything looks safe now…<br>
the attack is hiding in the past.<br><br>
🎯 <b>What YOU need to do</b><br><br>
Don’t trust just the current files.<br>
Start investigating the repository’s history.<br><br>
Look for:
<ul style="margin-top:0.5rem; margin-bottom:0.5rem; padding-left:1.5rem;">
  <li>Files that use commands like git checkout</li>
  <li>References to old commits</li>
  <li>Anything that interacts with past versions</li>
</ul>
If something is calling an old commit…<br>
that’s your entry point.`, 'assistant');
  }, 2000);
});

// Terminal Setup
let term = null;
let socket = null;

function initTerminal() {
  term = new Terminal({
    theme: { background: '#0a0a0a', foreground: '#29ff6a' },
    cursorBlink: true,
    fontFamily: '"JetBrains Mono", Consolas, Monaco, monospace',
    fontSize: 14,
    scrollback: 9999
  });
  
  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  
  const container = document.getElementById('xterm-container');
  term.open(container);
  
  setTimeout(() => {
    fitAddon.fit();
    
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
      socket.emit('start_lab', { levelId: 'level_3', cols: term.cols, rows: term.rows });
    });
    
    socket.on('terminal_output', (data) => {
      let cleanData = data;
      
      // Parse Tokens
      if (data.includes('__L3_SCAN_CLEAN__')) {
        if (state.stage === 1) {
          state.stage = 3;
          setTimeout(() => {
            addChatMessage("Strange... nothing in the current system.", 'assistant');
            setTimeout(() => {
              addChatMessage("It might be a persistent data attack (hidden in history), not in the current files.", 'assistant');
              document.getElementById('whatIsAttackBtn').style.display = 'block';
            }, 2000);
          }, 2000);
        }
        cleanData = cleanData.replace(/__L3_SCAN_CLEAN__\r?\n?/, '');
      }
      
      if (data.includes('__L3_FOUND_FILE__')) {
        if (state.stage === 3) {
          state.stage = 4;
          setTimeout(() => {
            addChatMessage("Why is this file calling an old commit? That’s suspicious.", 'assistant');
          }, 2000);
        }
        cleanData = cleanData.replace(/__L3_FOUND_FILE__\r?\n?/, '');
      }
      
      if (data.includes('__L3_CHECKED_OUT_BAD_COMMIT__')) {
        if (state.stage === 4) {
          state.stage = 5;
        }
        cleanData = cleanData.replace(/__L3_CHECKED_OUT_BAD_COMMIT__\r?\n?/, '');
      }

      if (data.includes('__L3_THREAT_DETECTED__')) {
        if (state.stage === 5) {
          state.stage = 5.8;
          document.getElementById('obj-1').classList.add('completed');
          setTimeout(() => {
            addChatMessage("Now find who introduced this... Type the attacker's name to me.", 'assistant');
          }, 2000);
        }
        cleanData = cleanData.replace(/__L3_THREAT_DETECTED__\r?\n?/, '');
      }
      
      if (data.includes('__L3_ATTACKER_IDENTIFIED__')) {
        cleanData = cleanData.replace(/__L3_ATTACKER_IDENTIFIED__\r?\n?/, '');
      }
      
      if (data.includes('__L3_REVERTED_PARTIAL__')) {
        if (state.stage === 6) {
          state.stage = 6.5;
          setTimeout(() => {
            addChatMessage("Good, but something still feels off...", 'assistant');
          }, 2000);
        }
        cleanData = cleanData.replace(/__L3_REVERTED_PARTIAL__\r?\n?/, '');
      }
      
      if (data.includes('__L3_HISTORY_CLEANED__')) {
        if (state.stage === 6.5) {
          state.stage = 7;
          document.getElementById('obj-3').classList.add('completed');
          setTimeout(() => {
            addChatMessage("Threat removed from both present and history. System secure.", 'assistant');
            saveProgressAndComplete();
          }, 2000);
        }
        cleanData = cleanData.replace(/__L3_HISTORY_CLEANED__\r?\n?/, '');
      }

      if (data.includes('__L3_LAB_READY__')) {
        cleanData = cleanData.replace(/__L3_LAB_READY__\r?\n?/, '');
      }

      term.write(cleanData);
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

    const runBtn = document.getElementById('runScanBtn');
    runBtn.addEventListener('click', () => {
      runBtn.disabled = true;
      runBtn.textContent = 'Scanning...';
      setTimeout(() => {
        term.focus();
        socket.emit('terminal_input', 'dcib-scan\r');
        runBtn.disabled = false;
        runBtn.textContent = 'Run DCIB Scan';
      }, 2000);
    });

  }, 100);
}

function saveProgressAndComplete() {
  const username = localStorage.getItem('devops_player_username') || 'shadow_dev';
  
  fetch(`http://localhost:3000/api/players/${username}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      levelId: 'level_3',
      status: 'completed',
      score: 100,
      logs: ['Git Time Machine Attack neutralized']
    })
  })
  .then(res => res.json())
  .then(data => console.log('Progress saved:', data))
  .catch(err => console.error('Failed to save progress:', err))
  .finally(() => {
    setTimeout(() => {
      document.getElementById('successOverlay').style.display = 'flex';
    }, 1500);
  });
}

// Initialize
initTerminal();
