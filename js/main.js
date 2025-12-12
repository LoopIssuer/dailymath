// =============== MAIN APP ENTRY POINT ===============

// Import modules
import { loadConfig, getGameDayDate, getImagePath, getRandomErrorImage, tryLoadTaskImage } from './modules/utils.js';
import { loadPlayerByName, updatePlayerAfterSolve } from './modules/database.js';
import { generateMathTasks } from './modules/taskGenerator.js';
import { initVoices, initInterferenceAudio, stopAllAudio, playIntroMessage, playResultMessage } from './modules/audio.js';
import { 
  updateWelcomeTexts, 
  showWelcomePanel, 
  showAlreadySolvedPanel, 
  showIntroPanel, 
  showResultPopup,
  hideMainUI,
  showExtraTasks,
  clearAllTasks,
  disableInputs,
  updateLettersLabel,
  ensurePlayerName,
  setupIntroListeners,
  setupResultListeners
} from './modules/ui.js';
import { showValidationSummary, showValidationHints, animateSuccess, setupValidationListeners } from './modules/validation.js';
import { selectGenericPuzzle, getNextUnlockedIndex, hasAlreadySolvedToday, areAllLettersUnlocked } from './modules/game.js';

// Global state
let appConfig = null;
let currentPuzzle = null;
let gameDay = null;
let playerRow = null;
let playerName = null;
let generatedTasks = null;

// Setup welcome button listener
function setupWelcomeListener() {
  const btn = document.getElementById("welcomeButton");
  const overlay = document.getElementById("welcomeOverlay");

  if (btn) {
    btn.addEventListener("click", () => {
      overlay.classList.add("hidden");
      
      if (hasAlreadySolvedToday(playerRow, gameDay)) {
        showAlreadySolvedPanel(playerName, appConfig, areAllLettersUnlocked(appConfig, playerRow));
      } else {
        showIntroPanel(currentPuzzle, gameDay, getImagePath);
      }
    });
  }
}

// Render puzzle UI
function renderPuzzleUI() {
  if (hasAlreadySolvedToday(playerRow, gameDay)) {
    clearAllTasks();
    disableInputs(currentPuzzle);
    return;
  }

  currentPuzzle = appConfig.puzzles.find((p) => p.date === gameDay);

  if (!currentPuzzle) {
    console.log("Brak puzzle dla daty:", gameDay, "- używam generic");
    
    currentPuzzle = selectGenericPuzzle(gameDay, appConfig);
    
    if (!currentPuzzle) {
      console.error("Brak generic puzzli w konfiguracji!");
      clearAllTasks();
      disableInputs(currentPuzzle);
      hideMainUI();
      return;
    }
    
    generatedTasks = generateMathTasks(gameDay, 6);
    
    console.log("Wygenerowane 6 zadań:", generatedTasks);
    
    currentPuzzle = {
      ...currentPuzzle,
      tasks: generatedTasks.tasks,
      answers: generatedTasks.answers,
      isGeneric: true,
      numTasks: 6
    };
    
    showExtraTasks(true);
  } else {
    currentPuzzle.numTasks = 3;
    showExtraTasks(false);
  }

  currentPuzzle.tasks.forEach((t, idx) => {
    const el = document.getElementById(`taskText${idx}`);
    if (el) el.innerText = t;
  });

  if (!currentPuzzle.isGeneric) {
    for (let i = 0; i < currentPuzzle.numTasks; i++) {
      tryLoadTaskImage(gameDay, i);
    }
  }
  
  setupValidationListeners(currentPuzzle);
}

