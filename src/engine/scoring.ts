import { NetworkMetrics } from './types';

export interface ScoreStarRating {
  stars: number; // 0, 1, 2, or 3
  score: number;
  parScore: number;
  baselineScore: number;
  beatsBaseline: boolean;
  withinTenPercentOfPar: boolean;
  matchesOrBeatsPar: boolean;
  verdict: string;
}

export function evaluateShiftStars(
  currentScore: number,
  baselineScore: number,
  parScore: number
): ScoreStarRating {
  const beatsBaseline = currentScore > baselineScore;
  const parThreshold = Math.floor(parScore * 0.9);
  const withinTenPercentOfPar = currentScore >= parThreshold && beatsBaseline;
  const matchesOrBeatsPar = currentScore >= parScore && beatsBaseline;

  let stars = 0;
  let verdict = 'No Plan Implemented';

  if (matchesOrBeatsPar) {
    stars = 3;
    verdict = 'Outstanding Recovery — Matched Par Standard! ★★★';
  } else if (withinTenPercentOfPar) {
    stars = 2;
    verdict = 'Strong Performance — Within 10% of Par! ★★';
  } else if (beatsBaseline) {
    stars = 1;
    verdict = 'Crisis Contained — Beat Doing Nothing! ★';
  } else {
    stars = 0;
    verdict = 'Unresolved Crisis — Sub-baseline Performance';
  }

  return {
    stars,
    score: currentScore,
    parScore,
    baselineScore,
    beatsBaseline,
    withinTenPercentOfPar,
    matchesOrBeatsPar,
    verdict,
  };
}
