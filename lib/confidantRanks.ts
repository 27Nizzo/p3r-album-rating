// Pontos necessários para alcançar cada Rank (Rank 1 é o inicial)
export const RANK_REQUIREMENTS: Record<number, number> = {
  1: 0,
  2: 5,   // 5 pontos para Rank 2
  3: 12,  // +7 pontos (total 12)
  4: 22,  // +10 pontos
  5: 35,  // +13 pontos
  6: 50,  // +15 pontos
  7: 68,  // +18 pontos
  8: 88,  // +20 pontos
  9: 110, // +22 pontos
  10: 135 // MAX RANK
};

/**
  * Dado o Rank atual e os Pontos de Afinidade atuais, adiciona novos pontos
  * e devolve o novo Rank e a nova Afinidade, juntamente com a informação se subiu de nível.
  */
export function addAffinityPoints(currentRank: number, currentAffinity: number, pointsToAdd: number) {
  if (currentRank >= 10) {
    return { newRank: 10, newAffinity: currentAffinity, rankedUp: false };
  }

  let newAffinity = currentAffinity + pointsToAdd;
  let newRank = currentRank;
  let rankedUp = false;

  while (newRank < 10) {
    const nextRankRequired = RANK_REQUIREMENTS[newRank + 1];
    if (newAffinity >= nextRankRequired) {
      newRank += 1;
      rankedUp = true;
    } else {
      break;
    }
  }

  return { newRank, newAffinity, rankedUp };
}