/** 도장 5개마다(5, 10, 15, …번째) 보호자가 정한 선물을 받는다. */
export const REWARD_EVERY = 5;

export function isRewardStamp(stampNumber: number) {
  return stampNumber > 0 && stampNumber % REWARD_EVERY === 0;
}
