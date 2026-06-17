# 7. 프론트 — axios 인터셉터 (토큰 주입 + 401 리프레시)

## 목표
- 요청 인터셉터: 메모리 access token 을 Authorization 헤더로 자동 주입
- 응답 인터셉터: 401 응답 시 한 번만 refresh 시도, 성공 시 원래 요청 재전송, 대기 중인 다른 요청들도 함께 처리 (race condition 방지)

## 파일
```
src/shared/api/
├─ axios.ts                 (수정)
├─ tokenStorage.ts          (신규)
└─ refreshQueue.ts          (신규, 선택)
```

또는 `axios.ts` 하나에 통합해도 됨 (권장).

## 토큰 저장소

### `src/shared/api/tokenStorage.ts`
```ts
const ACCESS_KEY = "twilio.accessToken";
const REFRESH_KEY = "twilio.refreshToken";

// 메모리 캐시 (매 요청마다 localStorage 읽기 방지)
let accessMemory: string | null = null;

export const tokenStorage = {
  getAccess(): string | null {
    if (accessMemory !== null) return accessMemory;
    if (typeof window === "undefined") return null;
    accessMemory = window.localStorage.getItem(ACCESS_KEY);
    return accessMemory;
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    accessMemory = access;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACCESS_KEY, access);
      window.localStorage.setItem(REFRESH_KEY, refresh);
    }
  },
  clear() {
    accessMemory = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ACCESS_KEY);
      window.localStorage.removeItem(REFRESH_KEY);
    }
  },
};
```

> **왜 localStorage?** httpOnly 쿠키가 XSS 관점에서 더 안전하지만, 백엔드/프론트 쿠키 세팅 비용·CORS credentials·CSRF 보강이 따라붙음. 기본 스코프에서는 localStorage 로 시작하고, 후속 과제로 refresh 만 httpOnly 쿠키 이전.
> **메모리 캐시**는 새로고침하면 날아감 → `getAccess()` 가 localStorage 에서 복구.

## axios 인터셉터

### `src/shared/api/axios.ts` (전면 재작성)
```ts
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./tokenStorage";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4101";

export const api = axios.create({
  baseURL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ---- 요청 인터셉터 ----
api.interceptors.request.use((config) => {
  // refresh 엔드포인트는 헤더 주입 스킵 (리프레시 토큰은 body 로 보냄)
  if (config.url?.includes("/api/auth/refresh")) return config;
  if (config.url?.includes("/api/auth/login")) return config;
  if (config.url?.includes("/api/auth/signup")) return config;

  const token = tokenStorage.getAccess();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---- 응답 인터셉터: 401 리프레시 큐 ----
type Retryable = InternalAxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (e: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

async function refreshTokens(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) throw new Error("no refresh token");

  // axios 인스턴스 재진입 방지 위해 raw fetch 사용
  const res = await fetch(`${baseURL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
  const data: { accessToken: string; refreshToken: string } = await res.json();
  tokenStorage.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as Retryable | undefined;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    // 로그인/리프레시 엔드포인트 자체의 401 은 재시도 대상 아님
    if (
      original.url?.includes("/api/auth/login") ||
      original.url?.includes("/api/auth/refresh") ||
      original.url?.includes("/api/auth/signup")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // 이미 리프레시 중이면 큐에 붙여둠
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            original.headers = original.headers ?? {};
            (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshTokens();
      flushQueue(null, newToken);
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      flushQueue(e, null);
      tokenStorage.clear();
      // 페이지 이동은 여기서 직접 하지 말고 authStore 에서 처리 (08 단계)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export function isAxiosError<T = unknown>(e: unknown): e is AxiosError<T> {
  return axios.isAxiosError(e);
}
```

## 설계 결정

| 결정 | 이유 |
| --- | --- |
| refresh 는 `fetch` 로 직접 호출 | axios 인스턴스 재진입 시 인터셉터 재귀 위험 |
| 401 재시도 플래그 `_retry` | 무한 루프 방지 |
| 큐 방식 | 병렬 요청 5개가 동시에 401 나도 refresh 는 1번만 |
| `auth:logout` 커스텀 이벤트 | 라우팅/스토어 결합 회피. store 에서 리스너 등록해 반응 |
| login/signup/refresh 요청은 인터셉터 스킵 | 잘못된 Authorization 으로 오염 방지 |

## 검증
- 로그인 후 /api/auth/me 호출 → 200 (Authorization 자동 주입 확인)
- accessToken 을 일부러 만료 (DB/JWT 디코더로) → 다음 요청 시 자동 refresh → 성공
- refreshToken 도 만료시킨 뒤 요청 → 401 전파 + `auth:logout` 이벤트 발생

## 주의
- `typeof window === "undefined"` 체크: Next.js SSR 경로에서 localStorage 접근 방지
- `_retry` 는 타이핑 편의상 InternalAxiosRequestConfig 확장 — `Retryable` 타입 별도 선언
- 로그인 페이지에서는 `api.post("/api/auth/login", ...)` 호출 시 인터셉터가 제외시켰으므로 이전 토큰이 있어도 오염 없음
