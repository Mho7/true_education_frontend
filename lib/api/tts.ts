import { apiRequest } from "./client";
import type { LineTtsResponse } from "./types";

/**
 * 여울이 목소리 스위치. NEXT_PUBLIC_TTS_PROVIDER=typecast 이면 서버(Typecast) 음성을 쓰고,
 * 그 밖에는 연결 전처럼 브라우저 speechSynthesis로 읽는다.
 */
export const TTS_ENABLED = process.env.NEXT_PUBLIC_TTS_PROVIDER === "typecast";

const audioUrls = new Map<string, string>();

/**
 * 여울이 차례 줄의 음성 주소. 스위치가 꺼져 있거나 서버가 음성을 못 만들면(503 등) null —
 * 부르는 쪽은 null이면 브라우저 음성으로 대신 읽는다.
 */
export async function getLineAudioUrl(bookId: number, lineId: string): Promise<string | null> {
  if (!TTS_ENABLED) return null;
  const key = `${bookId}/${lineId}`;
  const cached = audioUrls.get(key);
  if (cached) return cached;
  try {
    const { audioUrl } = await apiRequest<LineTtsResponse>(`/books/${bookId}/lines/${encodeURIComponent(lineId)}/tts`);
    audioUrls.set(key, audioUrl);
    return audioUrl;
  } catch {
    return null;
  }
}
