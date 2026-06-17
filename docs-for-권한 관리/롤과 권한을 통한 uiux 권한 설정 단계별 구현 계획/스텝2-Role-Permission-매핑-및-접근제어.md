# 스텝 2: Role-Permission 매핑 UI + 실제 접근 제어

> 스텝 1에서 Permission CRUD와 API는 완성됐다.
> 스텝 2에서는 두 가지를 완성한다:
> 1. **롤에 권한을 할당하는 UI** (RolePermissionDialog)
> 2. **실제 접근 제어 복원** — 백엔드 `@PreAuthorize` + 프론트 `RequireRole`

---

## Part A: Role-Permission 매핑 UI

### 배경

`PUT /api/roles/{id}/permissions` API는 이미 구현돼 있다.
이걸 사용하는 프론트 다이얼로그가 없어 현재 DB에 직접 넣거나 API로만 할당 가능하다.

### 구현할 파일

**`src/features/role-management/RolePermissionDialog.tsx`**

```
동작 흐름:
1. [권한 설정] 버튼 클릭 (RoleTable 각 row에 추가)
2. 다이얼로그 열림 — GET /api/permissions 로 전체 권한 목록 로드
3. GET /api/roles/{id}/permissions 로 현재 할당된 권한 로드
4. 카테고리별로 체크박스 렌더링 (이미 할당된 것은 체크)
5. 저장 → PUT /api/roles/{id}/permissions (선택된 id 배열 전송)
6. 성공 시 roles 쿼리 invalidate + 다이얼로그 닫기
```

**`src/features/role-management/RoleTable.tsx` 수정**

```tsx
// 각 row에 [권한 설정] 버튼 추가
<button onClick={() => setPermissionTarget(role)}>
  권한 설정
</button>
```

### UI 스케치

```
┌─────────────────────────────────────────────┐
│  ROLE_MANAGER 권한 설정                       │
├─────────────────────────────────────────────┤
│  USER                                       │
│  ☑ USER_VIEW  사용자 조회                    │
│  ☐ USER_EDIT  사용자 수정                    │
│  ☐ USER_DELETE 사용자 삭제                   │
│                                             │
│  ROLE                                       │
│  ☑ ROLE_VIEW  롤 조회                        │
│  ☐ ROLE_EDIT  롤 수정/등록                   │
│  ☐ ROLE_DELETE 롤 삭제                       │
│  ...                                        │
├─────────────────────────────────────────────┤
│                      [취소]  [저장]          │
└─────────────────────────────────────────────┘
```

---

## Part B: 실제 접근 제어 복원

> 현재 스텝 1에서 모든 제한을 임시 해제했다.
> 스텝 2에서는 다시 **ROLE_ADMIN 전용**으로 잠근다.

### 백엔드

**`RoleController.java` + `PermissionController.java` 수정**

```java
@PreAuthorize("hasRole('ADMIN')")
@RestController
public class RoleController { ... }

@PreAuthorize("hasRole('ADMIN')")
@RestController
public class PermissionController { ... }
```

> `hasRole('ADMIN')` = Spring이 자동으로 `ROLE_ADMIN` 매핑

**UserController 엔드포인트별 제어 (선택적 세밀화)**

```java
@GetMapping                          // 목록 — ADMIN
@PreAuthorize("hasRole('ADMIN')")
public Page<UserResponse> list(...) { ... }

@PatchMapping("/{id}/role")          // 롤 변경 — ADMIN
@PreAuthorize("hasRole('ADMIN')")
public UserResponse changeRole(...) { ... }
```

> `SecurityConfig`에 `anyRequest().authenticated()` 가 이미 있으므로
> `@PreAuthorize` 없는 엔드포인트는 "로그인만 하면 접근 가능" 상태 유지.

### 프론트엔드

#### 1. `widgets/guards/RequireRole.tsx` — 현재 구현 확인 후 적용

```tsx
// 사용 예시
<RequireRole roles={["ROLE_ADMIN"]}>
  <AdminPanel />
</RequireRole>
```

동작:
- `status === "loading" | "idle"` → 빈 화면 대기
- `user.role.code`가 roles 배열에 없으면 → `/unauthorized` redirect
- 있으면 children 렌더링

#### 2. `/unauthorized` 페이지

```tsx
// app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <h1 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h1>
      <p className="text-muted-foreground mb-6">
        이 페이지는 관리자만 접근할 수 있습니다.
      </p>
      <Link href="/dashboard" className="...">대시보드로 돌아가기</Link>
    </main>
  );
}
```

#### 3. 페이지 가드 적용

```tsx
// app/users/page.tsx
<RequireRole roles={["ROLE_ADMIN"]}>...</RequireRole>

// app/roles/page.tsx
<RequireRole roles={["ROLE_ADMIN"]}>...</RequireRole>

// app/permissions/page.tsx
<RequireRole roles={["ROLE_ADMIN"]}>...</RequireRole>
```

#### 4. Header AdminDropdown 복원

```tsx
// widgets/header/ui/Header.tsx
{status === "authenticated" && user?.role.code === "ROLE_ADMIN" && (
  <AdminDropdown />
)}
```

---

## 완료 기준

### Part A (Role-Permission 매핑 UI)
- [ ] RoleTable에 [권한 설정] 버튼 표시
- [ ] RolePermissionDialog에서 전체 권한 체크박스 렌더링
- [ ] 현재 할당된 권한 pre-check
- [ ] 저장 후 즉시 반영

### Part B (접근 제어)
- [ ] ROLE_USER 계정으로 `/users` 접근 → `/unauthorized` 이동
- [ ] ROLE_USER 계정으로 `POST /api/roles` 호출 → 403 반환
- [ ] ROLE_ADMIN 계정만 헤더에 "관리 ▼" 드롭다운 표시
- [ ] 로그아웃 후 관리 메뉴 사라짐

---

## 다음 스텝

→ **스텝 3**: Permission 코드 기반 세밀한 제어
- `@PreAuthorize("hasPermission(...)")` 또는 커스텀 `@RequirePermission` 애노테이션
- 프론트: 특정 버튼/UI 요소를 permission 코드로 조건부 렌더
- `usePermission("USER_DELETE")` 같은 훅
