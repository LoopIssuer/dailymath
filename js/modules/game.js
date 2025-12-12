// =============== GAME LOGIC MODULE ===============

import { createSeededRandom } from './utils.js';

export function selectGenericPuzzle(seed, appConfig) {
  const rng = createSeededRandom(seed);
  
  const genericPuzzles = appConfig.puzzles.filter(p => 
    p.date.startsWith("generic")
  );
  
  if (genericPuzzles.length === 0) {
    return null;
  }
  
  const index = Math.floor(rng() * genericPuzzles.length);
  return genericPuzzles[index];
}

export function getNextUnlockedIndex(finalSolution, unlockedIndexes) {
  const unlocked = unlockedIndexes || [];
  
  for (let i = 0; i < finalSolution.length; i++) {
    if (finalSolution[i] === ' ') continue;
    
    if (!unlocked.includes(i)) {
      return i;
    }
  }
  
  return -1;
}

export function hasAlreadySolvedToday(playerRow, gameDay) {
  if (!playerRow || !playerRow.solved_days) {
    return false;
  }
  return playerRow.solved_days.includes(gameDay);
}

export function areAllLettersUnlocked(appConfig, playerRow) {
  if (!appConfig || !appConfig.finalSolution) return false;
  if (!playerRow || !playerRow.letter_indexes) return false;
  
  const final = appConfig.finalSolution;
  const unlocked = playerRow.letter_indexes;
  
  for (let i = 0; i < final.length; i++) {
    if (final[i] === ' ') continue;
    if (!unlocked.includes(i)) return false;
  }
  
  return true;
}