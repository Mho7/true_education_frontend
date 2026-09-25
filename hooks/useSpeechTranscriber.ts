"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// 아이가 길게 이야기하는 것을 글로 받아 적는 브라우저 음성 인식 (Chrome·Edge의 SpeechRecognition, Safari의 webkitSpeechRecognition).
// 문장 하나를 읽는 speech.ts의 listen()과 달리, 사용자가 멈출 때까지 계속 듣고 브라우저가 중간에 끊으면 다시 이어 듣는다.

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { readonly isFinal: boolean; readonly length: number; readonly [index: number]: RecognitionAlternative };
type RecognitionResultEvent = { readonly results: { readonly length: number; readonly [index: number]: RecognitionResult } };
type RecognitionErrorEvent = { readonly error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

export type SpeechTranscriberError = "unsupported" | "insecure" | "not-allowed" | "no-microphone" | "network" | "failed";

/** 권한 창을 오래 띄워 둬도 이 시간 안에 시작 신호가 없으면 실패로 본다 */
const START_TIMEOUT_MS = 20000;
/** 멈춘 뒤 끝 신호가 오지 않는 브라우저 대비 */
const STOP_TIMEOUT_MS = 2000;
/** 이 시간 안에 이만큼 넘게 저절로 끊기면 다시 시작하지 않고 실패로 본다 (무한 재시작 방지) */
const RESTART_WINDOW_MS = 10000;
const MAX_RESTARTS_IN_WINDOW = 5;

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const speechWindow = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

function toError(code: string): SpeechTranscriberError {
  if (code === "not-allowed" || code === "service-not-allowed") return "not-allowed";
  if (code === "audio-capture") return "no-microphone";
  if (code === "network") return "network";
  return "failed";
}

function joinText(...parts: string[]) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
}

type EngineHandlers = {
  onText: (transcript: string, interim: string) => void;
  onListening: (listening: boolean) => void;
  onError: (error: SpeechTranscriberError | null) => void;
};

/** React 밖에서 인식 객체·재시작·대기 중인 약속을 관리한다. 훅은 이것 하나를 만들어 쓴다. */
class TranscriberEngine {
  private handlers: EngineHandlers;
  private recognition: Recognition | null = null;
  /** 사용자가 멈추기 전까지 계속 듣고 싶은지 */
  private wantListening = false;
  /** 앞선 인식 세션들에서 확정된 글 */
  private committed = "";
  /** 지금 세션에서 확정된 글 / 아직 확정되지 않은 글 */
  private sessionFinal = "";
  private interim = "";
  private restartTimes: number[] = [];
  private startWaiter: ((ok: boolean) => void) | null = null;
  private stopWaiter: ((text: string) => void) | null = null;
  private startTimer = 0;
  private stopTimer = 0;

  constructor(handlers: EngineHandlers) {
    this.handlers = handlers;
  }

  start(lang: string): Promise<boolean> {
    this.abort();
    this.committed = "";
    this.sessionFinal = "";
    this.interim = "";
    this.restartTimes = [];
    this.handlers.onText("", "");
    this.handlers.onError(null);

    const Recognition = getRecognitionConstructor();
    if (!Recognition) return this.rejectStart("unsupported");
    // 마이크는 https(또는 localhost)에서만 쓸 수 있다. 같은 와이파이의 태블릿에서 http로 열면 여기서 걸린다.
    if (!window.isSecureContext) return this.rejectStart("insecure");

    this.wantListening = true;
    return new Promise<boolean>((resolve) => {
      this.startWaiter = resolve;
      this.startTimer = window.setTimeout(() => this.fail("failed"), START_TIMEOUT_MS);
      this.openSession(Recognition, lang);
    });
  }

  /** 듣기를 멈추고, 마지막 결과까지 받은 뒤 확정된 전체 글을 돌려준다 */
  stop(): Promise<string> {
    this.wantListening = false;
    const recognition = this.recognition;
    if (!recognition) return Promise.resolve(this.committed);
    return new Promise<string>((resolve) => {
      this.stopWaiter = resolve;
      this.stopTimer = window.setTimeout(() => this.finish(), STOP_TIMEOUT_MS);
      try {
        recognition.stop();
      } catch {
        this.finish();
      }
    });
  }

  /** 결과 없이 바로 끝낸다 (다시 시작·화면 이탈·정리) */
  abort() {
    this.wantListening = false;
    this.clearTimers();
    const recognition = this.recognition;
    this.recognition = null;
    if (recognition) {
      this.detach(recognition);
      try {
        recognition.abort();
      } catch {
        // 이미 끝난 인식 객체
      }
    }
    this.handlers.onListening(false);
    this.resolveStart(false);
    this.resolveStop();
  }

  reset() {
    this.abort();
    this.committed = "";
    this.sessionFinal = "";
    this.interim = "";
    this.handlers.onText("", "");
    this.handlers.onError(null);
  }

