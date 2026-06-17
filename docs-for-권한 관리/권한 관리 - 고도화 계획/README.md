# 권한 관리 Advanced — 운영 수준 고도화

> 현재 1차/2차 구현은 "권한 모델" 수준으로 충분하지만, 콜센터·공공·금융처럼 **감사(Audit)와 컴플라이언스 요구가 빡센 환경**에 실제로 운영되려면 주변 기능이 더 필요하다.
>
> 이 문서는 그 추가 구현 계획을 정리한다.

---

## 현재 기반 평가

지금 구현된 구조는 advanced 기능을 얹기에 **매우 좋은 기반**이다:

1. **권한 체크 진입점이 한 곳** — `@PreAuthorize`, `JwtAuthenticationFilter`, `UserPrincipal` → AOP로 감사 로그 꽂을 자리 명확
2. **UserPrincipal에 userId/role 존재** — 감사 로그의 "누가(Who)" 추적 가능
3. **GlobalExceptionHandler 통일** — 실패 로그(권한 거부, 로그인 실패) 가로채기 쉬움
4. **Role-Permission N:M 구조** — 새 기능도 Permission 하나 추가하면 붙음

→ **권한 로직을 뒤엎을 필요 없이, 옆에 기능만 붙이면 되는 형태**

---

## 도메인 예시 — 제주 공항 콜센터급 운영 요건

### 권한 모델 관점 — ✅ 이미 충분

콜센터 일반적 역할 구성:
- 상담원 / 슈퍼바이저 / QA / 매니저 / 관리자 (5~6개 역할)
- 통화 조회 / 녹취 재생 / 고객정보 수정 / 상담원 관리 / 통계 조회 (10~20개 권한)

현재 RBAC 구조로 전부 커버. `hasAuthority('CALL_RECORDING_PLAY')` 같은 식으로 달면 끝.

### 운영/보안 관점 — ⚠️ 추가 구현 필요

| 요구사항 | 현재 | 우선순위 | 사유 |
|---------|------|---------|------|
| 고객정보 열람 감사 로그 | ❌ | 🔴 필수 | 개인정보보호법 |
| 녹취 재생/다운로드 이력 | ❌ | 🔴 필수 | 감사 대상 |
| 권한 변경 이력 | ❌ | 🟡 중요 | 누가 누구한테 무슨 권한 줬나 |
| 동시 로그인 제한 | ❌ | 🟡 중요 | 상담원 계정 공유 방지 |
| 비밀번호 정책 (90일 변경) | ❌ | 🟡 중요 | 보안 표준 |
| IP 화이트리스트 | ❌ | 🟡 콜센터 흔함 | 사내망만 접근 |
| 계정 잠금 / 로그인 실패 로그 | ❌ | 🟡 중요 | 보안 감사 |

---

## 구현 로드맵

### Phase 1 — 감사 로그 (Audit Log) 🔴

**기반이 되는 기능. 모든 컴플라이언스의 시작점.**

- `audit_log` 테이블
  ```
  id, user_id, action, resource_type, resource_id,
  ip_address, user_agent, detail(JSON), created_at
  ```
- `@Auditable` 커스텀 어노테이션 + AOP Aspect
  ```java
  @Auditable(action = "CUSTOMER_INFO_VIEW")
  @GetMapping("/api/customers/{id}")
  public CustomerResponse get(...) { ... }
  ```
- 로그인/로그아웃/권한 거부(`AuthorizationDeniedException`)는 GlobalExceptionHandler에서 자동 기록
- 감사 로그 조회 페이지 (관리자 전용)

### Phase 2 — 계정 보안 🟡

- **계정 잠금**: 로그인 실패 5회 시 30분 잠금 (`users.failed_login_count`, `users.locked_until`)
- **비밀번호 정책**: 복잡도 검증(Bean Validation 커스텀), 90일 경과 시 강제 변경
- **이메일 인증**: 회원가입 직후 `active = false`, 메일 링크 클릭 시 활성화
- **비밀번호 재설정**: 메일 링크 기반 (토큰 1회용, 30분 만료)

### Phase 3 — 세션/토큰 고도화 🟡

- **Refresh Token → httpOnly 쿠키 + CSRF 토큰** (localStorage XSS 취약점 해소)
- **동시 로그인 제한**: 같은 유저의 기존 refresh token 무효화 (또는 세션 N개 제한)
- **Access Token 블랙리스트 (Redis)** — 권한 변경 즉시 반영, 강제 로그아웃
- **디바이스 추적**: `refresh_tokens` 테이블에 user_agent, ip 기록

### Phase 4 — 네트워크/접근 제어 🟢

- **IP 화이트리스트**: Role 단위로 접근 허용 IP 대역 지정
- **Rate Limiting**: 로그인 엔드포인트 bucket4j (IP 기준 분당 5회)
- **2FA/OTP** (선택): 관리자 계정만이라도 TOTP 적용

### Phase 5 — 운영 편의 🟢

- **권한 변경 이력** (`permission_change_log`): 누가 언제 어떤 role에 어떤 permission 추가/제거
- **프론트 권한 체크 컴포넌트화**:
  ```tsx
  <Permission require="CALL_RECORDING_PLAY" fallback={<Denied/>}>
    <PlayButton />
  </Permission>
  ```
- **통합 테스트**: `@SpringBootTest` + TestContainers로 인증/인가 flow regression 방지

---

## 구현 순서 제안

| 순서 | Phase | 예상 기간 | 이유 |
|------|-------|---------|------|
| 1 | Audit Log (Phase 1) | 1주 | 다른 모든 감사 기능의 기반 |
| 2 | 계정 잠금 + Rate Limit (Phase 2, 4 일부) | 3일 | brute-force 1차 방어 |
| 3 | httpOnly 쿠키 전환 (Phase 3) | 3일 | XSS 보안 |
| 4 | 이메일 인증 + 비밀번호 재설정 (Phase 2) | 1주 | UX + 보안 |
| 5 | 나머지 (Phase 3~5) | 상황에 따라 | |

---

## 결론

> **현재 구현 = "콜센터 권한 프로토타입"**
> **→ Phase 1(감사 로그) + Phase 2 일부(계정 잠금) 추가 = "운영 가능한 콜센터 백엔드"**
> **→ Phase 3~4까지 완료 = "금융/공공 납품 가능 수준"**

권한 모델 자체는 이미 합격선. 여기서부터는 **보안/감사/운영 편의**의 영역이다.
