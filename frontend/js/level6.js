// Cinematic Intro Handler
(function() {
  const cinematicIntro = document.getElementById('cinematicIntro');
  const skipBtn = document.getElementById('skipL2CrawlBtn');
  const crawlContent = document.getElementById('l2CrawlContent');

  const dismissCinematic = () => {
    if (cinematicIntro) {
      cinematicIntro.style.transition = 'opacity 0.8s ease';
      cinematicIntro.style.opacity = '0';
      setTimeout(() => { cinematicIntro.style.display = 'none'; }, 800);
    }
  };

  if (skipBtn) skipBtn.addEventListener('click', dismissCinematic);
  if (crawlContent) crawlContent.addEventListener('animationend', dismissCinematic);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cinematicIntro && cinematicIntro.style.display !== 'none') {
      dismissCinematic();
    }
  });
})();

const state = {
  activeFile: 'main.tf',
  isEditingCode: false,
  files: {
    'main.tf': `resource "aws_security_group" "ssh_access" {
  name        = "allow_ssh"
  description = "Allow SSH traffic"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # TODO: Restrict wide open network rules
  }
}`,
    'backend.tf': `terraform {
  backend "s3" {
    bucket = "dcib-tfstate"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    # TODO: Add state locking to prevent concurrent sabotage attempts
  }
}`
  }
};

const codeViewer = document.getElementById('codeViewer');
const codeEditor = document.getElementById('codeEditor');
const editCodeBtn = document.getElementById('editCodeBtn');
const saveCodeBtn = document.getElementById('saveCodeBtn');
const saveCodeMessage = document.getElementById('saveCodeMessage');
const statusValue = document.getElementById('statusValue');
const systemClock = document.getElementById('systemClock');
const briefingPanel = document.getElementById('briefingPanel');
const mainDashboard = document.getElementById('mainDashboard');
const startInvestigationBtn = document.getElementById('startInvestigationBtn');
const evaluateBtn = document.getElementById('evaluateBtn');
const resolveMessage = document.getElementById('resolveMessage');

const mainTfBtn = document.getElementById('mainTfBtn');
const backendTfBtn = document.getElementById('backendTfBtn');

let term = null;
let socket = null;
let terminalInitialized = false;

