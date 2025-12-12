// =============== VALIDATION MODULE ===============

export function showValidationSummary(correct, incorrect, total) {
  const summaryEl = document.getElementById('validationSummary');
  const correctEl = document.getElementById('correctCount');
  const incorrectEl = document.getElementById('incorrectCount');
  
  if (!summaryEl) return;
  
  correctEl.innerText = `${correct}/${total}`;
  incorrectEl.innerText = `${incorrect}/${total}`;
  
  summaryEl.classList.remove('hidden');
  
  setTimeout(() => {
    summaryEl.classList.add('hidden');
  }, 5000);
}

export function showValidationHints(results) {
  results.forEach(result => {
    if (!result.isCorrect && result.userAnswer !== '') {
      const taskBlock = document.getElementById(`taskBlock${result.index}`);
      if (!taskBlock) return;
      
      let hint = taskBlock.querySelector('.validation-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.className = 'validation-hint error';
        taskBlock.appendChild(hint);
      }
      
      if (result.userAnswer === '') {
        hint.innerText = '⚠️ Brak odpowiedzi';
      } else if (isNaN(result.userAnswer)) {
        hint.innerText = '❌ Odpowiedź musi być liczbą';
      } else {
        hint.innerText = '❌ Niepoprawna odpowiedź';
      }
      
      setTimeout(() => {
        hint.remove();
      }, 15000);
    }
  });
}

export function animateSuccess() {
  const inputs = document.querySelectorAll('.answer-input.correct');
  
  inputs.forEach((input, index) => {
    setTimeout(() => {
      input.style.transform = 'scale(1.05)';
      input.style.transition = 'transform 0.3s';
      
      setTimeout(() => {
        input.style.transform = 'scale(1)';
      }, 300);
    }, index * 100);
  });
}

export function handleInputChange(event) {
  const input = event.target;
  
  if (input.value === '') {
    input.classList.remove('correct', 'incorrect');
  }
  
  const taskBlock = input.closest('.task-block');
  const hint = taskBlock?.querySelector('.validation-hint');
  if (hint) {
    hint.remove();
  }
  
  const summary = document.getElementById('validationSummary');
  if (summary && !summary.classList.contains('hidden')) {
    summary.classList.add('hidden');
  }
}

export function handleInputFocus(event) {
  const input = event.target;
  
  if (input.classList.contains('incorrect')) {
    input.classList.remove('incorrect');
  }
}

export function setupValidationListeners(currentPuzzle) {
  const numTasks = currentPuzzle ? currentPuzzle.numTasks : 3;
  
  for (let i = 0; i < numTasks; i++) {
    const input = document.getElementById(`answer${i}`);
    if (!input) continue;
    
    input.removeEventListener('input', handleInputChange);
    input.removeEventListener('focus', handleInputFocus);
    
    input.addEventListener('input', handleInputChange);
    input.addEventListener('focus', handleInputFocus);
  }
}