// Check answers
async function onCheckClick() {
  if (!currentPuzzle) return;

  if (hasAlreadySolvedToday(playerRow, gameDay)) {
    alert("Już rozwiązałeś dzisiejsze zadanie! Wróć jutro.");
    return;
  }

  const numTasks = currentPuzzle.numTasks || 3;
  const userAnswers = [];
  const validationResults = [];
  let correctCount = 0;
  let incorrectCount = 0;
  
  for (let i = 0; i < numTasks; i++) {
    const input = document.getElementById(`answer${i}`);
    const answer = input.value.trim().toUpperCase();
    userAnswers.push(answer);
    
    const correctAnswer = currentPuzzle.answers[i].toUpperCase();
    const isCorrect = answer === correctAnswer;
    
    validationResults.push({
      index: i,
      isCorrect: isCorrect,
      userAnswer: answer,
      correctAnswer: correctAnswer
    });
    
    if (answer === '') {
      input.classList.remove('correct', 'incorrect');
    } else if (isCorrect) {
      input.classList.remove('incorrect');
      input.classList.add('correct');
      correctCount++;
    } else {
      input.classList.remove('correct');
      input.classList.add('incorrect');
      incorrectCount++;
    }
  }
  
  showValidationSummary(correctCount, incorrectCount, numTasks);
  
  const allCorrect = validationResults.every(v => v.isCorrect);
  
  if (!allCorrect) {
    if (incorrectCount > 0) {
      showValidationHints(validationResults);
    }
    
    setTimeout(() => {
      showResultPopup(false, currentPuzzle, appConfig, gameDay, getImagePath, getRandomErrorImage);
    }, 100);
    
    return;
  }

  animateSuccess();
  
  // Calculate reward
  let rewardIndex;
  
  if (currentPuzzle.isGeneric) {
    const currentIndexes = playerRow?.letter_indexes || [];
    rewardIndex = getNextUnlockedIndex(appConfig.finalSolution, currentIndexes);
    
    if (rewardIndex === -1) {
      console.log("Wszystkie litery już odblokowane!");
      rewardIndex = null;
    }
  } else {
    rewardIndex = currentPuzzle.rewardIndex;
  }
  
  // Update database
  const result = await updatePlayerAfterSolve(playerRow, playerName, gameDay, appConfig.finalSolution, rewardIndex);
  if (result.playerRow) {
    playerRow = result.playerRow;
  }
  
  updateLettersLabel(playerRow, appConfig);

  const final = appConfig.finalSolution;
  let rewardChar = "?";
  
  if (rewardIndex !== null && rewardIndex >= 0 && rewardIndex < final.length) {
    rewardChar = final[rewardIndex];
  } else if (rewardIndex === null) {
    rewardChar = "✓";
  }

  setTimeout(() => {
    showResultPopup(true, currentPuzzle, appConfig, gameDay, getImagePath, getRandomErrorImage, rewardChar);
  }, 1000);
  
  disableInputs(currentPuzzle);
}

// Main initialization
window.addEventListener("DOMContentLoaded", async () => {
  try {
    appConfig = await loadConfig();
  } catch (e) {
    console.error("Błąd wczytywania config.json:", e);
    alert("Nie udało się wczytać konfiguracji gry.");
    return;
  }

  initInterferenceAudio();
  updateWelcomeTexts(appConfig);

  setupWelcomeListener();
  setupIntroListeners(stopAllAudio, playIntroMessage);
  setupResultListeners(stopAllAudio, playResultMessage);

  playerName = await ensurePlayerName();

  gameDay = getGameDayDate();
  document.getElementById("dateLabel").innerText = gameDay;

  playerRow = await loadPlayerByName(playerName);

  renderPuzzleUI();
  updateLettersLabel(playerRow, appConfig);

  document.getElementById("checkButton").addEventListener("click", onCheckClick);

  showWelcomePanel();
  
  // Init voices
  if ('speechSynthesis' in window) {
    initVoices().then((voices) => {
      console.log("Załadowano głosów:", voices.length);
      const adam = voices.find(v => v.name.includes('Adam'));
      if (adam) {
        console.log("✅ Głos Adam dostępny:", adam.name);
      }
    });
  }
});