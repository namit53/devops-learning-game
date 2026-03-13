const FILE_SYSTEM = {
  type: "dir",
  children: {
    home: {
      type: "dir",
      children: {
        recruit: {
          type: "dir",
          children: {
            "resume.txt": {
              type: "file",
              content: "Candidate ID: 8472\nPreferred alias: delta",
            },
            "welcome_note.txt": {
              type: "file",
              content: "Welcome to the recruitment terminal.",
            },
            ".agent_profile": {
              type: "file",
              content: "rank=junior\nsecurityLevel=Secure",
            },
            archives: {
              type: "dir",
              children: {
                "interview_feedback.txt": {
                  type: "file",
                  content: "Strong problem-solving ability.\nRecommended password format: <alias><securityLevel>",
                },
              },
            },
          },
        },
      },
    },
  },
};

const PROMPT_LABEL = "recruit@dcib:~$";
const HOME_PATH = ["home", "recruit"];
const VALID_AGENT_ID = "8472";
const VALID_PASSWORD = "deltaSecure";

const STARTUP_TEXT = [
  "--------------------------------------------------",
  "DEVOPS CRIME INVESTIGATION BUREAU",
  "Recruitment Screening Terminal v1.0",
  "--------------------------------------------------",
  "",
  "Welcome, Candidate.",
  "",
  "DCIB systems cannot be accessed without proving technical competence.",
  "",
  "OBJECTIVE:",
  "Locate your Agent Credentials hidden within this system.",
  "",
  "After finding your credentials, authenticate using the command:",
  "login",
  "",
  "Type 'help' if you are stuck.",
  "",
  "--------------------------------------------------",
];

class RecruitmentTerminal {
  constructor(outputElement, inputElement, formElement) {
    this.outputElement = outputElement;
    this.inputElement = inputElement;
    this.formElement = formElement;
    this.currentPath = [...HOME_PATH];
    this.commandHistory = [];
    this.historyIndex = 0;
    this.isAuthenticated = false;
    this.authFlow = null;
    this.pendingAgentId = "";
  }

  init() {
    this.outputElement.innerHTML = "";
    this.printLines(STARTUP_TEXT);
    this.bindEvents();
    this.focusInput();
  }