function setClock() {
  const now = new Date();
  systemClock.textContent = now.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function openFile(fileName) {
  state.activeFile = fileName;
  const content = state.files[fileName];
  codeViewer.textContent = content;
  codeEditor.value = content;
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = true;

  mainTfBtn.classList.toggle('primary', fileName === 'main.tf');
  backendTfBtn.classList.toggle('primary', fileName === 'backend.tf');

  if (fileName === 'main.tf') {
    document.getElementById('obj-identify').classList.add('completed');
  }
}

mainTfBtn.addEventListener('click', () => openFile('main.tf'));
backendTfBtn.addEventListener('click', () => openFile('backend.tf'));

editCodeBtn.addEventListener('click', () => {
  state.isEditingCode = true;
  codeViewer.hidden = true;
  codeEditor.hidden = false;
  editCodeBtn.hidden = true;
  saveCodeBtn.hidden = false;
  saveCodeMessage.hidden = true;
  codeEditor.focus();
});

saveCodeBtn.addEventListener('click', () => {
  state.files[state.activeFile] = codeEditor.value;
  state.isEditingCode = false;
  codeViewer.textContent = state.files[state.activeFile];
  codeViewer.hidden = false;
  codeEditor.hidden = true;
  editCodeBtn.hidden = false;
  saveCodeBtn.hidden = true;
  saveCodeMessage.hidden = false;

  // Validate Objectives
  if (state.activeFile === 'main.tf' && !state.files['main.tf'].includes('0.0.0.0/0')) {
    document.getElementById('obj-restrict').classList.add('completed');
  }

  if (state.activeFile === 'backend.tf' && state.files['backend.tf'].includes('dynamodb_table')) {
    document.getElementById('obj-lock').classList.add('completed');
  }
});

startInvestigationBtn.addEventListener('click', () => {
  briefingPanel.hidden = true;
  mainDashboard.hidden = false;
  setClock();
  openFile('main.tf');
  initializeTerminal();
});

setInterval(setClock, 1000);

function initializeTerminal() {
  if (terminalInitialized) return;
  terminalInitialized = true;

  term = new Terminal({
    theme: { background: '#000000', foreground: '#29ff6a' },
    cursorBlink: true,
    fontFamily: '"JetBrains Mono", Consolas, Monaco, monospace',
    fontSize: 14
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);

  const container = document.getElementById('xterm-container');
  term.open(container);
  fitAddon.fit();

  socket = io('http://localhost:3000');

  socket.on('connect', () => {
    socket.emit('start_lab', { levelId: 'level_6', cols: term.cols, rows: term.rows });
  });

  socket.on('terminal_output', (data) => {
    if (data.includes('__OBJ_L6_1__')) {
      document.getElementById('obj-validate').classList.add('completed');
      data = data.replace('__OBJ_L6_1__', '');
    }
    if (data.includes('__OBJ_L6_4__')) {
      document.getElementById('obj-apply').classList.add('completed');
      data = data.replace('__OBJ_L6_4__', '');
    }
    term.write(data);
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
}

evaluateBtn.addEventListener('click', () => {
  const validate = document.getElementById('obj-validate').classList.contains('completed');
  const identify = document.getElementById('obj-identify').classList.contains('completed');
  const restrict = document.getElementById('obj-restrict').classList.contains('completed');
  const apply = document.getElementById('obj-apply').classList.contains('completed');
  const lock = document.getElementById('obj-lock').classList.contains('completed');

  if (validate && identify && restrict && apply && lock) {
    statusValue.textContent = 'INFRASTRUCTURE SECURED';
    statusValue.classList.remove('status-failed');
    statusValue.classList.add('status-success');
    resolveMessage.hidden = false;

    const username = localStorage.getItem('devops_player_username') || 'shadow_dev';

    fetch(`http://localhost:3000/api/players/${username}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        levelId: 'level_6',
        status: 'completed',
        score: 100
      })
    })
    .then(res => res.json())
    .then(data => console.log('Progress saved:', data))
    .catch(err => console.error('Failed to save progress:', err))
    .finally(() => {
      setTimeout(() => {
        window.location.href = 'level7.html';
      }, 2500);
    });
  } else {
    alert('Please complete all objectives first before finishing Level 6.');
  }
});

// Initialize Virtual Assistant
if (window.VirtualAssistant) {
  new window.VirtualAssistant(() => {
    const objValidate = document.getElementById('obj-validate');
    const objIdentify = document.getElementById('obj-identify');
    const objRestrict = document.getElementById('obj-restrict');
    const objApply = document.getElementById('obj-apply');
    const objLock = document.getElementById('obj-lock');

    if (!objValidate || !objValidate.classList.contains('completed')) {
      return "Objective 1: Check Terraform configurations for syntax correctness using the 'terraform validate' command in the terminal.";
    }
    if (!objIdentify || !objIdentify.classList.contains('completed')) {
      return "Objective 2: Select 'main.tf' from the file explorer to identify insecure ingress rule scopes.";
    }
    if (!objRestrict || !objRestrict.classList.contains('completed')) {
      return "Objective 3: Erase any open CIDR blocks like '0.0.0.0/0' in 'main.tf' and restrict it to localized subnets (e.g. '10.0.0.0/16'). Click 'Save' when you're done.";
    }
    if (!objApply || !objApply.classList.contains('completed')) {
      return "Objective 4: Plan or apply your cloud desired state fixes with 'terraform plan' or 'terraform apply' in the terminal.";
    }
    if (!objLock || !objLock.classList.contains('completed')) {
      return "Objective 5: Open 'backend.tf' and define DynamoDB state locking using a 'dynamodb_table' parameter in the S3 backend block. Click 'Save' when you're done.";
    }
    return "All infrastructure objectives successfully completed! Ready to finish Chapter 6!";
  }, () => {
    return "Level 6: Infrastructure as Code (IaC). Your goal is to secure our Terraform code. Goals: (1) Run terraform validate, (2) Identify insecure rules in main.tf, (3) Erase insecure CIDRs, (4) Execute terraform apply, (5) Add DynamoDB state locking.";
  });
}
