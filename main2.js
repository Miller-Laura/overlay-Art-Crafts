// Pomodoro Timer
class PomodoroTimer {
  constructor(workMinutes = 40, breakMinutes = 15) {
    this.workMinutes = workMinutes;
    this.breakMinutes = breakMinutes;
    this.totalSeconds = workMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = false;
    this.isWorkSession = true;
    this.timerInterval = null;
    this.timerDisplay = document.querySelector(".timer-display");
    this.sessionLabel = document.getElementById("sessionLabel");
    this.timerBox = document.getElementById("timerBox");
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.resetBtn = document.getElementById("resetBtn");

    this.initializeEventListeners();
    this.updateDisplay();
  }

  initializeEventListeners() {
    this.startBtn.addEventListener("click", () => this.start());
    this.pauseBtn.addEventListener("click", () => this.pause());
    this.resetBtn.addEventListener("click", () => this.reset());

    // Keyboard shortcuts
    document.addEventListener("keypress", (e) => {
      if (e.key === "1") this.start();
      if (e.key === "2") this.pause();
      if (e.key === "3") this.reset();
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startBtn.disabled = true;
    this.timerBox.classList.add("timer-running");

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      this.updateDisplay();

      if (this.remainingSeconds <= 0) {
        this.switchSession();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    this.startBtn.disabled = false;
    this.timerBox.classList.remove("timer-running");
    clearInterval(this.timerInterval);
  }

  reset() {
    this.pause();
    this.isWorkSession = true;
    this.remainingSeconds = this.workMinutes * 60;
    this.updateDisplay();
    this.updateSessionLabel();
  }

  switchSession() {
    this.isWorkSession = !this.isWorkSession;
    this.remainingSeconds = this.isWorkSession
      ? this.workMinutes * 60
      : this.breakMinutes * 60;
    this.pause();

    this.updateSessionLabel();

    // Optional: Sound oder visuelle Benachrichtigung
    this.timerBox.style.background = this.isWorkSession
      ? "linear-gradient(135deg, #a0826d 0%, #8b6f47 100%)"
      : "linear-gradient(135deg, #6b9f5d 0%, #478b6f 100%)";

    setTimeout(() => {
      this.timerBox.style.background =
        "linear-gradient(135deg, #a0826d 0%, #8b6f47 100%)";
    }, 3000);

    this.updateDisplay();
  }

  updateSessionLabel() {
    this.sessionLabel.textContent = this.isWorkSession
      ? "Arbeitsphase"
      : "Pause";
  }

  updateDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    this.timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

// Todo List (OHNE localStorage - funktioniert in OBS)
class TodoList {
  constructor() {
    this.todoListElement = document.getElementById("todo-list");
    this.todoCountElement = document.getElementById("todoCount");
    this.todos = [];
    this.render();
  }

  render() {
    this.todoListElement.innerHTML = "";

    if (this.todos.length === 0) {
      this.todoListElement.innerHTML =
        '<div class="todo-empty">Keine Aufgaben - schreib !todo [Aufgabe] im Chat</div>';
      this.todoCountElement.textContent = "0 Aufgaben";
      return;
    }

    const activeTodos = this.todos.filter((t) => !t.done).length;
    this.todoCountElement.textContent = `${activeTodos} von ${this.todos.length} offen`;

    this.todos.forEach((todo, index) => {
      const li = document.createElement("li");
      li.textContent = todo.text;
      if (todo.done) {
        li.classList.add("done");
      }

      li.addEventListener("click", () => {
        this.toggleTodo(index);
      });

      this.todoListElement.appendChild(li);

      requestAnimationFrame(() => {
        li.classList.add("show");
      });
    });
  }

  addTodo(text) {
    if (!text || !text.trim()) return;
    this.todos.push({ text: text.trim(), done: false });
    this.render();
  }

  removeTodo(index) {
    if (index < 0 || index >= this.todos.length) return;
    this.todos.splice(index, 1);
    this.render();
  }

  toggleTodo(index) {
    if (index < 0 || index >= this.todos.length) return;
    this.todos[index].done = !this.todos[index].done;
    this.render();
  }

  handleTodoCommand(message) {
    // Entferne "!todo" vom Anfang
    const cleaned = message.replace(/^!todo\s*/i, "").trim();
    const parts = cleaned.split(" ");
    const command = parts[0].toLowerCase();

    // Kein Subcommand = direkt Todo hinzufügen
    if (!command || !["done", "delete", "clear"].includes(command)) {
      this.addTodo(cleaned);
      return;
    }

    // Subcommands
    if (command === "clear") {
      this.todos = [];
      this.render();
      return;
    }

    const index = parseInt(parts[1], 10) - 1;

    if (command === "done") {
      this.toggleTodo(index);
    } else if (command === "delete") {
      this.removeTodo(index);
    }
  }
}

// Simple Chat System
class ChatSystem {
  constructor() {
    this.chatMessages = document.getElementById("chat-messages");
    this.messages = [];
    this.maxMessages = 20;
  }

  addMessage(username, text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "chat-message";

    const usernameSpan = document.createElement("div");
    usernameSpan.className = "chat-username";
    usernameSpan.textContent = username;

    const textSpan = document.createElement("div");
    textSpan.className = "chat-text";
    textSpan.textContent = text;

    messageDiv.appendChild(usernameSpan);
    messageDiv.appendChild(textSpan);

    this.chatMessages.appendChild(messageDiv);
    this.messages.push({ username, text });

    if (this.messages.length > this.maxMessages) {
      this.chatMessages.removeChild(this.chatMessages.firstChild);
      this.messages.shift();
    }

    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Check für Todo-Commands
    if (text.toLowerCase().startsWith("!todo")) {
      window.todoList.handleTodoCommand(text);
    }
  }
}

// Initialisierung
const pomodoroTimer = new PomodoroTimer(40, 15);
window.todoList = new TodoList();
const chatSystem = new ChatSystem();

// Demo-Funktion zum Testen (kann später entfernt werden)
function addDemoMessage() {
  const demoUsers = ["StreamerX", "CodeMaster", "StudyBuddy"];
  const demoMessages = [
    "Viel Erfolg beim Lernen!",
    "Was lernst du gerade?",
    "!todo Mathehausaufgaben machen",
    "!todo Code Review durchführen",
    "Super Stream! 💪",
  ];

  const randomUser = demoUsers[Math.floor(Math.random() * demoUsers.length)];
  const randomMsg =
    demoMessages[Math.floor(Math.random() * demoMessages.length)];

  chatSystem.addMessage(randomUser, randomMsg);
}

// Globale Funktion für externe Chat-Integration (z.B. Twitch)
window.handleChatMessage = function (username, message) {
  chatSystem.addMessage(username, message);
};

// Beispiel-Nachrichten zum Testen (auskommentieren für Production)
setTimeout(() => addDemoMessage(), 2000);
setTimeout(() => addDemoMessage(), 4000);
setTimeout(() => addDemoMessage(), 6000);
