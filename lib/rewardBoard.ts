// 보상판(GET /parents/me/students/{id}/rewards) 응답을 보호자 화면에서 쓰는 모양으로 푼다.
// 도장은 쓰지 않고 계속 쌓이므로, 달성한 목표치마다 "아이에게 전했는지"를 따로 본다.

import type { RewardBoardResponse } from "@/lib/api/types";

/**
 * 한 목표치의 상태
 * - collecting: 아직 도장을 다 모으지 않았다
 * - pending:    도장을 다 모았지만 아직 아이에게 전하지 않았다 (리워드를 안 정했을 수도 있다)
 * - given:      보호자가 "선물했어요"를 눌렀다
 */
export type RewardStatus = "collecting" | "pending" | "given";

export type RewardRow = {
  milestone: number;
  name?: string;
  status: RewardStatus;
  givenAt: string | null;
};

/**
 * 보여 줄 목표치 줄: 달성한 목표치 전부 + 정해 둔 리워드 + 다음 목표부터 upcoming칸 (목표치 오름차순).
 * 리워드를 정하지 않은 채 달성한 목표치도 넣어, 보호자가 뒤늦게라도 정하고 전할 수 있게 한다.
 */
export function rewardRows(board: RewardBoardResponse, upcoming: number): RewardRow[] {
  const step = board.stampsPerReward;
  const byMilestone = new Map(board.rewards.map((reward) => [reward.milestone, reward]));
  const milestones = new Set(board.rewards.map((reward) => reward.milestone));
  for (let milestone = step; milestone <= board.stampTotal; milestone += step) milestones.add(milestone);
  for (let i = 0; i < upcoming; i++) milestones.add(board.nextMilestone + i * step);

  return [...milestones]
    .sort((a, b) => a - b)
    .map((milestone) => {
      const reward = byMilestone.get(milestone);
      const givenAt = reward?.givenAt ?? null;
      const status: RewardStatus = board.stampTotal < milestone ? "collecting" : givenAt ? "given" : "pending";
      return { milestone, name: reward?.name, status, givenAt };
    });
}

/** 도장을 다 모았는데 아직 아이에게 전하지 않은 목표치 (오래된 것부터) */
export function pendingRewards(board: RewardBoardResponse): RewardRow[] {
  return rewardRows(board, 0).filter((row) => row.status === "pending");
}
