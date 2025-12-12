// =============== AUDIO MODULE ===============

let voicesLoaded = false;
let interferenceAudio = null;

export function initInterferenceAudio() {
  interferenceAudio = new Audio("audio/interference.mp3");
  interferenceAudio.loop = true;
  interferenceAudio.volume = 0.3;
  return interferenceAudio;
}

export function initVoices() {
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

export function playInterferenceAudio() {
  if (interferenceAudio) {
    interferenceAudio.currentTime = 0;
    interferenceAudio.play().catch((err) => {
      console.warn("Nie udało się odtworzyć interference.mp3:", err);
    });
  }
}

export function stopInterferenceAudio() {
  if (interferenceAudio) {
    interferenceAudio.pause();
    interferenceAudio.currentTime = 0;
  }
}

export function stopAllAudio() {
  stopInterferenceAudio();
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function speakText(text) {
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

export async function playIntroMessage() {
  const textEl = document.getElementById("introText");

  if (!textEl || !textEl.innerText) {
    console.warn("Brak tekstu do odczytania");
    return;
  }

  playInterferenceAudio();
  await speakText(textEl.innerText);
}

export async function playResultMessage() {
  const textEl = document.getElementById("resultText");

  if (!textEl || !textEl.innerText) {
    console.warn("Brak tekstu do odczytania");
    return;
  }

  playInterferenceAudio();
  await speakText(textEl.innerText);
}