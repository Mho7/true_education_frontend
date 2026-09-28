import type { SignupParentRequest, SignupStudentRequest } from "@/lib/api/types";
import type { MemberRole } from "@/lib/session";

/** 문자열은 문단, 문자열 배열은 글머리표 목록 */
export type ConsentBlock = string | string[];

export type ConsentDetail = {
  title: string;
  sections: { heading?: string; blocks: ConsentBlock[] }[];
  confirmLabel: string;
};

export type ConsentItem = {
  id: string;
  label: string;
  description: string;
  /** 필수 항목을 모두 체크해야 다음 단계로 넘어간다 */
  required: boolean;
  /** 없으면 "자세히 보기"를 두지 않는다 */
  detail?: ConsentDetail;
};

export type ConsentScreen = {
  title: string;
  subtitle: string;
  /** 보호자 화면에만 있는 '전체 동의' 문구 */
  allLabel?: string;
  submitLabel: string;
  errorText: string;
  items: ConsentItem[];
};

/** 가입 요청 body에 들어가는 동의 필드 */
export type SignupAgreements = {
  student: Pick<SignupStudentRequest, "guardianShareAgreed">;
  guardian: Pick<SignupParentRequest, "termsAgreed" | "marketingAgreed" | "guardianConsentAgreed">;
};

