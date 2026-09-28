"use client";

import { useEffect, useState } from "react";
import { errorMessage, isApiError } from "@/lib/api/client";

export type Load<T> = { status: "loading" } | { status: "error"; message: string; needsLogin: boolean } | { status: "loaded"; data: T };

/** 요청 하나를 불러 로딩·오류·완료 상태로 돌려준다. key가 바뀌면 다시 부르고, reload로도 다시 부른다. */
export function useLoad<T>(load: () => Promise<T>, key: string): [Load<T>, () => void] {
  const [state, setState] = useState<Load<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setState({ status: "loading" });
  }
  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ status: "loaded", data }))
      .catch(
        (error: unknown) =>
          !cancelled &&
          setState({ status: "error", message: errorMessage(error), needsLogin: isApiError(error, 401) || isApiError(error, 403) }),
      );
    return () => {
      cancelled = true;
    };
    // load는 key가 같으면 같은 요청이다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  const reload = () => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  };
  return [state, reload];
}
