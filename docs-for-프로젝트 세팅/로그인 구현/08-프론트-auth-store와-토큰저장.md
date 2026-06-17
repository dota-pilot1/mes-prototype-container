# 8. 프론트 — Auth Store & 초기화

## 목표
- 현재 유저 상태(access token, user, isAuthenticated) 전역 보관
- 앱 시작 시 localStorage 에서 토큰 복원 → `/api/auth/me` 로 유저 정보 로드
- `auth:logout` 이벤트(인터셉터에서 dispatch) 구독해서 상태 클리어 + 라우팅

## 의존성
- `@tanstack/react-store` (이미 설치됨)

## 파일
```
src/
├─ entities/user/
│  ├─ api/authApi.ts            (수정)
│  └─ model/
│     ├─ types.ts               (수정)
│     └─ authStore.ts           (신규)
└─ app/
   ├─ AuthInitializer.tsx       (신규)
   └─ layout.tsx                (수정)
```

## 타입 추가

### `src/entities/user/model/types.ts` (이어서)
```ts
export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSec: number;
  user: User;
};

export type LoginRequest = {
  email: string;
  password: string;
};
```

## API 추가

### `src/entities/user/api/authApi.ts` (전체 재작성)
```ts
import { api } from "@/shared/api/axios";
import type { SignupRequest, SignupResponse, LoginRequest, TokenResponse, User } from "../model/types";

export const authApi = {
  signup: (body: SignupRequest) =>
    api.post<SignupResponse>("/api/auth/signup", body).then((r) => r.data),

  checkEmail: (email: string) =>
    api.get<{ available: boolean }>("/api/auth/check-email", { params: { email } }).then((r) => r.data.available),

  login: (body: LoginRequest) =>
    api.post<TokenResponse>("/api/auth/login", body).then((r) => r.data),

  me: () =>
    api.get<User>("/api/auth/me").then((r) => r.data),

  logout: () =>
    api.post<void>("/api/auth/logout").then((r) => r.data),
};
```

## Store

### `src/entities/user/model/authStore.ts`
```ts
"use client";

import { Store, useStore } from "@tanstack/react-store";
import { tokenStorage } from "@/shared/api/tokenStorage";
import { authApi } from "../api/authApi";
import type { User, TokenResponse } from "./types";

export type AuthState = {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "anonymous";
};

export const authStore = new Store<AuthState>({
  user: null,
  status: "idle",
});

export const authActions = {
  async login(email: string, password: string): Promise<User> {
    authStore.setState((s) => ({ ...s, status: "loading" }));
    const res: TokenResponse = await authApi.login({ email, password });
    tokenStorage.set(res.accessToken, res.refreshToken);
    authStore.setState({ user: res.user, status: "authenticated" });
    return res.user;
  },

  async restore(): Promise<void> {
    const token = tokenStorage.getAccess();
    if (!token) {
      authStore.setState({ user: null, status: "anonymous" });
      return;
    }
    authStore.setState((s) => ({ ...s, status: "loading" }));
    try {
      const user = await authApi.me();
      authStore.setState({ user, status: "authenticated" });
    } catch {
      tokenStorage.clear();
      authStore.setState({ user: null, status: "anonymous" });
    }
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // 서버 로그아웃 실패해도 프론트 상태는 정리
    }
    tokenStorage.clear();
    authStore.setState({ user: null, status: "anonymous" });
  },

  /** 인터셉터에서 dispatch 한 auth:logout 이벤트로 호출됨 */
  forceAnonymous(): void {
    tokenStorage.clear();
    authStore.setState({ user: null, status: "anonymous" });
  },
};

// React hook
export function useAuth() {
  return useStore(authStore);
}
```

## Initializer

### `src/app/AuthInitializer.tsx`
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authActions, useAuth } from "@/entities/user/model/authStore";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    authActions.restore();
  }, []);

  useEffect(() => {
    const onLogout = () => {
      authActions.forceAnonymous();
      router.replace("/login");
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, [router]);

  // 복원 중에는 빈 화면 or 로딩 스피너
  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        로딩 중...
      </div>
    );
  }

  return <>{children}</>;
}
```

## `src/app/layout.tsx` 수정
`QueryProvider` 안쪽에 `AuthInitializer` 감싸기:
```tsx
<QueryProvider>
  <AuthInitializer>{children}</AuthInitializer>
</QueryProvider>
```

## 검증
- 로그인 후 새로고침 → `/api/auth/me` 호출되고 상태 복원되는지 네트워크 탭 확인
- 로그아웃 → 상태 `anonymous`, localStorage 비워짐
- 일부러 `twilio.accessToken` localStorage 값 쓰레기로 조작 → refresh 로 복구 시도 → 실패 시 anonymous + /login 이동

## 주의
- `authStore` 는 `"use client"` 필요. 서버 컴포넌트에서 import 불가.
- 초기 상태 `status: "idle"` 로 시작해서 로딩 표시를 구분. SSR 안 한다면 `anonymous` 바로 줘도 됨.
- Next.js App Router 의 `router.replace` 는 쿼리/해시 보존 안 됨. 로그인 후 원래 URL 로 돌려보내고 싶으면 `searchParams.get("next")` 처리 추가.
