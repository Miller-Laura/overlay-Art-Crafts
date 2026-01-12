const tools = document.querySelectorAll('.tool');
let currentIndex = 0;

// Sicherheit: abbrechen, wenn keine Tools gefunden wurden
if (tools.length === 0) {
  console.error('Keine .tool-Elemente gefunden!');
} else {

  function showTool(index) {
    tools.forEach(tool => tool.classList.remove('active'));
    tools[index].classList.add('active');
  }

  // Initial korrekt setzen
  showTool(currentIndex);

  setInterval(() => {
    currentIndex = (currentIndex + 1) % tools.length;
    showTool(currentIndex);
  }, 10000);

}
