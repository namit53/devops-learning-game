const FILE_SYSTEM = {
  type: "dir",
  children: {
    home: {
      type: "dir",
      children: {
        recruit: {
          type: "dir",
          children: {
            "brief.txt": {
              type: "file",
              content: "Review all directories. Agent credentials are hidden in plain sight.",
            },
            records: {
              type: "dir",
              children: {
                "candidates.log": {
                  type: "file",
                  content: "Candidates screened: 72\\nQualified this cycle: 3",
                },
              },
            },
            secure: {
              type: "dir",
              children: {
                "credentials.txt": {
                  type: "file",
                  content: "Agent Credentials:\\nID: DCIB-17-ALPHA\\nPassphrase: NIGHTFALL-SIGNAL",
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
    this.currentPath = ["home", "recruit"];
    this.allowedCommands = new Set(["ls", "cd", "cat", "pwd", "clear"]);
  }

  init() {
    this.renderStartupScreen();
    this.bindEvents();
    this.focusInput();
  }

  renderStartupScreen() {
    this.printLines(WELCOME_TEXT);
    this.printLine(PROMPT);
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
    this.printLine(`recruit@dcib:${this.getPromptPath()}$ ${commandLine}`);

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
        this.handleLs();
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

  handleLs() {
    const currentNode = this.getNodeFromPath(this.currentPath);
    const entries = Object.keys(currentNode.children || {});
    this.printLine(entries.join("  "));
  }

  handleCd(target = "") {
    if (!target || target === "~") {
      this.currentPath = ["home", "recruit"];
      return;
    }

    if (target === "..") {
      if (this.currentPath.length > 2) {
        this.currentPath.pop();
      }
      return;
    }

    const nextPath = [...this.currentPath, target];
    const nextNode = this.getNodeFromPath(nextPath);

    if (!nextNode || nextNode.type !== "dir") {
      this.printLine(`cd: no such directory: ${target}`);
      return;
    }

    this.currentPath = nextPath;
  }

  handleCat(fileName) {
    if (!fileName) {
      this.printLine("cat: missing file operand");
      return;
    }

    const node = this.getNodeFromPath([...this.currentPath, fileName]);

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
    if (this.currentPath.length === 2) {
      return "~";
    }

    return `~/${this.currentPath.slice(2).join("/")}`;
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
