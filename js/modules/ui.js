// =============== UI MODULE ===============

import { stopAllAudio, playIntroMessage, playResultMessage } from './audio.js';

export function updateWelcomeTexts(appConfig) {
  const titleEl = document.getElementById("welcomeTitle");
  const buttonEl = document.getElementById("welcomeButton");

  if (titleEl && appConfig.welcomeTitle) {
    titleEl.innerText = appConfig.welcomeTitle;
  }

  if (buttonEl && appConfig.welcomeButton) {
    buttonEl.innerText = appConfig.welcomeButton;
  }
}

export function showWelcomePanel() {
  const overlay = document.getElementById("welcomeOverlay");
  overlay.classList.remove("hidden");
}

export function showAlreadySolvedPanel(playerName, appConfig, areAllLettersUnlocked) {
  const overlay = document.getElementById("introOverlay");
  const img = document.getElementById("introImage");
  const textEl = document.getElementById("introText");
  const closeBtn = document.getElementById("introCloseButton");
  const playBtn = document.getElementById("playAudioButton");

  if (img) {
    img.src = "img/already-solved.png";
    img.alt = "Już rozwiązano";
    img.onerror = () => { img.style.display = 'none'; };
  }

  if (textEl) {
    if (areAllLettersUnlocked) {
      textEl.innerText = `🎉 Gratulacje, Agencie ${playerName}! Odkryłeś całe hasło: "${appConfig.finalSolution}"! Misja zakończona sukcesem!`;
    } else {
      textEl.innerText = `Agencie ${playerName}, dzisiejsze zadanie zostało już rozwiązane! Wróć jutro po nowe wyzwanie. Ultron nie śpi, ale Ty zasłużyłeś na odpoczynek!`;
    }
  }

  if (closeBtn) {
    closeBtn.innerText = "Rozumiem";
  }

  if (playBtn) {
    playBtn.classList.add("hidden");
  }

  hideMainUI();
  overlay.classList.remove("hidden");
}

export function showIntroPanel(currentPuzzle, gameDay, getImagePath) {
  const overlay = document.getElementById("introOverlay");
  const img = document.getElementById("introImage");
  const textEl = document.getElementById("introText");
  const closeBtn = document.getElementById("introCloseButton");
  const playBtn = document.getElementById("playAudioButton");

  if (!currentPuzzle) {
    if (img) {
      img.src = "img/no-puzzle.png";
      img.alt = "Brak zadania";
    }

    if (textEl) {
      textEl.innerText = "Skontaktuj się z agentem TW ;)";
    }

    if (closeBtn) {
      closeBtn.innerText = "Rozumiem";
    }

    if (playBtn) {
      playBtn.innerHTML = "🔊 Odsłuchaj Wiadomość";
      playBtn.classList.remove("hidden");
    }

    overlay.classList.remove("hidden");
    return;
  }

  const isGeneric = currentPuzzle.date.startsWith("generic");
  
  if (img) {
    if (isGeneric) {
      img.src = "img/generic-intro.png";
      img.onerror = () => { img.style.display = 'none'; };
    } else {
      img.src = getImagePath(gameDay, "intro.png");
    }
    img.alt = "Powitanie";
  }

  if (currentPuzzle.introText && textEl) {
    textEl.innerText = currentPuzzle.introText;
  }

  if (playBtn) {
    playBtn.innerHTML = "🔊 Odsłuchaj Wiadomość";
    playBtn.classList.remove("hidden");
  }

  if (closeBtn) {
    closeBtn.innerText = "Zaczynamy!";
  }

  overlay.classList.remove("hidden");
}

export function showResultPopup(isSuccess, currentPuzzle, appConfig, gameDay, getImagePath, getRandomErrorImage, rewardChar = null) {
  const overlay = document.getElementById("resultPopup");
  const img = document.getElementById("resultImage");
  const textEl = document.getElementById("resultText");
  const rewardSection = document.getElementById("rewardSection");
  const rewardLabel = document.getElementById("rewardLetterLabel");
  const playBtn = document.getElementById("playResultAudioButton");

  const isGeneric = currentPuzzle && currentPuzzle.date.startsWith("generic");

  if (isSuccess) {
    if (img) {
      if (isGeneric) {
        img.src = "img/generic-success.png";
        img.onerror = () => { img.style.display = 'none'; };
      } else {
        img.src = getImagePath(gameDay, "success.png");
      }
      img.alt = "Sukces";
    }

    if (textEl && currentPuzzle.successText) {
      textEl.innerText = currentPuzzle.successText;
    }

    if (rewardSection) {
      rewardSection.classList.remove("hidden");
    }

    if (rewardLabel && rewardChar) {
      rewardLabel.innerText = rewardChar;
    }

    if (playBtn) {
      playBtn.classList.remove("hidden");
    }
  } else {
    if (img) {
      img.src = getRandomErrorImage(appConfig);
      img.alt = "Błąd";
    }

    if (textEl && appConfig.errorText) {
      textEl.innerText = appConfig.errorText;
    }

    if (rewardSection) {
      rewardSection.classList.add("hidden");
    }

    if (playBtn) {
      playBtn.classList.add("hidden");
    }
  }

  overlay.classList.remove("hidden");
}