  private openSession(Recognition: RecognitionConstructor, lang: string) {
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    this.sessionFinal = "";
    this.interim = "";

    recognition.onstart = () => {
      if (this.recognition !== recognition) return;
      window.clearTimeout(this.startTimer);
      this.handlers.onListening(true);
      this.resolveStart(true);
    };
    recognition.onresult = (event) => {
      if (this.recognition !== recognition) return;
      const finals: string[] = [];
      const interims: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        (result.isFinal ? finals : interims).push(text);
      }
      this.sessionFinal = joinText(...finals);
      this.interim = joinText(...interims);
      this.publish();
    };
    recognition.onerror = (event) => {
      if (this.recognition !== recognition) return;
      // 한동안 말이 없거나(no-speech) 우리가 끊은 경우(aborted)는 오류가 아니다. 계속 들어야 하면 onend에서 다시 시작한다.
      if (event.error === "no-speech" || event.error === "aborted") return;
      this.fail(toError(event.error));
    };
    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      // 이번 세션 글을 확정한다. 끊기는 순간 아직 확정되지 않은 글도 버리지 않는다.
      this.committed = joinText(this.committed, this.sessionFinal, this.interim);
      this.sessionFinal = "";
      this.interim = "";
      this.publish();

      if (!this.wantListening) {
        this.finish();
        return;
      }
      // 사용자가 멈추지 않았는데 브라우저가 스스로 끝냈다 → 이어서 다시 듣는다.
      const now = Date.now();
      this.restartTimes = [...this.restartTimes.filter((time) => now - time < RESTART_WINDOW_MS), now];
      if (this.restartTimes.length > MAX_RESTARTS_IN_WINDOW) {
        this.fail("failed");
        return;
      }
      this.detach(recognition);
      this.openSession(Recognition, lang);
    };

    this.recognition = recognition;
    try {
      recognition.start();
    } catch {
      this.fail("failed");
    }
  }

  /** 멈춤이 끝났다: 인식 객체를 정리하고 확정된 글을 돌려준다 */
  private finish() {
    this.committed = joinText(this.committed, this.sessionFinal, this.interim);
    this.sessionFinal = "";
    this.interim = "";
    this.publish();
    const text = this.committed;
    this.abort();
    this.stopWaiter?.(text);
    this.stopWaiter = null;
  }

  private fail(error: SpeechTranscriberError) {
    this.abort();
    this.handlers.onError(error);
  }

  private rejectStart(error: SpeechTranscriberError) {
    this.handlers.onError(error);
    return Promise.resolve(false);
  }

  private publish() {
    this.handlers.onText(joinText(this.committed, this.sessionFinal), this.interim);
  }

  private resolveStart(ok: boolean) {
    const waiter = this.startWaiter;
    this.startWaiter = null;
    waiter?.(ok);
  }

  private resolveStop() {
    const waiter = this.stopWaiter;
    this.stopWaiter = null;
    waiter?.(this.committed);
  }

  private clearTimers() {
    window.clearTimeout(this.startTimer);
    window.clearTimeout(this.stopTimer);
  }

  private detach(recognition: Recognition) {
    recognition.onstart = null;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
  }
}

const subscribeNothing = () => () => {};

export type SpeechTranscriber = {
  /** 이 브라우저에 음성 인식이 있는지 (서버 렌더에서는 false) */
  supported: boolean;
  /** 지금 듣고 있는지 */
  listening: boolean;
  /** 확정된 글 */
  transcript: string;
  /** 아직 확정되지 않은(말하는 중인) 글 */
  interimTranscript: string;
  error: SpeechTranscriberError | null;
  /** 듣기 시작. 권한을 얻고 실제로 듣기 시작하면 true, 실패하면 false (error에 이유) */
  start: () => Promise<boolean>;
  /** 듣기를 멈추고 확정된 전체 글을 돌려준다 */
  stop: () => Promise<string>;
  /** 결과와 오류를 모두 지우고 멈춘다 */
  reset: () => void;
};

export function useSpeechTranscriber(lang = "ko-KR"): SpeechTranscriber {
  const supported = useSyncExternalStore(subscribeNothing, () => getRecognitionConstructor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<SpeechTranscriberError | null>(null);
  const [engine] = useState(
    () =>
      new TranscriberEngine({
        onText: (text, interim) => {
          setTranscript(text);
          setInterimTranscript(interim);
        },
        onListening: setListening,
        onError: setError,
      }),
  );

  // 화면을 떠나면(나가기·사이드바 이동·새로고침) 듣기를 바로 끊는다.
  useEffect(() => () => engine.abort(), [engine]);

  const start = useCallback(() => engine.start(lang), [engine, lang]);
  const stop = useCallback(() => engine.stop(), [engine]);
  const reset = useCallback(() => engine.reset(), [engine]);

  return { supported, listening, transcript, interimTranscript, error, start, stop, reset };
}
