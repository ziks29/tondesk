export const CREDITS_PER_TON = 1;
export const INTERACTION_CREDIT_COST = 0.1;

export function tonToCredits(amountTon: number) {
  return Number((amountTon * CREDITS_PER_TON).toFixed(4));
}