export function hideMainUI() {
  const tasksContainer = document.querySelector(".tasks-container");
  const buttonContainer = document.querySelector(".button-container");

  if (tasksContainer) tasksContainer.style.display = "none";
  if (buttonContainer) buttonContainer.style.display = "none";
}

export function showExtraTasks(show) {
  const extraTaskIds = [3, 4, 5];
  
  extraTaskIds.forEach(id => {
    const block = document.getElementById(`taskBlock${id}`);
    const separator = document.getElementById(`separator${id}`);
    
    if (block) {
      if (show) {
        block.classList.remove('hidden');
      } else {
        block.classList.add('hidden');
      }
    }
    
    if (separator) {
      separator.style.display = show ? 'block' : 'none';
    }
  });
}

export function clearAllTasks() {
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById(`taskText${i}`);
    if (el) el.innerText = "";
  }
}

export function disableInputs(currentPuzzle) {
  const numInputs = currentPuzzle ? currentPuzzle.numTasks : 6;
  
  for (let i = 0; i < numInputs; i++) {
    const input = document.getElementById(`answer${i}`);
    if (input) input.disabled = true;
  }
  const btn = document.getElementById("checkButton");
  if (btn) btn.disabled = true;
}

export function updateLettersLabel(playerRow, appConfig) {
  const label = document.getElementById("lettersLabel");
  const congratsLabel = document.getElementById("congratsLabel");

  if (!appConfig || !appConfig.finalSolution) {
    label.innerText = "";
    if (congratsLabel) congratsLabel.classList.add("hidden");
    return;
  }

  const final = appConfig.finalSolution;
  const unlocked = playerRow && Array.isArray(playerRow.letter_indexes)
    ? playerRow.letter_indexes
    : [];

  let pattern = "";
  let allUnlocked = true;

  for (let i = 0; i < final.length; i++) {
    const ch = final[i];

    if (ch === " ") {
      pattern += "   ";
      continue;
    }

    if (unlocked.includes(i)) {
      pattern += ch + " ";
    } else {
      pattern += "_ ";
      allUnlocked = false;
    }
  }

  label.innerText = pattern.trim();

  if (congratsLabel) {
    if (allUnlocked) {
      congratsLabel.classList.remove("hidden");
    } else {
      congratsLabel.classList.add("hidden");
    }
  }
}

export function ensurePlayerName() {
  return new Promise((resolve) => {
    const storedName = localStorage.getItem("player_name");
    const nameLabel = document.getElementById("nameLabel");
    const overlay = document.getElementById("nameOverlay");
    const input = document.getElementById("nameInput");
    const btn = document.getElementById("saveNameButton");

    if (storedName) {
      nameLabel.innerText = storedName;
      overlay.classList.add("hidden");
      resolve(storedName);
      return;
    }

    overlay.classList.remove("hidden");

    btn.addEventListener("click", () => {
      const val = (input.value || "").trim();
      if (!val) {
        alert("Podaj imię.");
        return;
      }

      localStorage.setItem("player_name", val);
      nameLabel.innerText = val;
      overlay.classList.add("hidden");
      resolve(val);
    }, { once: true });
  });
}

export function setupIntroListeners(stopAllAudio, playIntroMessage) {
  const closeBtn = document.getElementById("introCloseButton");
  const playBtn = document.getElementById("playAudioButton");
  const overlay = document.getElementById("introOverlay");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.add("hidden");
      stopAllAudio();
    });
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      playIntroMessage();
    });
  }
}

export function setupResultListeners(stopAllAudio, playResultMessage) {
  const closeBtn = document.getElementById("closeResultButton");
  const playBtn = document.getElementById("playResultAudioButton");
  const overlay = document.getElementById("resultPopup");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.classList.add("hidden");
      stopAllAudio();
    });
  }

  if (playBtn) {
    playBtn.addEventListener("click", () => {
      playResultMessage();
    });
  }
}