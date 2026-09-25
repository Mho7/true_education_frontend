"use client";

// 브라우저 음성 기능. 여울이가 읽어 주는 소리(음성 합성)와 아이가 읽는 소리 듣기(음성 인식).
// TODO: 여울이 목소리 녹음 파일이나 서버 음성 합성·발음 평가가 준비되면 교체한다.

/** 문장 길이로 어림한 읽는 시간 (음성 합성이 없거나 끝 신호가 안 올 때 대비) */
function estimateMs(text: string) {
  return Math.max(2500, text.length * 260);
}

/** 여울이가 문장을 읽는다. 다 읽으면 onEnd. 돌려받은 함수를 부르면 멈춘다. */
export function speak(text: string, onEnd?: () => void): () => void {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallback);
    onEnd?.();
  };
  // 음성 합성이 끝 신호를 빠뜨리는 브라우저가 있어, 넉넉한 시간이 지나면 끝난 것으로 본다.
  const fallback = window.setTimeout(finish, estimateMs(text) + 2500);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  if (!synth) {
    window.clearTimeout(fallback);
    const timer = window.setTimeout(finish, estimateMs(text));
    return () => {
      finished = true;
      window.clearTimeout(timer);
    };
  }

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.9;
  utterance.pitch = 1.15;
  const voice = synth.getVoices().find((v) => v.lang.startsWith("ko"));
  if (voice) utterance.voice = voice;
  utterance.onend = finish;
  utterance.onerror = finish;
  synth.speak(utterance);

  return () => {
    finished = true;
    window.clearTimeout(fallback);
    synth.cancel();
  };
}

type RecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type RecognitionErrorEvent = { error: string };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

/** 아이가 읽는 동안 이만큼 지나면 다 읽은 것으로 본다 */
const LISTEN_TIMEOUT_MS = 15000;

/**
 * 아이가 문장을 읽는 소리를 듣는다. 한 번 말하고 멈추면 onEnd(들은 글).
 * 음성 인식이 없거나 마이크를 못 쓰면 시간이 지나거나 아이가 버튼을 눌러(done) 끝낸다.
 * cancel은 onEnd 없이 그만 듣는다 (페이지를 떠날 때).
 */
export function listen(onEnd: (transcript: string) => void): { done: () => void; cancel: () => void } {
  let finished = false;
  let transcript = "";
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(timeout);
    onEnd(transcript);
  };
  const timeout = window.setTimeout(finish, LISTEN_TIMEOUT_MS);

  const speechWindow = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  const RecognitionImpl = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  let recognition: Recognition | null = null;
  if (RecognitionImpl) {
    try {
      recognition = new RecognitionImpl();
      recognition.lang = "ko-KR";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event) => {
        transcript = Array.from(event.results, (result) => result[0]?.transcript ?? "").join(" ");
      };
      // 말소리를 들은 뒤 멈췄을 때만 끝낸다. 아무 말도 없거나 마이크가 막히면 버튼·시간으로 끝낸다.
      recognition.onend = () => {
        if (transcript) finish();
      };
      recognition.start();
    } catch {
      recognition = null;
    }
  }

  return {
    done: () => {
      recognition?.abort();
      finish();
    },
    cancel: () => {
      finished = true;
      window.clearTimeout(timeout);
      recognition?.abort();
    },
  };
}

/** 여울이가 말하던 것을 멈춘다 (페이지를 떠날 때) */
export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
