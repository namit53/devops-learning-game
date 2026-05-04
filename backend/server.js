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

  socket.on('start_lab', (data) => {
    console.log(`[Socket] Starting lab for ${socket.id} - Level: ${data.levelId}`);
    
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
    } else {
      dockerCmd.push('ubuntu:22.04', '/bin/bash');
    }

    ptyProcess = pty.spawn('docker', dockerCmd, {
      name: 'xterm-color',
      cols: data.cols || 80,
      rows: data.rows || 24,
      cwd: process.env.HOME,
      env: process.env
    });

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
