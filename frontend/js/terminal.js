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
                  content:
                    "Strong problem-solving ability.\nRecommended password format: <alias><securityLevel>",
                },
              },
            },
          },
        },
      },
    },
  },
};

const PROMPT = "recruit@dcib:~$";

const WELCOME_TEXT = [
  "DEVOPS CRIME INVESTIGATION BUREAU",
  "Recruitment Screening Terminal v1.0",
  "",
  "Welcome, Candidate.",
  "",
  "DCIB systems cannot be accessed without proving technical competence.",
  "",
  "OBJECTIVE:",
  "Locate your Agent Credentials hidden within this system.",
  "",
  "Allowed commands:",
  "ls",
  "ls -a",
  "cd",
  "cat",
  "pwd",
  "clear",
  "",
  "Begin.",
];

class RecruitmentTerminal {
  constructor(outputElement, inputElement, formElement) {
    this.outputElement = outputElement;
    this.inputElement = inputElement;
    this.formElement = formElement;
    this.homePath = ["home", "recruit"];
    this.currentPath = [...this.homePath];
    this.allowedCommands = new Set(["ls", "cd", "cat", "pwd", "clear"]);
  }

  init() {
    this.outputElement.innerHTML = "";
    this.renderStartupScreen();
    this.bindEvents();
    this.focusInput();
  }

  renderStartupScreen() {
    this.printLines(WELCOME_TEXT);
    this.printLine(PROMPT);
    this.outputElement.scrollTop = 0;
  }

  bindEvents() {
    this.formElement.addEventListener("submit", (event) => {
      event.preventDefault();
      const rawInput = this.inputElement.value;
      this.inputElement.value = "";
      this.runCommand(rawInput.trim());
    });

    window.addEventListener("click", () => this.focusInput());
  }

  focusInput() {
    this.inputElement.focus();
  }

  runCommand(commandLine) {
    const promptPath = this.getPromptPath();
    this.printLine(`recruit@dcib:${promptPath}$ ${commandLine}`);

    if (!commandLine) {
      return;
    }

    const [command, ...args] = commandLine.split(/\s+/);

    if (!this.allowedCommands.has(command)) {
      this.printLine(`Command not allowed: ${command}`);
      return;
    }

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
        this.handlePwd();
        break;
      case "clear":
        this.handleClear();
        break;
      default:
        this.printLine("Unknown command");
    }
  }

  handleLs(args = []) {
    const showHidden = args.includes("-a");
    const unsupportedFlags = args.filter((arg) => arg.startsWith("-") && arg !== "-a");

    if (unsupportedFlags.length > 0) {
      this.printLine(`ls: unsupported option: ${unsupportedFlags[0]}`);
      return;
    }

    const currentNode = this.getNodeFromPath(this.currentPath);
    const entries = Object.keys(currentNode.children || {}).filter((name) => showHidden || !name.startsWith("."));
    this.printLine(entries.join("  "));
  }

  handleCd(target = "") {
    if (!target || target === "~") {
      this.currentPath = [...this.homePath];
      return;
    }

    const resolvedPath = this.resolvePath(target);

    if (!resolvedPath) {
      this.printLine(`cd: no such directory: ${target}`);
      return;
    }

    const nextNode = this.getNodeFromPath(resolvedPath);

    if (!nextNode || nextNode.type !== "dir") {
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

  handlePwd() {
    this.printLine(this.getAbsolutePath());
  }

  handleClear() {
    this.outputElement.innerHTML = "";
    this.renderStartupScreen();
  }

  resolvePath(rawPath) {
    const parts = rawPath.split("/").filter(Boolean);
    let basePath;

    if (rawPath.startsWith("/")) {
      basePath = [];
    } else if (rawPath.startsWith("~")) {
      basePath = [...this.homePath];
      if (parts[0] === "~") {
        parts.shift();
      }
    } else {
      basePath = [...this.currentPath];
    }

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

      basePath.push(part);
    }

    return basePath;
  }

  getNodeFromPath(pathParts) {
    let currentNode = FILE_SYSTEM;

    for (const part of pathParts) {
      if (!currentNode.children || !currentNode.children[part]) {
        return null;
      }

      currentNode = currentNode.children[part];
    }

    return currentNode;
  }

  getAbsolutePath() {
    return `/${this.currentPath.join("/")}`;
  }

  getPromptPath() {
    if (
      this.currentPath.length === this.homePath.length &&
      this.currentPath.every((part, index) => part === this.homePath[index])
    ) {
      return "~";
    }

    if (this.currentPath.slice(0, this.homePath.length).every((part, index) => part === this.homePath[index])) {
      return `~/${this.currentPath.slice(this.homePath.length).join("/")}`;
    }

    return this.getAbsolutePath();
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
