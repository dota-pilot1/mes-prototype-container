# `label_key` / `label` 두 컬럼이 필요한 이유

> 메뉴 테이블에 라벨 관련 컬럼이 왜 **두 개** 인지 정리.
> 한 줄로: **`label_key` 로 번역을 시도하고, 실패하면 `label` 로 폴백하기 위해.** 번역이 누락돼도 화면이 깨지면 안 되기 때문이다.

---

# label_key , label 각각의 역할은?

## 1. 각 컬럼의 역할

| 컬럼 | 역할 | 예시 값 |
|------|------|---------|
| `label_key` | **번역 키** — 실제 표시될 글자를 찾아오는 "주소" | `"nav.users"` |
| `label` | **폴백용 원본 글자** — 번역 실패 시 대신 보여줄 값 | `"사용자"` |

## 2. 우선순위 — 어느 쪽이 먼저인가

렌더 코드는 이렇게 생겼다:

```ts
t(node.labelKey, { defaultValue: node.label })
//   ↑ 먼저 시도              ↑ 실패 시 폴백
```

처리 순서:
1. `label_key` 로 번역을 찾아봄 → 성공하면 **번역된 값** 사용
2. 번역을 못 찾으면 → **`label`** 을 대신 보여줌
3. `label_key` 자체가 NULL 이면 → 바로 **`label`** 사용

**`label_key` 가 주(主), `label` 이 보험.**

## 3. 왜 `label_key` 만으로는 부족한가

`label_key` 만 있는 시스템을 상상해보자.

```
DB:   label_key = "nav.users"
          ↓
i18n 리소스에서 키로 찾음
          ↓
리소스에 그 키가 없으면?
          ↓
화면:  "nav.users"    ← 날것의 문자열이 그대로 노출 ❌
```

이런 상황은 드물지 않다:
- 개발자가 깜빡하고 `ko/nav.ts` 에 키 추가를 안 함
- 관리 UI 로 새 메뉴를 추가했는데 번역 리소스에는 키가 아직 없음
- 배포 타이밍 엇갈림 (DB 는 새 메뉴, 프론트 번들은 구버전)

`label` 폴백이 있으면 이 모든 경우에 **최소한 사람이 읽을 수 있는 한국어가 뜬다.**

## 4. 왜 `label` 만으로도 부족한가

`label` 만 있는 시스템을 상상해보자.

```
DB:   label = "사용자"
          ↓
화면: 한국어일 때도 "사용자"
      영어일 때도  "사용자"   ← 다국어 기능 무력화 ❌
      일본어일 때도 "사용자"
```

- 언어 전환 기능 자체가 의미 없어짐.
- 번역할 방법이 원천 차단.

## 5. 둘 다 있을 때의 동작표

DB row:
```
label_key = "nav.users"
label     = "사용자"
```

| 상황 | 사용되는 값 | 화면 |
|------|:-----------:|------|
| 한국어 + `nav.users` 번역 있음 | `label_key` → 번역값 | `"사용자"` |
| 영어 + `nav.users` 번역 있음 | `label_key` → 번역값 | `"Users"` |
| 영어 + 번역 리소스에 키 없음 | **`label` 폴백** | `"사용자"` |
| `label_key = NULL` | **`label` 직접** | `"사용자"` |

→ **어떤 경로로 가든 화면에 의미 있는 글자가 표시된다.**

---

# 다국어 설정과 어떻게 매핑 되나?

## 6. 현재 프로젝트 i18n 구조

확인된 사항:
- 라이브러리: `i18next` + `react-i18next`
- 설정 파일: [src/shared/i18n/index.ts](../../beauty-book--front/src/shared/i18n/index.ts)
- 네임스페이스: `["common", "nav", "auth", "form"]` — 이미 `nav` 존재
- 지원 언어: 한국어(ko) / 영어(en) / 일본어(ja) / 중국어(zh)
- 기존 사용 예: [Header.tsx](../../beauty-book--front/src/widgets/header/ui/Header.tsx) 에서 `useTranslation("nav")` → `t("users")`

→ `t(node.labelKey, { defaultValue: node.label })` 는 **기존 i18n API 그대로 씀.** 전혀 새로운 체계가 아님.

## 7. 번역 리소스 위치

```
src/shared/i18n/resources/
├── ko/nav.ts
├── en/nav.ts
├── ja/nav.ts
└── zh/nav.ts
```

