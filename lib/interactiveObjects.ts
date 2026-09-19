export type InteractiveObjectConfig = {
  id: string;
  label: string;
  actionLabel: string;
  route: string;
  position: [number, number, number];
  interactionDistance: number;
  /** 충돌 판정용 AABB 전체 크기 [width(x), height(y), depth(z)] */
  colliderSize: [number, number, number];
};

export const INTERACTIVE_OBJECTS: InteractiveObjectConfig[] = [
  {
    id: "desk",
    label: "학습하러 갈까요?",
    actionLabel: "학습하기",
    route: "/study",
    position: [3.5, 0, 2.5],
    interactionDistance: 1.8,
    colliderSize: [1.6, 1, 0.9],
  },
  {
    id: "bookshelf",
    label: "책을 보러 갈까요?",
    actionLabel: "서재 가기",
    route: "/library",
    position: [-3.5, 0, -3.5],
    interactionDistance: 1.9,
    colliderSize: [2.2, 2, 0.6],
  },
];
