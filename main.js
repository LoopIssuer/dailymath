// =============== KONFIG SUPABASE ===============
// PODMIEŃ na swoje dane z panelu (Project settings -> API)
const SUPABASE_URL = "https://hfdhqvesvxbrzgpgzawa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZGhxdmVzdnhicnpncGd6YXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDE4MzQsImV4cCI6MjA4MDc3NzgzNH0.K7Dt7gQbXO8zvA60HVlDHV4nNRF3Q6jKfJsqjzuW3uE";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============== LOCALSTORAGE ===============
const STORAGE_KEY = "puzzleProgress";

let appConfig = null;      // config.json
let currentPuzzle = null;  // zadanie na dany dzień
let gameDay = null;        // data dnia gry YYYY-MM-DD
let progress = null;       // { letters: string, solvedDays: string[] }

// -------------- ENTRY POINT --------------
window.addEventListener("DOMContentLoaded", async () => {
    progress = loadProgress();

    try {
        appConfig = await loadConfig();
    } catch (e) {
        console.error("Błąd wczytywania config.json:", e);
        alert("Nie udało się wczytać konfiguracji gry (config.json).");
        return;
    }

    gameDay = getGameDayDate();
    console.log("gameDay:", gameDay);
    console.log("config puzzles:", appConfig.puzzles);

    document.getElementById("dateLabel").innerText = gameDay;

    currentPuzzle = appConfig.puzzles.find(p => p.date === gameDay);

    if (!currentPuzzle) {
        // brak zadania na ten dzień
        document.getElementById("taskText0").innerText = "Brak zadania na ten dzień.";
        document.getElementById("taskText1").innerText = "";
        document.getElementById("taskText2").innerText = "";
        disableInputs();
    } else {
        // ustaw tekst zadań
        currentPuzzle.tasks.forEach((t, idx) => {
            const el = document.getElementById(`taskText${idx}`);
            if (el) el.innerText = t;
        });
    }

    updateLettersLabel();

    document.getElementById("checkButton")
        .addEventListener("click", onCheckClick);

    document.getElementById("closePopupButton")
        .addEventListener("click", () => {
            document.getElementById("successPopup").classList.add("hidden");
        });
});

// -------------- PLIK KONFIGURACYJNY --------------
async function loadConfig() {
    const res = await fetch("config.json");
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
}

// -------------- DZIEŃ GRY (15:00 – 14:59) --------------
function getGameDayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let d = new Date(year, month, day);
    if (now.getHours() < 15) {
        d.setDate(d.getDate() - 1);
    }

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// -------------- LOCALSTORAGE PROGRESS --------------
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

function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

// -------------- WYSWIETLANIE HASŁA / LITER --------------
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
        pattern += " ";
    }

    label.innerText = pattern.trim();
}

// -------------- BLOKADA INPUTÓW, GDY BRAK ZADANIA --------------
function disableInputs() {
    for (let i = 0; i < 3; i++) {
        const input = document.getElementById(`answer${i}`);
        if (input) input.disabled = true;
    }
    document.getElementById("checkButton").disabled = true;
}

// -------------- WYSYŁANIE DO SUPABASE --------------
async function sendToBackend(gameDay, answers, allCorrect) {
    try {
        const { error } = await supabaseClient
            .from("submissions")
            .insert([{
                game_day: gameDay,
                answers: answers,
                all_correct: allCorrect
            }]);

        if (error) {
            console.error("Błąd zapisu w Supabase:", error);
        } else {
            console.log("Zapisano submission w Supabase.");
        }
    } catch (e) {
        console.error("Wyjątek przy zapisie do Supabase:", e);
    }
}

// -------------- LOGIKA SPRAWDZANIA --------------
async function onCheckClick() {
    if (!currentPuzzle) return;

    const userAnswers = [
        document.getElementById("answer0").value.trim(),
        document.getElementById("answer1").value.trim(),
        document.getElementById("answer2").value.trim()
    ].map(a => a.toUpperCase());

    const correctAnswers = currentPuzzle.answers.map(a => a.toUpperCase());
    const allCorrect = userAnswers.every((ans, i) => ans === correctAnswers[i]);

    // Wyślij do Supabase (nawet jeśli błędne – będziesz miał statystyki)
    sendToBackend(gameDay, userAnswers, allCorrect);

    if (!allCorrect) {
        alert("Nie wszystkie odpowiedzi są poprawne. Spróbuj ponownie.");
        return;
    }

    // przyznawanie litery tylko raz na dzień
    if (!progress.solvedDays.includes(gameDay)) {
        progress.solvedDays.push(gameDay);
        progress.letters += currentPuzzle.rewardLetter;
        saveProgress();
    }

    updateLettersLabel();

    document.getElementById("rewardLetterLabel").innerText = currentPuzzle.rewardLetter;
    document.getElementById("successPopup").classList.remove("hidden");
}
