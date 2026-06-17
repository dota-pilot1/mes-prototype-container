# 6. 프론트 — API 클라이언트 & 타입

## 목표
공용 axios 인스턴스 + 에러 응답 타입 + auth API 함수. 이후 모든 API 호출이 이 인스턴스를 쓴다.

## 파일 구조
```
src/
├─ shared/
│  ├─ api/
│  │  ├─ axios.ts
│  │  └─ errors.ts
│  └─ types/
│     └─ error.ts
└─ entities/
   └─ user/
      ├─ api/
      │  └─ authApi.ts
      └─ model/
         └─ types.ts
```

## 파일

### `src/shared/api/axios.ts`
```ts
import axios, { AxiosError } from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4101";

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// 로그인 구현 단계에서 request 인터셉터로 Authorization 헤더 주입 + 401 리프레시 로직 추가 예정.
// 지금은 단순 인스턴스만.

export function isAxiosError<T = unknown>(e: unknown): e is AxiosError<T> {
  return axios.isAxiosError(e);
}
```

### `src/shared/types/error.ts`
백엔드 `ErrorResponse` 와 1:1 매칭:
```ts
export type ApiErrorResponse = {
  code: string;
  message: string;
  timestamp: string;
  fieldErrors: Record<string, string> | null;
};
```

### `src/shared/api/errors.ts`
```ts
import { isAxiosError } from "./axios";
import type { ApiErrorResponse } from "@/shared/types/error";

export function getApiError(e: unknown): ApiErrorResponse | null {
  if (!isAxiosError<ApiErrorResponse>(e)) return null;
  return e.response?.data ?? null;
}

export function getFieldErrors(e: unknown): Record<string, string> {
  return getApiError(e)?.fieldErrors ?? {};
}

export function getErrorMessage(e: unknown, fallback = "요청을 처리하지 못했습니다."): string {
  return getApiError(e)?.message ?? fallback;
}
```

### `src/entities/user/model/types.ts`
```ts
export type UserRole = "ROLE_USER" | "ROLE_ADMIN";

export type User = {
  id: number;
  email: string;
  username: string;
  role: UserRole;
  createdAt: string;  // ISO
};

export type SignupRequest = {
  email: string;
  password: string;
  username: string;
};

export type SignupResponse = User;  // 백엔드 SignupResponse 와 필드 일치
```

### `src/entities/user/api/authApi.ts`
```ts
import { api } from "@/shared/api/axios";
import type { SignupRequest, SignupResponse } from "../model/types";

export const authApi = {
  signup: (body: SignupRequest) =>
    api.post<SignupResponse>("/api/auth/signup", body).then((r) => r.data),

  checkEmail: (email: string) =>
    api
      .get<{ available: boolean }>("/api/auth/check-email", { params: { email } })
      .then((r) => r.data.available),
};
```

## 검증
브라우저 콘솔에서:
```js
// import 해서 쓰거나, 일시적으로 window 에 붙여서:
await fetch("http://localhost:4101/api/auth/check-email?email=a@b.com").then(r=>r.json())
// → {available: true}
```

## 주의
- `withCredentials: true` 는 **설정하지 않음**. JWT 를 Authorization 헤더로 쓸 것이라 쿠키 불필요.
- `baseURL` 기본값 하드코딩은 `.env.local` 이 사라졌을 때 localhost fallback 용도. 프로덕션 빌드는 `.env.production` 으로 강제.
- timeout 15초는 로컬 기준. Twilio 연동 등 느린 업스트림 있으면 엔드포인트별로 조정.