현재 `en/nav.ts` 모습:
```ts
export const nav = {
  dashboard: "Dashboard",
  admin: "Admin",
  users: "Users",
  rolePermissions: "Roles & Permissions",
  siteSettings: "Landing Page",
  profile: "My Profile",
  logout: "Logout",
  login: "Login",
  register: "Sign Up",
};
```

즉 `label_key = "nav.users"` 로 저장하면
- `nav` 네임스페이스의 `users` 키를 찾아감 → `"Users"` / `"사용자"` / `"ユーザー"` / `"用户"` 로 자동 전환.

## 8. DB `label_key` 값과 리소스 키의 정확한 매핑

```
DB.label_key                 →   리소스 경로
─────────────────────────────────────────────────
"nav.users"                  →   nav.ts 의 users 키
"nav.rolePermissions"        →   nav.ts 의 rolePermissions 키
"nav.siteSettings"           →   nav.ts 의 siteSettings 키
```

형식: `"{네임스페이스}.{키명}"` — i18next 표준 dot notation.

## 9. 네임스페이스 네이밍 규약 (권장)

- 메뉴 라벨은 반드시 `nav.` 프리픽스로 시작.
  - ✅ `nav.dashboard`, `nav.menus`
  - ❌ `common.dashboard`, `menus.dashboard`
- 키명은 camelCase.
  - ✅ `nav.rolePermissions`
  - ❌ `nav.role_permissions`, `nav.Role-Permissions`
- 이유: 기존 리소스 네이밍 컨벤션과 통일 + 정규식 검증 쉬움.

## 10. 빌드 타임 번역 vs 런타임 번역

현재 프로젝트 번역은 **TypeScript 리소스 모듈 (빌드 타임 번들)**:

```ts
// src/shared/i18n/index.ts
import { ko } from "./resources/ko";
import { en } from "./resources/en";
// ...
const resources = { ko, en, ja, zh };
i18n.use(initReactI18next).init({ resources, ... });
```

즉 번역은 **빌드 시점에 번들에 포함** 된다. 런타임에 JSON 을 동적으로 가져오지 않는다.

이게 `label_key` / `label` 설계에 주는 영향:

| 메뉴 출처 | 번역 처리 |
|-----------|-----------|
| **시더로 박힌 기본 메뉴** | 개발자가 `nav.ts` 에도 키 추가 → `label_key` 정상 동작 |
| **관리자가 UI 로 런타임 추가** | 리소스에 키 없으니 번역 불가 → **`label` 폴백이 주역** |

**이 구조에서 `label` 폴백 컬럼은 사치가 아니라 필수다.**

## 11. 폴백이 작동하는 원리 (i18next `defaultValue`)

```ts
t("nav.users", { defaultValue: "사용자" })
```

i18next 내부 동작:
1. 현재 언어 리소스에서 `nav.users` 찾음
2. 있으면 그 값 반환
3. 없으면 `fallbackLng` (기본 "en") 에서 재시도
4. 거기도 없으면 → `defaultValue` 반환

즉 `label` 은 **모든 언어 리소스에서 키가 누락돼도 마지막까지 버티는 최후의 보루**.

---

# 정리 — 두 컬럼이 하는 일

```
화면 라벨이 필요함
   ↓
label_key 있음? ── Yes → t(label_key) 로 번역 시도
                           ↓
                        번역 있음? ── Yes → 번역값 사용 ✅
                           ↓ No
                        label 로 폴백 ✅
   ↓ No
label 을 그대로 사용 ✅
```

## 한 문장으로

- `label_key` = **"잘 되면 번역해라"** (다국어 지원의 수단)
- `label` = **"안 되면 이거라도 보여줘라"** (화면 깨짐 방지의 안전망)

두 컬럼이 다 있는 이유는 **"다국어 지원은 하고 싶지만, 번역이 누락돼도 화면이 깨지면 안 된다"** 는 실무적 타협이다.
i18next 의 `defaultValue` 옵션이 딱 이 패턴을 위해 존재한다.

---

## 운영 규칙

- **시더로 메뉴를 추가할 땐** 반드시 `label_key` 와 **동시에** `src/shared/i18n/resources/{ko,en,ja,zh}/nav.ts` 에 키를 추가할 것. (같은 PR 안에서 묶어 커밋)
- **관리 UI 로 메뉴를 추가할 땐** `label` 은 필수로 채우고, `label_key` 는 선택으로 둠. `label_key` 를 채웠다면 개발 팀에 번역 키 추가 요청을 남김.
- **번역 리소스에 없는 `label_key` 를 저장해도 실패하지 않음** — `label` 폴백으로 자연스럽게 처리되니 UX 관점에서는 안전.
