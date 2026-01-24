// ===== KONFIGURATION =====
// Trage hier deinen Twitch-Channel ein, wenn du live gehen willst
const TWITCH_CHANNEL = ""; // z.B. "deinname" (ohne #)
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
      if (e.key === "3") this.start();
      if (e.key === "2") this.pause();
      if (e.key === "1") this.reset();
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

    // Farbwechsel bei Session-Wechsel
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

// ================= Chat System =================
class ChatSystem {
  constructor() {
    this.chatMessages = document.getElementById("chat-messages");
    this.messages = [];
    this.maxMessages = 20;
    this.isTestMode = !USE_TWITCH;
    this.socket = null;
    this.connectionStatus = document.getElementById("connectionStatus");

    this.initializeTestMode();

    if (USE_TWITCH) {
      this.connectToTwitch();
    }
  }

  initializeTestMode() {
    const modeToggle = document.getElementById("modeToggle");
    const testInputContainer = document.getElementById("testInputContainer");
    const testSendBtn = document.getElementById("testSendBtn");
    const testMessage = document.getElementById("testMessage");
    const testUsername = document.getElementById("testUsername");

    if (!modeToggle || !testInputContainer) {
      console.warn("Chat-Elemente nicht gefunden - Test-Modus nicht verfügbar");
      return;
    }

    // Toggle zwischen Test und Live
    modeToggle.addEventListener("click", () => {
      this.isTestMode = !this.isTestMode;
      testInputContainer.classList.toggle("active", this.isTestMode);
      modeToggle.textContent = this.isTestMode ? "TEST" : "LIVE";
      modeToggle.classList.toggle("test-mode", this.isTestMode);

      if (this.isTestMode) {
        this.updateConnectionStatus("Test-Modus", "");
        // Trenne Twitch-Verbindung wenn vorhanden
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }
      } else if (USE_TWITCH) {
        this.connectToTwitch();
      } else {
        this.updateConnectionStatus(
          "Kein Twitch-Channel konfiguriert",
          "disconnected",
        );
      }
    });

    // Send Button
    testSendBtn.addEventListener("click", () => {
      const username = testUsername.value.trim() || "TestUser";
      const message = testMessage.value.trim();
      if (message) {
        this.addMessage(username, message);
        testMessage.value = "";
        testMessage.focus();
      }
    });

    // Enter-Taste im Message-Input
    testMessage.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        testSendBtn.click();
      }
    });
  }

  connectToTwitch() {
    if (!USE_TWITCH || this.isTestMode) return;

    this.updateConnectionStatus("Verbinde mit Twitch...", "disconnected");

    this.socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    this.socket.onopen = () => {
      // Anonyme Verbindung zu Twitch IRC
      this.socket.send("PASS oauth:FAKE");
      this.socket.send("NICK justinfan12345");
      this.socket.send(`JOIN #${TWITCH_CHANNEL}`);
      this.updateConnectionStatus(
        `✅ Verbunden: #${TWITCH_CHANNEL}`,
        "connected",
      );
      console.log(`Verbunden mit Twitch-Channel: #${TWITCH_CHANNEL}`);
    };

    this.socket.onmessage = (event) => {
      const message = event.data;

      // PING/PONG für Keep-Alive
      if (message.startsWith("PING")) {
        this.socket.send("PONG :tmi.twitch.tv");
        return;
      }

      // Parse Chat-Nachrichten
      if (message.includes("PRIVMSG")) {
        const match = message.match(/:(\w+)!.*PRIVMSG #\w+ :(.+)/);
        if (match) {
          const username = match[1];
          const text = match[2].trim();
          this.addMessage(username, text);
        }
      }
    };

    this.socket.onerror = (error) => {
      console.error("Twitch WebSocket Fehler:", error);
      this.updateConnectionStatus("❌ Verbindungsfehler", "disconnected");
    };

    this.socket.onclose = () => {
      console.log("Twitch-Verbindung geschlossen");
      this.updateConnectionStatus("❌ Verbindung getrennt", "disconnected");

      // Auto-Reconnect nach 5 Sekunden (nur im LIVE-Modus)
      if (!this.isTestMode && USE_TWITCH) {
        setTimeout(() => {
          console.log("Versuche Reconnect...");
          this.connectToTwitch();
        }, 5000);
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

    // Max. 20 Nachrichten behalten
    if (this.messages.length > this.maxMessages) {
      this.chatMessages.removeChild(this.chatMessages.firstChild);
      this.messages.shift();
    }

    // Auto-Scroll nach unten
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Check für Todo-Commands
    if (text.toLowerCase().startsWith("!todo")) {
      window.todoList.handleTodoCommand(text);
    }
  }
}

// ================= Initialisierung =================
const pomodoroTimer = new PomodoroTimer(50, 15);
window.todoList = new TodoList();
const chatSystem = new ChatSystem();

// Info-Nachrichten beim Start (nur im Test-Modus)
if (!USE_TWITCH) {
  setTimeout(() => {
    chatSystem.addMessage(
      "System",
      "💡 Test-Modus aktiv! Schreibe Nachrichten unten.",
    );
    chatSystem.addMessage("System", "📝 Probier: !todo Hausaufgaben machen");
    chatSystem.addMessage("System", "✅ !todo done 1 - Todo als erledigt");
    chatSystem.addMessage("System", "🗑️ !todo delete 1 - Todo löschen");
    chatSystem.addMessage("System", "🧹 !todo clear - Alle Todos löschen");
  }, 500);
}

console.log("Study Overlay geladen!");
console.log("Twitch-Channel:", TWITCH_CHANNEL || "Nicht konfiguriert");
console.log("Modus:", USE_TWITCH ? "LIVE bereit" : "TEST");
