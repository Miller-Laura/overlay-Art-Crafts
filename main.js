// ================= Pomodoro Timer =================
class PomodoroTimer {
  constructor(workMinutes = 30, breakMinutes = 15) {
    this.workMinutes = workMinutes;
    this.breakMinutes = breakMinutes;
    this.totalSeconds = workMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = false;
    this.isWorkSession = true;
    this.timerInterval = null;

    this.timerDisplay = document.querySelector(".timer-display");
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
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startBtn.disabled = true;

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
    clearInterval(this.timerInterval);
  }

  reset() {
    this.pause();
    this.isWorkSession = true;
    this.remainingSeconds = this.workMinutes * 60;
    this.updateDisplay();
  }

  switchSession() {
    this.isWorkSession = !this.isWorkSession;
    this.remainingSeconds = this.isWorkSession
      ? this.workMinutes * 60
      : this.breakMinutes * 60;
    this.isRunning = false;
    this.startBtn.disabled = false;
    clearInterval(this.timerInterval);

    const message = this.isWorkSession
      ? "Pause beendet! Neuer Work-Session gestartet."
      : "Work-Session beendet! Pause-Zeit.";
    alert(message);

    this.updateDisplay();
  }

  updateDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    this.timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
}

// Timer initialisieren
const pomodoroTimer = new PomodoroTimer(40, 15);

// ================= Todo-Liste =================
class TodoList {
  constructor() {
    this.todoListElement = document.getElementById("todo-list");
    this.todos = [];
    this.loadTodos();
    this.render();
  }

  loadTodos() {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      this.todos = JSON.parse(savedTodos);
    }
  }

  saveTodos() {
    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  render() {
    // Liste im DOM leeren
    this.todoListElement.innerHTML = "";

    // Liste neu aufbauen
    this.todos.forEach((todo, index) => {
      const li = document.createElement("li");
      li.textContent = todo;

      // Klick: Todo entfernen
      li.addEventListener("click", () => {
        this.removeTodo(index);
      });

      this.todoListElement.appendChild(li);

      // Einblend-Animation
      requestAnimationFrame(() => {
        li.classList.add("show");
      });
    });
  }

  addTodo(text) {
    if (!text || !text.trim()) return;
    this.todos.push(text.trim());
    this.saveTodos();
    this.render();
  }

  removeTodo(index) {
    if (index < 0 || index >= this.todos.length) return;
    this.todos.splice(index, 1);
    this.saveTodos();
    this.render();
  }

  markTodoDone(index) {
    if (index < 0 || index >= this.todos.length) return;
    this.todos[index] = this.todos[index] + " X ";
    this.saveTodos();
    this.render();
  }

  // stabile, einfache Version: nur "!todo Aufgabe ..."

  handleTodoCommand(message) {
    const parts = message.trim().split(" ");
    const command = (parts[0] || "").toLowerCase();

    if (command !== "!todo") return;

    const sub = (parts[1] || "").toLowerCase();

    // Fall: nur "!todo Text" → hinzufügen
    if (!sub || sub === "add") {
      const text = parts.slice(sub ? 2 : 1).join(" ");
      this.addTodo(text);
      return;
    }

    // Fall: "!todo delete 1"
    if (sub === "delete") {
      const index = parseInt(parts[2], 10) - 1; // 1 → 0
      if (!Number.isNaN(index)) {
        this.removeTodo(index);
      }
    }
  }
}

// Todo-Instanz global verfügbar machen
window.todoList = new TodoList();
// ================= Chat-Integration =================