// TODO: 실제 서비스 출시 전 정식 이용약관·개인정보 처리방침 문구로 교체한다.
const GUARDIAN_ITEMS: ConsentItem[] = [
  {
    id: "terms",
    label: "[필수] 서비스 이용약관 동의",
    description: "서비스 이용에 필요한 기본적인 이용 규칙에 동의합니다.",
    required: true,
    detail: {
      title: "서비스 이용약관",
      confirmLabel: "확인",
      sections: [
        {
          blocks: [
            "본 서비스는 아동의 독서 활동을 지원하고 보호자가 학습 과정을 확인할 수 있도록 제공되는 독서 학습 서비스입니다.",
            "서비스 이용을 위해 보호자 계정을 생성하고 아동 계정을 연결할 수 있습니다.",
            "서비스 이용자는 다른 사람의 계정을 무단으로 사용하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.",
            "서비스의 구체적인 기능과 이용 방식은 운영 과정에서 변경될 수 있으며 중요한 변경 사항은 서비스 내에서 안내합니다.",
            "※ 실제 서비스 출시 전 정식 이용약관으로 교체합니다.",
          ],
        },
      ],
    },
  },
  {
    id: "guardianPrivacy",
    label: "[필수] 보호자 개인정보 수집 및 이용 동의",
    description: "보호자 계정 생성과 아동 계정 연결을 위해 필요한 개인정보를 수집·이용합니다.",
    required: true,
    detail: {
      title: "보호자 개인정보 수집 및 이용 안내",
      confirmLabel: "확인",
      sections: [
        {
          heading: "수집하는 정보",
          blocks: [
            [
              "보호자 이름 또는 닉네임",
              "로그인에 필요한 계정 정보",
              "아동 계정과의 연결 정보",
              "법정대리인 동의 확인을 위해 필요한 정보",
              "서비스 이용 과정에서 생성되는 기본 이용 기록",
            ],
          ],
        },
        {
          heading: "이용 목적",
          blocks: [
            ["보호자 계정 생성 및 로그인", "아동 계정 연결", "법정대리인 동의 여부 확인", "보호자 대시보드 제공", "서비스 운영 및 문의 대응"],
          ],
        },
        {
          heading: "보유 기간",
          blocks: [
            "회원 탈퇴 또는 서비스 이용 종료 시까지 보관하는 것을 기본으로 합니다.",
            "단, 관계 법령에 따라 일정 기간 보관해야 하는 정보가 있는 경우 해당 기간 동안 보관할 수 있습니다.",
          ],
        },
        {
          heading: "동의하지 않을 수 있나요?",
          blocks: [
            "개인정보 수집 및 이용에 동의하지 않을 수 있습니다.",
            "다만 서비스 제공에 반드시 필요한 정보의 수집에 동의하지 않을 경우 회원가입 또는 일부 서비스 이용이 제한될 수 있습니다.",
          ],
        },
      ],
    },
  },
  {
    id: "childPrivacy",
    label: "[필수] 만 14세 미만 아동 개인정보 처리에 대한 법정대리인 동의",
    description: "아동의 독서 활동 및 학습 기록 제공을 위해 필요한 개인정보를 처리하는 것에 동의합니다.",
    required: true,
    detail: {
      title: "아동 개인정보 처리 안내",
      confirmLabel: "확인",
      sections: [
        {
          blocks: [
            "본 서비스는 만 14세 미만 아동이 이용할 수 있는 서비스로, 필요한 개인정보를 처리하기 전에 법정대리인의 동의를 받습니다.",
          ],
        },
        {
          heading: "아동에게서 처리될 수 있는 정보",
          blocks: [
            [
              "이름 또는 닉네임",
              "연령 또는 학년 등 학습 제공에 필요한 정보",
              "읽은 책과 독서 활동 기록",
              "질문에 대한 답변",
              "그림 및 활동 결과",
              "음성을 텍스트로 변환한 내용",
              "학습 진행 상황",
              "서비스 이용 과정에서 생성되는 기록",
            ],
          ],
        },
        {
          heading: "이용 목적",
          blocks: [
            [
              "아동에게 독서 활동 제공",
              "학습 진행 상황 저장",
              "아동에게 적절한 학습 활동 제공",
              "보호자 대시보드 제공",
              "학습 과정 및 변화 확인",
            ],
          ],
        },
        {
          heading: "보호자가 확인할 수 있는 정보",
          blocks: [
            "연결된 보호자 계정에서는 다음과 같은 정보를 확인할 수 있습니다.",
            [
              "읽은 책",
              "활동 진행 여부",
              "질문에 대한 답변",
              "음성에서 변환된 텍스트",
              "학습 과정에서 도움이 필요했던 부분",
              "독서 활동 결과",
            ],
          ],
        },
        {
          heading: "보유 기간",
          blocks: [
            "아동 계정 삭제 또는 서비스 이용 종료 시까지 보관하는 것을 기본으로 합니다.",
            "서비스 출시 전 실제 데이터 보관 정책에 맞추어 정확한 보유 기간을 안내합니다.",
          ],
        },
        {
          heading: "법정대리인 동의",
          blocks: ["위 내용을 확인하였으며, 법정대리인으로서 아동의 개인정보가 위 목적에 따라 처리되는 것에 동의합니다."],
        },
      ],
    },
  },
  {
    id: "childSpeech",
    label: "[필수] 아동 음성 인식 기능 이용 안내 및 동의",
    description: "아이가 말한 내용을 텍스트로 변환하기 위해 Google Cloud Speech-to-Text를 사용합니다.",
    required: true,
    detail: {
      title: "음성 인식(STT) 기능 안내",
      confirmLabel: "확인",
      sections: [
        { blocks: ["아이가 자신의 생각을 말로 표현할 수 있도록 음성 인식 기능을 제공합니다."] },
        {
          heading: "어떻게 작동하나요?",
          blocks: [
            "아이가 마이크를 통해 말합니다.",
            "→ 음성 데이터가 Google Cloud Speech-to-Text로 전달됩니다.",
            "→ Google Cloud가 음성을 텍스트로 변환합니다.",
            "→ 서비스는 변환된 텍스트를 받아 독서 활동 기록에 활용합니다.",
          ],
        },
        { heading: "어떤 정보가 처리되나요?", blocks: ["아이가 음성 활동 중 말한 음성이 처리됩니다."] },
        { heading: "왜 처리하나요?", blocks: ["아이의 말을 텍스트로 변환해 자신의 생각과 독서 활동을 기록하기 위해 사용합니다."] },
        {
          heading: "원본 음성을 저장하나요?",
          blocks: [
            "본 서비스는 원본 음성을 별도의 학습 기록으로 저장하지 않고, 음성 인식 후 생성된 텍스트를 필요한 범위에서 저장하도록 설계합니다.",
          ],
        },
        {
          heading: "Google의 AI 학습에 사용되나요?",
          blocks: ["본 서비스에서는 Google Cloud Speech-to-Text의 고객 데이터 로깅 기능을 활성화하지 않도록 설정합니다."],
        },
        {
          heading: "외부 서버에서 처리되나요?",
          blocks: [
            "음성을 텍스트로 변환하는 과정에서 Google Cloud 인프라를 통해 데이터가 처리됩니다.",
            "Google Cloud의 실제 처리 지역 및 개인정보 국외 이전에 관한 사항은 서비스에 적용되는 Cloud 설정을 확정한 후 개인정보 처리방침에서 구체적으로 안내합니다.",
          ],
        },
        {
          heading: "동의하지 않을 수 있나요?",
          blocks: ["음성 인식 기능을 사용하지 않는 경우 말하기가 필요한 일부 독서 활동 이용이 제한될 수 있습니다."],
        },
      ],
    },
  },
  {
    id: "guardianDashboard",
    label: "[필수] 아동 학습 기록의 보호자 확인 안내",
    description: "아동의 독서 활동과 답변 등 일부 학습 기록을 보호자 대시보드에서 확인할 수 있습니다.",
    required: true,
    detail: {
      title: "보호자 대시보드 제공 안내",
      confirmLabel: "확인",
      sections: [
        {
          blocks: [
            "보호자가 아동의 독서 활동을 이해하고 적절한 도움을 줄 수 있도록 학습 기록의 일부를 보호자 대시보드에서 제공합니다.",
          ],
        },
        {
          heading: "보호자가 확인할 수 있는 정보",
          blocks: [
            [
              "오늘 읽은 책",
              "독서 활동 진행 여부",
              "질문에 대한 아동의 답변",
              "음성에서 변환된 텍스트",
              "잘 이해한 부분",
              "도움이 필요했던 부분",
              "활동 결과 및 독서 기록",
            ],
          ],
        },
        {
          heading: "왜 보호자에게 보여주나요?",
          blocks: [
            "아이의 점수를 평가하기 위한 목적보다는 아이가 무엇을 스스로 할 수 있었고 어떤 부분에서 도움이 필요했는지 보호자가 이해할 수 있도록 하기 위함입니다.",
          ],
        },
        {
          heading: "누가 확인할 수 있나요?",
          blocks: ["해당 아동과 정상적으로 연결된 보호자 계정에서 확인할 수 있도록 설계합니다."],
        },
        {
          heading: "원본 음성도 보호자에게 제공되나요?",
          blocks: [
            "아니요. 현재 서비스는 원본 음성을 보호자에게 제공하지 않고, 필요한 경우 음성에서 변환된 텍스트만 학습 기록으로 제공합니다.",
          ],
        },
      ],
    },
  },
  {
    id: "marketing",
    label: "[선택] 마케팅 정보 수신 동의",
    description: "새로운 책과 이벤트 소식을 받아 볼 수 있어요. 동의하지 않아도 가입할 수 있어요.",
    required: false,
  },
];