  bindEvents() {
    this.formElement.addEventListener("submit", (event) => {
      event.preventDefault();
      const rawInput = this.inputElement.value;
      this.inputElement.value = "";
      this.execute(rawInput.trim());
    });

    this.inputElement.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        this.showPreviousHistory();
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        this.showNextHistory();
      }
    });

    window.addEventListener("click", () => this.focusInput());
  }

  execute(inputLine) {
    this.printLine(`${PROMPT_LABEL} ${inputLine}`);

    if (!inputLine) {
      return;
    }

    this.commandHistory.push(inputLine);
    this.historyIndex = this.commandHistory.length;

    if (this.authFlow) {
      this.handleLoginPromptInput(inputLine);
      return;
    }

    const [command, ...args] = inputLine.split(/\s+/);

    switch (command) {
      case "ls":
        this.handleLs(args);
        break;
      case "cd":
        this.handleCd(args[0]);
        break;
      case "cat":
        this.handleCat(args[0]);
        break;
      case "pwd":
        this.printLine(this.getAbsolutePath());
        break;
      case "clear":
        this.outputElement.innerHTML = "";
        break;
      case "help":
        this.handleHelp();
        break;
      case "login":
        this.startLoginFlow();
        break;
      case "view-cases":
        this.handleViewCases();
        break;
      case "solve":
        this.handleSolve(args);
        break;
      default:
        this.printLine(`Command not found: ${command}`);
    }
  }

  handleHelp() {
    if (!this.isAuthenticated) {
      this.printLines([
        "Find your credentials inside /home/recruit by exploring files with ls, cd, and cat.",
        "When you have them, run 'login' and enter your Agent ID and password.",
      ]);
      return;
    }

    this.printLines([
      "Authorized commands:",
      "ls, ls -a, cd, cat, pwd, clear, help, view-cases, solve case1",
    ]);
  }

  startLoginFlow() {
    if (this.isAuthenticated) {
      this.printLine("Already authenticated.");
      return;
    }

    this.authFlow = "agentId";
    this.pendingAgentId = "";
    this.printLine("Agent ID:");
  }

  handleLoginPromptInput(value) {
    if (this.authFlow === "agentId") {
      this.pendingAgentId = value;
      this.authFlow = "password";
      this.printLine("Password:");
      return;
    }

    if (this.authFlow === "password") {
      const isValid = this.pendingAgentId === VALID_AGENT_ID && value === VALID_PASSWORD;
      this.authFlow = null;
      this.pendingAgentId = "";

      if (!isValid) {
        this.printLine("Authentication failed. Invalid Agent ID or password.");
        return;
      }

      this.isAuthenticated = true;
      this.printLines([
        "Authentication successful.",
        "Welcome Agent.",
        "",
        "You are now authorized to access DCIB investigations.",
        "",
        "Type 'view-cases' to see available investigations.",
      ]);
    }
  }

  handleViewCases() {
    if (!this.isAuthenticated) {
      this.printLine("Access denied. Authenticate first using 'login'.");
      return;
    }

    this.printLines([
      "Available Investigations",
      "",
      "CASE 001 – The Missing Dependency",
      "Status: OPEN",
      "",
      "solve case1",
    ]);
  }

  handleSolve(args) {
    if (!this.isAuthenticated) {
      this.printLine("Access denied. Authenticate first using 'login'.");
      return;
    }

    if (args[0] !== "case1") {
      this.printLine("Unknown case. Try: solve case1");
      return;
    }

    this.printLine("Launching investigation...");
    setTimeout(() => {
      window.location.href = "level1.html";
    }, 600);
  }

  handleLs(args) {
    const showHidden = args.includes("-a");
    const unsupported = args.find((arg) => arg.startsWith("-") && arg !== "-a");

    if (unsupported) {
      this.printLine(`ls: unsupported option: ${unsupported}`);
      return;
    }

    const node = this.getNodeFromPath(this.currentPath);
    const entries = Object.keys(node.children || {}).filter((name) => showHidden || !name.startsWith("."));
    this.printLine(entries.join("  "));
  }

  handleCd(target) {
    if (!target || target === "~") {
      this.currentPath = [...HOME_PATH];
      return;
    }

    const resolvedPath = this.resolvePath(target);
    const node = resolvedPath ? this.getNodeFromPath(resolvedPath) : null;

    if (!node || node.type !== "dir") {
      this.printLine(`cd: no such directory: ${target}`);
      return;
    }

    this.currentPath = resolvedPath;
  }

  handleCat(fileName) {
    if (!fileName) {
      this.printLine("cat: missing file operand");
      return;
    }

    const resolvedPath = this.resolvePath(fileName);
    const node = resolvedPath ? this.getNodeFromPath(resolvedPath) : null;

    if (!node || node.type !== "file") {
      this.printLine(`cat: ${fileName}: No such file`);
      return;
    }

    this.printLine(node.content);
  }

  resolvePath(rawPath) {
    const basePath = rawPath.startsWith("/") ? [] : [...this.currentPath];
    const parts = rawPath.split("/").filter(Boolean);

    for (const part of parts) {
      if (part === ".") {
        continue;
      }

      if (part === "..") {
        if (basePath.length > 0) {
          basePath.pop();
        }
        continue;
      }

      if (part === "~") {
        basePath.length = 0;
        basePath.push(...HOME_PATH);
        continue;
      }

      basePath.push(part);
    }

    return basePath;
  }

  getNodeFromPath(pathParts) {
    let node = FILE_SYSTEM;

    for (const part of pathParts) {
      if (!node.children || !node.children[part]) {
        return null;
      }
      node = node.children[part];
    }

    return node;
  }

  getAbsolutePath() {
    return `/${this.currentPath.join("/")}`;
  }

  showPreviousHistory() {
    if (this.historyIndex <= 0) {
      return;
    }

    this.historyIndex -= 1;
    this.inputElement.value = this.commandHistory[this.historyIndex] || "";
  }

  showNextHistory() {
    if (this.historyIndex >= this.commandHistory.length) {
      this.inputElement.value = "";
      return;
    }

    this.historyIndex += 1;
    this.inputElement.value = this.commandHistory[this.historyIndex] || "";
  }

  printLine(text = "") {
    const line = document.createElement("p");
    line.className = "terminal-line";
    line.textContent = text;
    this.outputElement.appendChild(line);
    this.outputElement.scrollTop = this.outputElement.scrollHeight;
  }

  printLines(lines) {
    lines.forEach((line) => this.printLine(line));
  }

  focusInput() {
    this.inputElement.focus();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const outputElement = document.getElementById("terminalOutput");
  const inputElement = document.getElementById("terminalInput");
  const formElement = document.getElementById("terminalForm");

  if (!outputElement || !inputElement || !formElement) {
    return;
  }

  const terminal = new RecruitmentTerminal(outputElement, inputElement, formElement);
  terminal.init();
});
