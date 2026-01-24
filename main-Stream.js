// ===== KONFIGURATION =====
const TWITCH_CHANNEL = "Rulacat"; // <-- Hier deinen Twitch-Channel eintragen (z.B. "deinname")
const USE_TWITCH = TWITCH_CHANNEL !== "";

// ================= Pomodoro Timer =================
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

// ================= Todo-Liste =================
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
    const cleaned = message.replace(/^!todo\s*/i, "").trim();
    const parts = cleaned.split(" ");
    const command = parts[0].toLowerCase();

    if (!command || !["done", "delete", "clear"].includes(command)) {
      this.addTodo(cleaned);
      return;
    }

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

// ================= Chat System =================
class ChatSystem {
  constructor() {
    this.chatMessages = document.getElementById("chat-messages");
    this.messages = [];
    this.maxMessages = 20;

    this.socket = null;
    this.connectionStatus = document.getElementById("connectionStatus");

    if (USE_TWITCH) {
      this.connectToTwitch();
    }
  }

  connectToTwitch() {
    if (!USE_TWITCH || this.isTestMode) return;

    this.updateConnectionStatus("Verbinde...", "disconnected");

    this.socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    this.socket.onopen = () => {
      this.socket.send("PASS oauth:FAKE");
      this.socket.send("NICK justinfan12345");
      this.socket.send(`JOIN #${TWITCH_CHANNEL}`);
      this.updateConnectionStatus(`Verbunden: #${TWITCH_CHANNEL}`, "connected");
    };

    this.socket.onmessage = (event) => {
      const message = event.data;

      if (message.startsWith("PING")) {
        this.socket.send("PONG :tmi.twitch.tv");
        return;
      }

      if (message.includes("PRIVMSG")) {
        const match = message.match(/:(\w+)!.*PRIVMSG #\w+ :(.+)/);
        if (match) {
          const username = match[1];
          const text = match[2].trim();
          this.addMessage(username, text);
        }
      }
    };

    this.socket.onerror = () => {
      this.updateConnectionStatus("Fehler bei Verbindung", "disconnected");
    };

    this.socket.onclose = () => {
      this.updateConnectionStatus("Getrennt", "disconnected");
      if (!this.isTestMode) {
        setTimeout(() => this.connectToTwitch(), 5000);
      }
    };
  }

  updateConnectionStatus(text, className) {
    if (this.connectionStatus) {
      this.connectionStatus.textContent = text;
      this.connectionStatus.className = `connection-status ${className}`;
    }
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

// ================= Initialisierung =================
const pomodoroTimer = new PomodoroTimer(40, 15);
window.todoList = new TodoList();
const chatSystem = new ChatSystem();

// Info-Nachricht beim Start
if (!USE_TWITCH) {
  setTimeout(() => {
    chatSystem.addMessage(
      "System",
      "💡 Test-Modus aktiv! Schreibe Test-Nachrichten unten.",
    );
    chatSystem.addMessage("System", "📝 Probier: !todo Hausaufgaben machen");
  }, 500);
}
