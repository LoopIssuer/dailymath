// =============== UTILITY FUNCTIONS MODULE ===============

export function createSeededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return function() {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

export async function loadConfig() {
  const res = await fetch("config.json");
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

export function getGameDayDate() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export function getImagePath(date, filename) {
  return `img/${date}/${filename}`;
}

export function getRandomErrorImage(appConfig) {
  if (!appConfig || !Array.isArray(appConfig.errorImages) || appConfig.errorImages.length === 0) {
    return "img/errors/default.png";
  }
  
  const randomIndex = Math.floor(Math.random() * appConfig.errorImages.length);
  return appConfig.errorImages[randomIndex];
}

export function tryLoadTaskImage(date, taskIndex) {
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

export function findDivisors(n) {
  const divisors = [];
  for (let i = 1; i <= Math.sqrt(n); i++) {
    if (n % i === 0) {
      divisors.push(i);
      if (i !== n / i) {
        divisors.push(n / i);
      }
    }
  }
  return divisors.sort((a, b) => a - b);
}