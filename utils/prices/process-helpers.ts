import { mean, standardDeviation } from 'simple-statistics';

export const PRICING = {
  MIN_INFLATION_DIFF: 90000,
} as const;

// for a given number, calculate z-score
export const zScore = (x: number, data: number[]) => {
  const meanVal = mean(data);
  const stdVal = standardDeviation(data);
  return Math.abs((x - meanVal) / stdVal);
};