const STUDENT_ITEMS: ConsentItem[] = [
  {
    id: "activityRecord",
    label: "내 활동이 기록될 수 있다는 것을 확인했어요",
    description: "내가 어떤 책을 읽었는지와 독서 활동에서 한 답변이 기록될 수 있어요.",
    required: true,
    detail: {
      title: "왜 기록하나요?",
      confirmLabel: "알겠어요",
      sections: [
        {
          blocks: [
            "네가 어떤 책을 읽었는지, 어떤 생각을 했는지 기억하기 위해서예요.",
            "예를 들어 이런 것들이 기록될 수 있어요.",
            ["어떤 책을 읽었는지", "질문에 어떻게 대답했는지", "어떤 활동을 했는지", "어디까지 학습했는지"],
            "이 기록은 다음에 책을 읽을 때 너에게 더 알맞은 활동을 보여주고, 보호자가 네 독서 활동을 이해하는 데 사용될 수 있어요.",
          ],
        },
      ],
    },
  },
  {
    id: "speechToText",
    label: "내가 말한 내용이 글자로 바뀔 수 있다는 것을 확인했어요",
    description: "말하기 활동에서는 내가 한 말을 글자로 바꾸기 위해 마이크를 사용할 수 있어요.",
    required: true,
    detail: {
      title: "마이크는 왜 사용하나요?",
      confirmLabel: "알겠어요",
      sections: [
        {
          blocks: [
            "책을 읽다가 네 생각을 말하는 활동이 있어요.",
            "그때 마이크를 사용하면 네가 말한 내용을 컴퓨터가 글자로 바꿔줘요.",
            "예를 들어 “주인공이 친구를 도와줘서 기뻤을 것 같아요.”라고 말하면 그 말이 글자로 기록될 수 있어요.",
            "마이크는 말하기 활동을 할 때 사용해요.",
          ],
        },
      ],
    },
  },
  {
    id: "guardianView",
    label: "보호자가 내 독서 활동을 볼 수 있다는 것을 확인했어요",
    description: "보호자는 내가 어떤 책을 읽고 어떻게 활동했는지 확인할 수 있어요.",
    required: true,
    detail: {
      title: "보호자는 무엇을 볼 수 있나요?",
      confirmLabel: "알겠어요",
      sections: [
        {
          blocks: [
            "보호자는 네가 책을 어떻게 읽고 있는지 확인할 수 있어요.",
            "예를 들어",
            [
              "어떤 책을 읽었는지",
              "활동을 끝냈는지",
              "질문에 어떤 생각을 말했는지",
              "어떤 부분을 잘 이해했는지",
              "어떤 부분에서 조금 도움이 필요했는지",
            ],
            "확인할 수 있어요.",
            "이 내용은 너를 혼내거나 점수를 매기기 위한 것이 아니라, 보호자가 네 독서 활동을 이해하고 필요할 때 도와줄 수 있도록 보여주는 거예요.",
          ],
        },
      ],
    },
  },
];

