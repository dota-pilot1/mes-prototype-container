# 스텝 9: 권한 연동 — `requiredRole` 기반 visibility

> 이 프로젝트는 [docs-for-권한 관리](../docs-for-권한%20관리) 에서 `Role` / `Permission` / `RolePermission` 체계를 이미 구축했다. 메뉴는 이를 **소비** 할 뿐이다.
> **현재 구현은 프론트측 `requiredRole === userRole` 단순 비교 한 줄** 만 쓴다.

---

## 실제 연결점

| 레이어 | 내용 |
|--------|------|
| 서버 `/api/menus` | 공개 엔드포인트. 권한 필터 **안 함**. 전체 반환 |
| 프론트 Header | `buildTree(flat, userRole)` 안에서 `m.visible && (!m.requiredRole || m.requiredRole === userRole)` 필터 |
| 프론트 인증 | `useAuth()` → `user?.role?.code` 가 유저의 단일 role |

---

## 실제 판정 규칙 (Header 인라인)

```ts
const visible = flat.filter(
  (m) => m.visible && (!m.requiredRole || m.requiredRole === userRole)
);
```

- `visible=false` → 제외.
- `requiredRole=null` → 모두 통과 (로그인 유저 누구나).
- `requiredRole=ROLE_ADMIN` → `userRole === "ROLE_ADMIN"` 일 때만 통과.
- **`requiredPermission` 필드는 저장·수정만 되고 소비 안 함**.

### 전이 규칙 (부모 제외 → 자식 제외)

별도 로직 없이 **자연 발생**:
- 부모가 필터에서 빠짐 → `map` 에 부모 없음 → `map.get(parentId)?.children.push(...)` 가 no-op → 자식이 roots 에도 포함되지 않음 (parentId != null) → **드롭**.
- Optional chaining 한 줄이 전이 규칙을 완성시킴.

---

## 계획 대비 미구현

| 계획 | 실제 | 상태 |
|------|------|:----:|
| 서버측 `MenuVisibilityPolicy.canSee(Menu, UserContext)` | 서버는 전체 반환 | ❌ 의도적 (공개 GET) |
| `user.hasRole(...) AND user.hasPermission(...)` | `userRole === requiredRole` 단순 비교 | ⚠️ role 만, 배열 아님 |
| 프론트 `filterVisibleForUser(flat, { roles, permissions })` | Header 인라인 한 줄 | ⚠️ 유틸화 안 함 |
| 서버측 2-pass 고아 방지 알고리즘 | 없음 | ❌ 프론트가 Optional chaining 으로 자연 처리 |
| 401 미인증 방어 | `/api/menus` 가 공개 GET 이라 401 안 남 | — |

---

## 유저 role 구조 (실제)

현재 `useAuth()` 의 `user` 는:

```ts
user: {
  username: string;
  email: string;
  role: { code: string; name: string; ... };   // 단일 role 객체
  // roles: string[] 배열 필드 없음
  // permissions: string[] 배열 필드 없음
}
```

- **단일 role**. 한 유저가 여러 role 을 가질 수는 없는 모델.
- `role.code` 가 `"ROLE_ADMIN"`, `"ROLE_USER"` 등.

---

## 관리 UI 에서 권한 선택

`MenuFormDialog` / `MenuTreeTab DetailPanel` 의 `requiredRole` 필드:

```tsx
<input
  value={form.requiredRole ?? ""}
  onChange={(e) => set("requiredRole", e.target.value || null)}
  placeholder="ROLE_ADMIN"
/>
```

- **자유 입력 (text input)**. 계획에 있던 "Role 드롭다운" 은 미적용.
- 오타 위험 있음. 개선 시 `/api/roles` 조회 → Select 로 교체.
- 빈 문자열이면 `null` 저장.

---

## 엣지 케이스 (현재 동작)

| 케이스 | 동작 |
|--------|------|
| 비로그인에서 `/api/menus` 호출 | 200 정상 반환 (공개). Header 는 `status !== "authenticated"` 라 렌더 안 함 |
| 관리자가 `ADMIN` 메뉴에 `requiredRole=ROLE_OWNER` 같은 없는 값 저장 | 어떤 유저에게도 안 보임 → 관리 UI 로 들어가려면 URL 직접 입력 필요 |
| JWT 만료 직후 role 변경 | 재로그인 전까지 구권한 기준. 의도대로 |
| 본인이 `ADMIN_MENU_MANAGEMENT` 를 `requiredRole=ROLE_NONEXISTENT` 로 잠금 | URL 직접 타고 들어가서 복구. UI 경고 없음 |

---

## 서버측 가드 (여전히 작동)

메뉴는 공개지만 **실제 페이지 접근은 여전히 서버 가드**:
- `/users`, `/role-permissions` 등의 API 는 `@PreAuthorize("hasRole('ADMIN')")` 유지.
- 메뉴 링크만 숨기면 UX 이고, 실제 보안은 API 단에서.

---

## 향후 (v2)

- 서버측 선택적 필터: `GET /api/menus?scope=mine` 같은 옵션으로 유저별 응답.
- Permission 기반 필터 (`requiredPermission` 소비).
- `roles: string[]` 으로 멀티 role 지원.
- `filterVisibleForUser` 유틸 분리 + 테스트.
- 관리자 미리보기 모드 (role 골라서 "이 유저 눈에 어떻게 보일지" 시뮬레이션).
