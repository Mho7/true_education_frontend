// Figma 시안(AI독서서비스/*.svg)의 아이콘 path를 좌표 그대로 옮기고 viewBox로 잘라 쓴다.

type IconProps = { className?: string };

const round = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="550 232 14 14" fill="none" aria-hidden className={className}>
      <path d="M562.5 233.167L556.667 239L562.5 244.833" stroke="currentColor" strokeWidth="1.83333" {...round} />
    </svg>
  );
}

export function GraduationCapIcon({ className }: IconProps) {
  return (
    <svg viewBox="587 444 22 22" fill="none" aria-hidden className={className}>
      <path
        d="M608.834 451.75L598 457.167L587.167 451.75L598 446.333L608.834 451.75ZM608.834 451.75V457.167M591.5 453.917V458.792C591.5 460.417 594.425 462.042 598 462.042C601.575 462.042 604.5 460.417 604.5 458.792V453.917"
        stroke="currentColor"
        strokeWidth="1.84167"
        {...round}
      />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="586 554 22 22" fill="none" aria-hidden className={className}>
      <path
        d="M593.75 564.458C595.844 564.458 597.541 562.761 597.541 560.667C597.541 558.573 595.844 556.875 593.75 556.875C591.656 556.875 589.958 558.573 589.958 560.667C589.958 562.761 591.656 564.458 593.75 564.458Z"
        stroke="currentColor"
        strokeWidth="1.84167"
      />
      <path
        d="M586.708 573.667C586.708 569.767 589.85 567.167 593.75 567.167C597.65 567.167 600.791 569.767 600.791 573.667M601.333 557.2C602.105 557.395 602.79 557.841 603.279 558.469C603.769 559.097 604.035 559.871 604.035 560.667C604.035 561.463 603.769 562.236 603.279 562.864C602.79 563.492 602.105 563.939 601.333 564.134M603.5 567.6C605.775 568.359 607.291 570.634 607.291 573.667"
        stroke="currentColor"
        strokeWidth="1.84167"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="1037 441 22 22" fill="none" aria-hidden className={className}>
      <path
        d="M1048 451.5C1050.58 451.5 1052.67 449.411 1052.67 446.833C1052.67 444.256 1050.58 442.167 1048 442.167C1045.42 442.167 1043.33 444.256 1043.33 446.833C1043.33 449.411 1045.42 451.5 1048 451.5Z"
        stroke="currentColor"
        strokeWidth="1.86667"
      />
      <path
        d="M1038.67 462C1038.67 457.333 1042.87 454.417 1048 454.417C1053.13 454.417 1057.33 457.333 1057.33 462"
        stroke="currentColor"
        strokeWidth="1.86667"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="1038 523.3 22 22" fill="none" aria-hidden className={className}>
      <path
        d="M1054.25 531.667H1043.75C1042.14 531.667 1040.83 532.972 1040.83 534.583V541.583C1040.83 543.194 1042.14 544.5 1043.75 544.5H1054.25C1055.86 544.5 1057.17 543.194 1057.17 541.583V534.583C1057.17 532.972 1055.86 531.667 1054.25 531.667Z"
        stroke="currentColor"
        strokeWidth="1.86667"
      />
      <path
        d="M1044.33 531.667V528.75C1044.33 527.512 1044.82 526.326 1045.7 525.45C1046.58 524.575 1047.76 524.083 1049 524.083C1050.24 524.083 1051.42 524.575 1052.3 525.45C1053.17 526.326 1053.67 527.512 1053.67 528.75V531.667M1049 536.917V539.833"
        stroke="currentColor"
        strokeWidth="1.86667"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="550 738 20 20" fill="none" aria-hidden className={className}>
      <path d="M555.917 748.292L558.542 750.917L564.083 745.375" stroke="currentColor" strokeWidth="1.75" {...round} />
    </svg>
  );
}