export const CONSENT_SCREENS: Record<MemberRole, ConsentScreen> = {
  guardian: {
    title: "서비스 이용을 위한 동의",
    subtitle: "아이가 안전하게 독서 활동을 이용할 수 있도록 아래 내용을 확인해 주세요.",
    allLabel: "전체 동의",
    submitLabel: "동의하고 가입하기",
    errorText: "필수 항목에 모두 동의해 주세요",
    items: GUARDIAN_ITEMS,
  },
  student: {
    title: "시작하기 전에 알아두어요!",
    subtitle: "여울이와 책을 읽기 전에 몇 가지만 같이 확인해 볼까요?",
    submitLabel: "확인했어요! 시작하기",
    errorText: "세 가지를 모두 확인해 주세요",
    items: STUDENT_ITEMS,
  },
};

export function hasRequiredConsents(role: MemberRole, agreedIds: string[]) {
  return CONSENT_SCREENS[role].items.every((item) => !item.required || agreedIds.includes(item.id));
}

/**
 * 동의 화면에서 체크한 항목을 가입 요청 필드로 옮긴다.
 * - 학생 guardianShareAgreed: "보호자가 내 독서 활동을 볼 수 있다는 것을 확인했어요"
 * - 보호자 termsAgreed: 서비스 이용약관 + 보호자 개인정보 수집·이용
 * - 보호자 guardianConsentAgreed: 만 14세 미만 아동 개인정보 처리에 대한 법정대리인 동의
 * - 보호자 marketingAgreed: 마케팅 정보 수신(선택)
 */
export function studentAgreements(agreedIds: string[]): SignupAgreements["student"] {
  return { guardianShareAgreed: agreedIds.includes("guardianView") };
}

export function guardianAgreements(agreedIds: string[]): SignupAgreements["guardian"] {
  const agreed = (id: string) => agreedIds.includes(id);
  return {
    termsAgreed: agreed("terms") && agreed("guardianPrivacy"),
    guardianConsentAgreed: agreed("childPrivacy"),
    marketingAgreed: agreed("marketing"),
  };
}
