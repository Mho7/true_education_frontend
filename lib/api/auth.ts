import { apiRequest } from "./client";
import type {
  LoginIdAvailabilityResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  SignupParentRequest,
  SignupParentResponse,
  SignupStudentRequest,
  SignupStudentResponse,
} from "./types";

export function checkLoginIdAvailability(loginId: string) {
  return apiRequest<LoginIdAvailabilityResponse>(`/auth/login-id/availability?loginId=${encodeURIComponent(loginId)}`);
}

export function signupStudent(body: SignupStudentRequest) {
  return apiRequest<SignupStudentResponse>("/auth/signup/student", { method: "POST", body });
}

export function signupParent(body: SignupParentRequest) {
  return apiRequest<SignupParentResponse>("/auth/signup/parent", { method: "POST", body });
}

export function login(body: LoginRequest) {
  return apiRequest<LoginResponse>("/auth/login", { method: "POST", body });
}

export function logout() {
  return apiRequest<{ success: boolean }>("/auth/logout", { method: "POST" });
}

export function getMe() {
  return apiRequest<MeResponse>("/me");
}
