// =============== KONFIG SUPABASE ===============
// PODMIEŃ na swoje dane z panelu (Project settings -> API)
const SUPABASE_URL = "https://hfdhqvesvxbrzgpgzawa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmZGhxdmVzdnhicnpncGd6YXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDE4MzQsImV4cCI6MjA4MDc3NzgzNH0.K7Dt7gQbXO8zvA60HVlDHV4nNRF3Q6jKfJsqjzuW3uE";


const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================== GLOBALNE ZMIENNE =====================
let appConfig = null;      // dane z config.json
let currentPuzzle = null;  // zadanie na dany dzień
let gameDay = null;        // data dnia gry YYYY-MM-DD
let playerRow = null;      // rekord gracza z tabeli players (może być null)
let playerName = null;     // imię użytkownika

// ===================== ENTRY POINT =====================
window.addEventListener("DOMContentLoaded", async () => {
    try {
        appConfig = await loadConfig();
    } catch (e) {
        console.error("Błąd wczytywania config.json:", e);
        alert("Nie udało się wczytać konfiguracji gry.");
        return;
    }

    await ensurePlayerName();

    gameDay = getGameDayDate();
    document.getElementById("dateLabel").innerText = gameDay;

    // wczytaj progres gracza (jeśli istnieje w bazie)
    playerRow = await loadPlayerByName(playerName);

    renderPuzzleUI();
    updateLettersLabel();

    document.getElementById("checkButton")
        .addEventListener("click", onCheckClick);

    document.getElementById("closePopupButton")
        .addEventListener("click", () => {
            document.getElementById("successPopup").classList.add("hidden");
        });
});

// ===================== Wczytywanie config.json =====================
async function loadConfig() {
    const res = await fetch("config.json");
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
}

// ===================== Dzień gry (15:00 – 14:59) =====================
function getGameDayDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    let date = new Date(y, m, d);
    if (now.getHours() < 15) {
        date.setDate(date.getDate() - 1);
    }

    // YYYY-MM-DD
    return date.toISOString().slice(0, 10);
}

// ===================== Imię użytkownika (localStorage + overlay) =====================
function ensurePlayerName() {
    return new Promise(resolve => {
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

        // Brak imienia -> pokaż overlay
        overlay.classList.remove("hidden");

        btn.addEventListener("click", () => {
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
        }, { once: true });
    });
}

// ===================== Wczytanie progresu gracza z Supabase =====================
async function loadPlayerByName(name) {
    try {
        const { data, error } = await supabaseClient
            .from("players")
            .select("*")
            .eq("name", name)
            .limit(1);

        if (error) {
            console.error("Błąd SELECT players:", error);
            return null;
        }

        if (!data || data.length === 0) {
            return null;
        }

        return data[0];
    } catch (e) {
        console.error("Wyjątek przy loadPlayerByName:", e);
        return null;
    }
}

// ===================== Render zadań =====================
function renderPuzzleUI() {
    currentPuzzle = appConfig.puzzles.find(p => p.date === gameDay);

    if (!currentPuzzle) {
        document.getElementById("taskText0").innerText = "Brak zadania na ten dzień.";
        document.getElementById("taskText1").innerText = "";
        document.getElementById("taskText2").innerText = "";
        disableInputs();
        return;
    }

    currentPuzzle.tasks.forEach((t, idx) => {
        const el = document.getElementById(`taskText${idx}`);
        if (el) el.innerText = t;
    });
}

// ===================== Wyświetlanie liter / hasła =====================
function updateLettersLabel() {
    const label = document.getElementById("lettersLabel");
    const final = appConfig.finalSolution;

    const lettersCount = playerRow ? (playerRow.letters || "").length : 0;
    let pattern = "";

    for (let i = 0; i < final.length; i++) {
        if (i < lettersCount) {
            pattern += final[i];
        } else {
            pattern += "_";
        }
        pattern += " ";
    }

    label.innerText = pattern.trim();
}

// ===================== Blokada inputów przy braku zadania =====================
function disableInputs() {
    for (let i = 0; i < 3; i++) {
        const input = document.getElementById(`answer${i}`);
        if (input) input.disabled = true;
    }
    const btn = document.getElementById("checkButton");
    if (btn) btn.disabled = true;
}

// ===================== Aktualizacja progresu w bazie (tylko przy poprawnej) =====================
async function updatePlayerAfterSolve() {
    // jeśli nie ma jeszcze rekordu w players -> tworzymy pierwszy
    if (!playerRow) {
        const { data, error } = await supabaseClient
            .from("players")
            .insert([{
                name: playerName,
                letters: currentPuzzle.rewardLetter,
                solved_days: [gameDay]
            }])
            .select()
            .single();

        if (error) {
            console.error("Błąd INSERT players:", error);
            return;
        }

        playerRow = data;
        return;
    }

    // jeśli rekord istnieje
    const alreadySolved = (playerRow.solved_days || []).includes(gameDay);
    if (alreadySolved) {
        // tego dnia już był progres, nie dodajemy kolejnej litery
        return;
    }

    const newLetters = (playerRow.letters || "") + currentPuzzle.rewardLetter;
    const newSolved = [...(playerRow.solved_days || []), gameDay];

    const { data, error } = await supabaseClient
        .from("players")
        .update({
            letters: newLetters,
            solved_days: newSolved
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
        document.getElementById("answer2").value.trim().toUpperCase()
    ];

    const correctAnswers = currentPuzzle.answers.map(a => a.toUpperCase());
    const allCorrect = userAnswers.every((ans, i) => ans === correctAnswers[i]);

    if (!allCorrect) {
        alert("Nie wszystkie odpowiedzi są poprawne. Spróbuj ponownie.");
        // NIE zapisujemy nic w bazie
        return;
    }

    // Zapis tylko dla poprawnych odpowiedzi:
    await updatePlayerAfterSolve();
    updateLettersLabel();

    // Pokazujemy popup z literą (zawsze tę samą dla danego dnia)
    document.getElementById("rewardLetterLabel").innerText = currentPuzzle.rewardLetter;
    document.getElementById("successPopup").classList.remove("hidden");
}

