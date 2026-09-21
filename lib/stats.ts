// utils/statsCalculator.ts

export function calculateStatRank(value: number, thresholds: number[]) {
  // thresholds ex: [0, 5, 15, 30, 50] para Criticism
  let currentRank = 1;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (value >= thresholds[i]) {
      currentRank = i + 1;
      break;
    }
  }

  if (currentRank >= 5) {
    return { rank: 5, progress: 100, current: value, max: thresholds[4] };
  }

  const currentLevelMin = thresholds[currentRank - 1];
  const nextLevelMin = thresholds[currentRank];
  const progressInLevel = value - currentLevelMin;
  const span = nextLevelMin - currentLevelMin;
  const progress = Math.min(100, Math.max(0, (progressInLevel / span) * 100));

  return {
    rank: currentRank,
    progress,
    current: value,
    nextThreshold: nextLevelMin,
  };
}