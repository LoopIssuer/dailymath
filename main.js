// KLUCZ DLA LOCALSTORAGE
const STORAGE_KEY = "puzzleProgress";

// Globalne zmienne konfiguracyjne
let appConfig = null;      // zawartość config.json
let currentPuzzle = null;  // dzisiejsze zadanie
let gameDay = null;        // data dnia gry, np. "2025-01-12"
let progress = null;       // postęp gracza z localStorage

// -------------- ENTRY POINT --------------
window.addEventListener("DOMContentLoaded", async () => {
    progress = loadProgress();

    // Wczytanie config.json
    appConfig = await loadConfig();

    // Wyznaczenie "dnia gry"
    gameDay = getGameDayDate();
    document.getElementById("dateLabel").innerText = gameDay;

    console.log("gameDay:", gameDay);
    console.log("config puzzles:", appConfig.puzzles);

    // Szukamy zadania dla danego dnia
    currentPuzzle = appConfig.puzzles.find(p => p.date === gameDay);

    if (!currentPuzzle) {
        // Brak zadania na ten dzień
        document.getElementById("taskText0").innerText = "Brak zadania na ten dzień.";
        document.getElementById("taskText1").innerText = "";
        document.getElementById("taskText2").innerText = "";
        disableInputs();
    } else {
        // Ustaw tekst zadań
        currentPuzzle.tasks.forEach((t, idx) => {
            const el = document.getElementById(`taskText${idx}`);
            if (el) el.innerText = t;
        });
    }

    // Ustaw etykietę z hasłem / literami
    updateLettersLabel();

    // Listeners
    document.getElementById("checkButton")
        .addEventListener("click", onCheckClick);

    document.getElementById("closePopupButton")
        .addEventListener("click", () => {
            document.getElementById("successPopup").classList.add("hidden");
        });
});

// -------------- FUNKCJE POMOCNICZE --------------

// Wczytanie config.json (zawiera finalSolution i puzzle)
async function loadConfig() {
    const res = await fetch("config.json");
    if (!res.ok) {
        throw new Error("Nie udało się wczytać config.json");
    }
    return await res.json();
}

// Określenie "dnia gry" (24h od 15:00 do 14:59 następnego dnia)
function getGameDayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();      // 0–11
    const day = now.getDate();         // 1–31

    // Startujemy od "dzisiaj"
    let gameDay = new Date(year, month, day);

    // Jeśli jest przed 15:00, to dzień gry to "wczoraj"
    if (now.getHours() < 15) {
        gameDay.setDate(gameDay.getDate() - 1);
    }

    const yyyy = gameDay.getFullYear();
    const mm = String(gameDay.getMonth() + 1).padStart(2, "0");
    const dd = String(gameDay.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// Wczytanie postępu z localStorage
function loadProgress() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return { letters: "", solvedDays: [] };
    }
    try {
        return JSON.parse(raw);
    } catch {
        return { letters: "", solvedDays: [] };
    }
}

// Zapis postępu do localStorage
function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// Aktualizacja napisu na dole (pattern hasła)
function updateLettersLabel() {
    const label = document.getElementById("lettersLabel");

    if (!appConfig || !appConfig.finalSolution) {
        label.innerText = progress.letters || "_";
        return;
    }

    const final = appConfig.finalSolution;
    let pattern = "";

    for (let i = 0; i < final.length; i++) {
        if (i < progress.letters.length) {
            pattern += final[i];
        } else {
            pattern += "_";
        }

        // Opcjonalne spacje, żeby było czytelniej
        pattern += " ";
    }

    label.innerText = pattern.trim();
}

// Zablokowanie inputów, gdy nie ma zadania
function disableInputs() {
    for (let i = 0; i < 3; i++) {
        const input = document.getElementById(`answer${i}`);
        if (input) input.disabled = true;
    }
    document.getElementById("checkButton").disabled = true;
}

// -------------- LOGIKA SPRAWDZANIA --------------

async function onCheckClick() {
    if (!currentPuzzle) return;

    // Pobranie odpowiedzi użytkownika
    const userAnswers = [
        document.getElementById("answer0").value.trim(),
        document.getElementById("answer1").value.trim(),
        document.getElementById("answer2").value.trim()
    ].map(a => a.toUpperCase());

    const correctAnswers = currentPuzzle.answers.map(a => a.toUpperCase());

    const allCorrect = userAnswers.every((ans, i) => ans === correctAnswers[i]);

    if (!allCorrect) {
        alert("Nie wszystkie odpowiedzi są poprawne. Spróbuj ponownie.");
        return;
    }

    // Sprawdzamy, czy już dzisiaj rozwiązano zadanie
    if (!progress.solvedDays.includes(gameDay)) {
        progress.solvedDays.push(gameDay);
        progress.letters += currentPuzzle.rewardLetter;
        saveProgress();
    }

    // Odśwież napis z hasłem / literami
    updateLettersLabel();

    // Pokaż popup z literą
    document.getElementById("rewardLetterLabel").innerText = currentPuzzle.rewardLetter;
    document.getElementById("successPopup").classList.remove("hidden");

    
}
