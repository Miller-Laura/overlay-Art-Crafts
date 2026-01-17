// Pomodoro Timer
class PomodoroTimer {
  constructor(workMinutes = 30, breakMinutes = 15) {
    this.workMinutes = workMinutes;
    this.breakMinutes = breakMinutes;
    this.totalSeconds = workMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = false;
    this.isWorkSession = true;
    this.timerInterval = null;
    this.timerDisplay = document.querySelector('.timer-display');
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.resetBtn = document.getElementById('resetBtn');
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.startBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset());
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
      ? 'Pause beendet! Neuer Work-Session gestartet.' 
      : 'Work-Session beendet! Pause-Zeit.';
    alert(message);
    
    this.updateDisplay();
  }

  updateDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    this.timerDisplay.textContent = 
      `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}

// Timer initialisieren
const pomodoroTimer = new PomodoroTimer(40, 15);

class TodoList 
{
  constructor() 
  {
    this.todoListElement = document.getElementById('todo-list');
    this.todos = [];
    this.loadTodos();
    this.render();
  }
  loadTodos() 
  {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) 
    {
      this.todos = JSON.parse(savedTodos);
    }
  }
  saveTodos() 
  {
    localStorage.setItem('todos', JSON.stringify(this.todos));
  }
  render() 
  {
    //Liste im DOM leeren
    this.todoListElement.innerHTML = "";
    //Liste neu aufbauen, für jedes Todo ein Listenelement erstellen
    this.todos.forEach((todo, index) => 
    {
      const li = document.createElement('li');
      li.textContent = todo;
      // Klick-Event zum Entfernen des Todos
      li.addEventListener('click', () => 
      {
        this.removeTodo(index);
      });
      // Listenelement zum DOM hinzufügen, <li> in <ul>
      this.todoListElement.appendChild(li);
    },

    function addTodo(text) 
    {
      this.todos.push(text);
      this.saveTodos();
      this.render();
    },

    function markTodoDone(index) 
    {
      if (index >= 0 && index < this.todos.length) 
      {
        this.todos[index] = this.todos[index] + " (done)";
        this.saveTodos();
        this.render();
      }
    },

    function handleTodoCommand(message) 
    {
     const parts = message.trim().split(" ");
     // parts[0] ist z.B. "!todo"
     const sub = (parts[1] || "").toLowerCase();

     if (!sub || sub === "add") 
      {
        const text = parts.slice(sub ? 2 : 1).join(" ");
        addTodo(text);
      } 
      else if (sub === "done") 
      {
        const index = parseInt(parts[2], 10);
        markTodoDone(index);
      } 
      else if (sub === "delete") 
      {
        const index = parseInt(parts[2], 10);
        this.removeTodo(index);
      }
    }

  );
  }
}
