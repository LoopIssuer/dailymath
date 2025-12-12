// =============== KONFIG SUPABASE ===============
const SUPABASE_URL = "https://hfdhqvesvxbrzgpgzawa.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZGhxdmVzdnhicnpncGd6YXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDE4MzQsImV4cCI6MjA4MDc3NzgzNH0.K7Dt7gQbXO8zvA60HVlDHV4nNRF3Q6jKfJsqjzuW3uE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================== GLOBALNE ZMIENNE =====================
let appConfig = null;
let currentPuzzle = null;
let gameDay = null;
let playerRow = null;
let playerName = null;
let voicesLoaded = false;
let interferenceAudio = null;

// ===================== INICJALIZACJA GŁOSÓW TTS =====================
function initVoices() {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      voicesLoaded = true;
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

if ('speechSynthesis' in window) {
  initVoices().then((voices) => {
    console.log("Załadowano głosów:", voices.length);
    const adam = voices.find(v => v.name.includes('Adam'));
    if (adam) {
      console.log("✅ Głos Adam dostępny:", adam.name);
    } else {
      console.log("⚠️ Głos Adam niedostępny, dostępne polskie głosy:");
      voices.filter(v => v.lang.startsWith('pl')).forEach(v => console.log("  -", v.name));
    }
  });
}

// ===================== ENTRY POINT =====================
window.addEventListener("DOMContentLoaded", async () => {
  try {
    appConfig = await loadConfig();
  } catch (e) {
    console.error("Błąd wczytywania config.json:", e);
    alert("Nie udało się wczytać konfiguracji gry.");
    return;
  }

  // Przygotuj audio interference
  interferenceAudio = new Audio("audio/interference.mp3");
  interferenceAudio.loop = true;
  interferenceAudio.volume = 0.3;

  // Ustaw teksty z configa dla panelu powitalnego
  updateWelcomeTexts();

  // Przygotuj wszystkie listenery
  setupWelcomeListener();
  setupIntroListeners();
  setupResultListeners();

  // Pobierz/zapisz imię gracza
  await ensurePlayerName();

  // Ustaw datę
  gameDay = getGameDayDate();
  document.getElementById("dateLabel").innerText = gameDay;

  // Wczytaj progres gracza
  playerRow = await loadPlayerByName(playerName);

  // Wyrenderuj zadanie
  renderPuzzleUI();
  updateLettersLabel();

  // Przycisk sprawdzania
  document.getElementById("checkButton").addEventListener("click", onCheckClick);

  // Pokaż CZARNY PANEL POWITALNY
  showWelcomePanel();
});

// ===================== Wczytywanie config.json =====================
async function loadConfig() {
  const res = await fetch("config.json");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

// ===================== Dzień gry =====================
function getGameDayDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// ===================== Budowanie ścieżek obrazków =====================
function getImagePath(date, filename) {
  return `img/${date}/${filename}`;
}

// ===================== Losowanie obrazka błędu =====================
function getRandomErrorImage() {
  if (!appConfig || !Array.isArray(appConfig.errorImages) || appConfig.errorImages.length === 0) {
    return "img/errors/default.png";
  }
  
  const randomIndex = Math.floor(Math.random() * appConfig.errorImages.length);
  return appConfig.errorImages[randomIndex];
}

// ===================== Ładowanie opcjonalnych obrazków zadań =====================
function tryLoadTaskImage(date, taskIndex) {
  const imgElement = document.getElementById(`taskImage${taskIndex}`);
  if (!imgElement) return;

  const imagePath = getImagePath(date, `task${taskIndex + 1}.png`);

  imgElement.classList.add('hidden');
  imgElement.src = '';

  const testImg = new Image();
  
  testImg.onload = () => {
    imgElement.src = imagePath;
    imgElement.classList.remove('hidden');
  };
  
  testImg.onerror = () => {
    imgElement.classList.add('hidden');
  };
  
  testImg.src = imagePath;
}

// ===================== Imię użytkownika =====================
function ensurePlayerName() {
  return new Promise((resolve) => {
    const storedName = localStorage.getItem("player_name");
    const nameLabel = document.getElementById("nameLabel");
    const overlay = document.getElementById("nameOverlay");
    const input = document.getElementById("nameInput");
    const btn = document.getElementById("saveNameButton");

    if (storedName) {
      playerName = storedName;
      nameLabel.innerText = playerName;
      overlay.classList.add("hidden");
      resolve();
      return;
    }

    overlay.classList.remove("hidden");

    btn.addEventListener(
      "click",
      () => {
        const val = (input.value || "").trim();
        if (!val) {
          alert("Podaj imię.");
          return;
        }

        playerName = val;
        localStorage.setItem("player_name", playerName);
        nameLabel.innerText = playerName;
        overlay.classList.add("hidden");
        resolve();
      },
      { once: true }
    );
  });
}

// ===================== Wczytanie progresu gracza z Supabase =====================
async function loadPlayerByName(name) {
  try {
    const { data, error } = await supabaseClient
      .from("players")
      .select("*")
      .eq("name", name)
      .maybeSingle();

    if (error) {
      console.error("Błąd SELECT players:", error);
      return null;
    }

    return data;
  } catch (e) {
    console.error("Wyjątek przy loadPlayerByName:", e);
    return null;
  }
}

// ===================== WELCOME PANEL =====================
function updateWelcomeTexts() {
  const titleEl = document.getElementById("welcomeTitle");
  const buttonEl = document.getElementById("welcomeButton");

  if (titleEl && appConfig.welcomeTitle) {
    titleEl.innerText = appConfig.welcomeTitle;
  }

  if (buttonEl && appConfig.welcomeButton) {
    buttonEl.innerText = appConfig.welcomeButton;
  }
}

function setupWelcomeListener() {
  const btn = document.getElementById("welcomeButton");
  const overlay = document.getElementById("welcomeOverlay");

  if (btn) {
    btn.addEventListener("click", () => {
      overlay.classList.add("hidden");
      showIntroPanel();
    });
  }
}

function showWelcomePanel() {
  const overlay = document.getElementById("welcomeOverlay");
  overlay.classList.remove("hidden");
}

// ===================== INTRO PANEL =====================
function setupIntroListeners() {
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

function showIntroPanel() {
  const overlay = document.getElementById("introOverlay");
  const img = document.getElementById("introImage");
  const textEl = document.getElementById("introText");
  const closeBtn = document.getElementById("introCloseButton");
  const playBtn = document.getElementById("playAudioButton");

  // 🔴 KLUCZOWA ZMIANA:
  // Jeśli NIE ma zadania na ten dzień (brak w configu),
  // w ogóle NIE pokazujemy panelu intro.
  if (!currentPuzzle) {
    if (overlay) {
      overlay.classList.add("hidden");
    }
    return;
  }

  // ─────────────────────────────
  // Normalna ścieżka, gdy puzzle są
  // ─────────────────────────────
  if (img) {
    img.src = getImagePath(gameDay, "intro.png");
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


// ========== ODTWARZANIE WIADOMOŚCI INTRO ==========
async function playIntroMessage() {
  const textEl = document.getElementById("introText");

  if (!textEl || !textEl.innerText) {
    console.warn("Brak tekstu do odczytania");
    return;
  }

  playInterferenceAudio();
  await speakText(textEl.innerText);
}

// ========== ODTWARZANIE WIADOMOŚCI WYNIKU ==========
async function playResultMessage() {
  const textEl = document.getElementById("resultText");

  if (!textEl || !textEl.innerText) {
    console.warn("Brak tekstu do odczytania");
    return;
  }

  playInterferenceAudio();
  await speakText(textEl.innerText);
}

// ========== INTERFERENCE AUDIO ==========
function playInterferenceAudio() {
  if (interferenceAudio) {
    interferenceAudio.currentTime = 0;
    interferenceAudio.play().catch((err) => {
      console.warn("Nie udało się odtworzyć interference.mp3:", err);
    });
  }
}

function stopInterferenceAudio() {
  if (interferenceAudio) {
    interferenceAudio.pause();
    interferenceAudio.currentTime = 0;
  }
}

// ========== ZATRZYMAJ WSZYSTKIE AUDIO ==========
function stopAllAudio() {
  stopInterferenceAudio();
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ========== SYNTEZATOR MOWY ==========
async function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert("Twoja przeglądarka nie obsługuje syntezatora mowy.");
    stopInterferenceAudio();
    return;
  }

  window.speechSynthesis.cancel();

  if (!voicesLoaded) {
    await initVoices();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  utterance.lang = 'pl-PL';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const adamVoice = voices.find(voice => 
    voice.name.includes('Adam') && voice.lang.startsWith('pl')
  );

  if (adamVoice) {
    utterance.voice = adamVoice;
    console.log("Używam głosu:", adamVoice.name);
  } else {
    const msPolishVoice = voices.find(voice => 
      voice.name.includes('Microsoft') && voice.lang.startsWith('pl')
    );
    
    if (msPolishVoice) {
      utterance.voice = msPolishVoice;
      console.log("Adam niedostępny, używam:", msPolishVoice.name);
    } else {
      const anyPolishVoice = voices.find(voice => voice.lang.startsWith('pl'));
      if (anyPolishVoice) {
        utterance.voice = anyPolishVoice;
        console.log("Brak głosu Microsoft, używam:", anyPolishVoice.name);
      } else {
        console.warn("Brak polskiego głosu, używam domyślnego");
      }
    }
  }

  utterance.onend = () => {
    stopInterferenceAudio();
  };

  utterance.onerror = (event) => {
    console.error('Błąd syntezatora mowy:', event);
    stopInterferenceAudio();
  };

  window.speechSynthesis.speak(utterance);
}

// ===================== RESULT POPUP =====================
function setupResultListeners() {
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

function showResultPopup(isSuccess, rewardChar = null) {
  const overlay = document.getElementById("resultPopup");
  const img = document.getElementById("resultImage");
  const textEl = document.getElementById("resultText");
  const rewardSection = document.getElementById("rewardSection");
  const rewardLabel = document.getElementById("rewardLetterLabel");
  const playBtn = document.getElementById("playResultAudioButton");

  if (isSuccess) {
    // ========== SUKCES ==========
    if (img) {
      img.src = getImagePath(gameDay, "success.png");
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

    // Pokaż przycisk audio przy sukcesie
    if (playBtn) {
      playBtn.classList.remove("hidden");
    }
  } else {
    // ========== BŁĄD ==========
    if (img) {
      img.src = getRandomErrorImage();
      img.alt = "Błąd";
    }

    if (textEl && appConfig.errorText) {
      textEl.innerText = appConfig.errorText;
    }

    if (rewardSection) {
      rewardSection.classList.add("hidden");
    }

    // Ukryj przycisk audio przy błędzie
    if (playBtn) {
      playBtn.classList.add("hidden");
    }
  }

  overlay.classList.remove("hidden");
}

// ===================== Render zadań =====================
function renderPuzzleUI() {
  currentPuzzle = appConfig.puzzles.find((p) => p.date === gameDay);

  if (!currentPuzzle) {
    document.getElementById("taskText0").innerText = "";
    document.getElementById("taskText1").innerText = "";
    document.getElementById("taskText2").innerText = "";
    disableInputs();
    hideMainUI();
    return;
  }

  currentPuzzle.tasks.forEach((t, idx) => {
    const el = document.getElementById(`taskText${idx}`);
    if (el) el.innerText = t;
  });

  for (let i = 0; i < 3; i++) {
    tryLoadTaskImage(gameDay, i);
  }
}

// ===================== Ukrycie głównego UI =====================
function hideMainUI() {
  const tasksContainer = document.querySelector(".tasks-container");
  const buttonContainer = document.querySelector(".button-container");

  if (tasksContainer) tasksContainer.style.display = "none";
  if (buttonContainer) buttonContainer.style.display = "none";
}

// ===================== Wyświetlanie liter / hasła =====================
function updateLettersLabel() {
  const label = document.getElementById("lettersLabel");

  if (!appConfig || !appConfig.finalSolution) {
    label.innerText = "";
    return;
  }

  const final = appConfig.finalSolution;
  const unlocked =
    playerRow && Array.isArray(playerRow.letter_indexes)
      ? playerRow.letter_indexes
      : [];

  let pattern = "";

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
    }
  }

  label.innerText = pattern.trim();
}

// ===================== Blokada inputów =====================
function disableInputs() {
  for (let i = 0; i < 3; i++) {
    const input = document.getElementById(`answer${i}`);
    if (input) input.disabled = true;
  }
  const btn = document.getElementById("checkButton");
  if (btn) btn.disabled = true;
}

// ===================== Aktualizacja progresu w bazie =====================
async function updatePlayerAfterSolve() {
  const rewardIndex = currentPuzzle.rewardIndex;

  if (!playerRow) {
    const { data, error } = await supabaseClient
      .from("players")
      .insert([
        {
          name: playerName,
          letter_indexes: [rewardIndex],
          solved_days: [gameDay],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Błąd INSERT players:", error);
      return;
    }

    playerRow = data;
    return;
  }

  const alreadySolved = (playerRow.solved_days || []).includes(gameDay);
  if (alreadySolved) {
    return;
  }

  const currentIndexes = Array.isArray(playerRow.letter_indexes)
    ? playerRow.letter_indexes
    : [];

  const newIndexes = currentIndexes.includes(rewardIndex)
    ? currentIndexes
    : [...currentIndexes, rewardIndex];

  const newSolved = [...(playerRow.solved_days || []), gameDay];

  const { data, error } = await supabaseClient
    .from("players")
    .update({
      letter_indexes: newIndexes,
      solved_days: newSolved,
    })
    .eq("id", playerRow.id)
    .select()
    .single();

  if (error) {
    console.error("Błąd UPDATE players:", error);
    return;
  }

  playerRow = data;
}

// ===================== Sprawdzanie odpowiedzi =====================
async function onCheckClick() {
  if (!currentPuzzle) return;

  const userAnswers = [
    document.getElementById("answer0").value.trim().toUpperCase(),
    document.getElementById("answer1").value.trim().toUpperCase(),
    document.getElementById("answer2").value.trim().toUpperCase(),
  ];

  const correctAnswers = currentPuzzle.answers.map((a) => a.toUpperCase());
  const allCorrect = userAnswers.every((ans, i) => ans === correctAnswers[i]);

  if (!allCorrect) {
    showResultPopup(false);
    return;
  }

  await updatePlayerAfterSolve();
  updateLettersLabel();

  const final = appConfig.finalSolution;
  const rewardIndex = currentPuzzle.rewardIndex;
  const rewardChar =
    typeof rewardIndex === "number" && rewardIndex >= 0 && rewardIndex < final.length
      ? final[rewardIndex]
      : "?";

  showResultPopup(true, rewardChar);
}