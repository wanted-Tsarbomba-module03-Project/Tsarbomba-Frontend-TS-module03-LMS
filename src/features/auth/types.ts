/** 공통 응답 래퍼 (data 타입을 제네릭으로 고정 가능) */
export interface AuthResponse<TData = unknown> {
  status?: string;
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: TData;
}

/** 사용자 권한 */
export type UserRole =
  | "MASTER"
  | "ADMIN"
  | "OPERATOR"
  | "INSTRUCTOR"
  | "STUDENT"
  | "USER";

/** 로그인 요청 */
export interface LoginRequest {
  email: string;
  password: string;
}

/** 로그인 응답 data */
export interface LoginResponseData {
  stepUpRequired?: boolean;
  maskedEmail?: string;
  nickname?: string;
  role?: UserRole;
}

/** 회원가입 요청 */
export interface SignupRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  nickname: string;
  phone: string;
  /** 이용약관 동의 — 반드시 true */
  termsOfServiceAgreed: boolean;
  /** 개인정보 수집·이용 동의 — 반드시 true */
  privacyPolicyAgreed: boolean;
}

/** 소셜 추가정보 제출 요청 */
export interface OAuthCompleteRequest {
  nickname: string;
  phone: string;
  /** 이용약관 동의 — 반드시 true */
  termsOfServiceAgreed: boolean;
  /** 개인정보 수집·이용 동의 — 반드시 true */
  privacyPolicyAgreed: boolean;
}

/** 이메일 인증 코드 검증 요청 */
export interface EmailVerifyRequest {
  email: string;
  code: string;
}
