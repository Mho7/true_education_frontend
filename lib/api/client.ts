// 백엔드 API 호출의 공통 부분. 실제 요청은 lib/api/ 아래 함수에서만 보낸다.
// 로그인은 httpOnly 세션 쿠키(connect.sid)로 유지되므로 모든 요청에 credentials: "include"를 넣는다.

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000").replace(/\/$/, "");

/** 2xx가 아닌 응답. message는 서버가 준 문구(NestJS 검증 오류는 첫 문구) */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 서버가 응답하지 않았을 때(백엔드가 꺼져 있음 등) 보여 줄 문구 */
export const NETWORK_ERROR_MESSAGE = "서버와 연결하지 못했어요. 잠시 후 다시 시도해 주세요.";

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (typeof message === "string") return message;
    if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  }
  return fallback;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** 객체는 JSON으로, FormData(파일 올리기)는 그대로 보낸다 */
  body?: unknown;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, { method = "GET", body, signal }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    const isForm = body instanceof FormData;
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body === undefined || isForm ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, messageFrom(data, `요청을 처리하지 못했어요 (${response.status})`));
  return data as T;
}

/** 화면에 보여 줄 오류 문구 */
export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : NETWORK_ERROR_MESSAGE;
}

export const isApiError = (error: unknown, status: number): error is ApiError =>
  error instanceof ApiError && error.status === status;
