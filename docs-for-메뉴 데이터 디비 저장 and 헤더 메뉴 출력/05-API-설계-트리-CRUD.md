# 스텝 5: API 설계 (2) — CRUD (ADMIN)

> 관리 UI 가 호출할 변경 API. 모두 `@PreAuthorize("hasRole('ADMIN')")` 로 보호.
> 원래 계획은 `/api/admin/menus/**` 로 경로 분리였지만, **실제 구현은 `/api/menus` 로 통합** 하고 메서드 + PreAuthorize 로 구분한다.
> 실제 파일: [MenuController.java](../../beauty-book-server/src/main/java/com/cj/beautybook/menu/presentation/MenuController.java)

---

## 엔드포인트 목록 (실제)

| 메서드 | URL | 인증 | 바디 | 반환 |
|--------|-----|:----:|------|------|
| `GET`    | `/api/menus`       | 공개 | — | `MenuResponse[]` (전체) |
| `POST`   | `/api/menus`       | ADMIN | `CreateMenuRequest` | 201 + `MenuResponse` |
| `PATCH`  | `/api/menus/{id}`  | ADMIN | `UpdateMenuRequest` | `MenuResponse` |
| `DELETE` | `/api/menus/{id}`  | ADMIN | — | 204 |

> 계획에 있던 `/reorder`, `/{id}/parent` **전용 엔드포인트는 미구현**. 사유: 필요 없었다. [결정 로그](#결정-로그-계획-대비-변경점) 참고.

---

## DTO 스키마

### `CreateMenuRequest`

```java
public record CreateMenuRequest(
    @NotBlank String code,
    Long parentId,
    @NotBlank String label,
    String labelKey,
    String path,
    String icon,
    boolean isExternal,
    String requiredRole,
    String requiredPermission,
    boolean visible,
    int displayOrder
) {}
```

### `UpdateMenuRequest`

```java
public record UpdateMenuRequest(
    Long parentId,
    @NotBlank String label,
    String labelKey,
    String path,
    String icon,
    boolean isExternal,
    String requiredRole,
    String requiredPermission,
    boolean visible,
    int displayOrder
) {}
```

> PATCH 지만 **부분 업데이트가 아닌 전체 필드 갱신** (code 제외). 프론트가 항상 현재 전체 값을 보내므로 단순화.
> 실제 서비스: `Menu.update(...)` 에 모든 필드 다시 세팅.

---

## 서비스 검증 규칙 (실제)

```java
// create
if (existsByCode(req.code())) throw MENU_CODE_DUPLICATE;
Menu parent = resolveParent(req.parentId());   // parentId != null 인데 없으면 MENU_PARENT_NOT_FOUND

// update
Menu menu = getById(id);                        // 없으면 MENU_NOT_FOUND
Menu parent = resolveParent(req.parentId());
menu.update(parent, ...);                       // 11개 필드 전체 갱신

// delete
Menu menu = getById(id);
menuRepository.delete(menu);                    // 자식 있으면 DB FK 위반 → 500 대신 적절 에러 필요 (TODO)
```

### 미구현 검증 (향후 필요)

| 검증 | 필요 시점 |
|------|-----------|
| 순환 참조 (`parentId` 가 자신 또는 후손) | 부모 자유 선택 UI 추가 시 |
| `parentId == id` 자기 자신 금지 | 동일 |
| 삭제 시 자식 존재 선제 체크 | 현재는 FK 예외를 그대로 500 으로 올리고 UI 측 `confirm` 으로 우회 |

---

## 순서 변경 — Reorder 는 어떻게 처리되는가

전용 엔드포인트 없음. **프론트가 형제들의 새 `displayOrder` 를 계산해 `PATCH /api/menus/{id}` × N 을 `Promise.all` 로 동시 발행**.

```ts
// MenuTreeTab.tsx (요약)
const reordered = arrayMove(siblings, oldIdx, newIdx).map((m, i) => ({
  ...m, displayOrder: i,
}));
Promise.all(reordered.map(m => menuApi.update(m.id, toUpdateBody(m))));
```

### 이 방식의 장단점

| 장점 | 단점 |
|------|------|
| 별도 DTO/엔드포인트 불필요 | N 개 트랜잭션으로 쪼개짐 — 중간 실패 시 일부만 저장됨 |
| 한 개 필드 수정할 때와 동일 API 재사용 | 네트워크 왕복 N 회 (메뉴 수 적어 현재는 문제 없음) |
| 프론트가 전체 상태 관리 | 대용량으로 갈 수 없음 |

> 메뉴 수가 많아지면 `PATCH /api/menus/reorder` 추가를 고려한다.

---

## 에러 응답 포맷

공통 `ErrorResponse` 사용. 현재 정의된 메뉴 관련 코드:

| 상황 | HTTP | code |
|------|:----:|------|
| 존재하지 않음 | 404 | `MENU_001` `MENU_NOT_FOUND` |
| `code` 중복 | 409 | `MENU_002` `MENU_CODE_DUPLICATE` |
| `parentId` 가 존재하지 않음 | 404 | `MENU_003` `MENU_PARENT_NOT_FOUND` |
| ADMIN 아님 | 403 | 공통 `FORBIDDEN` |
| 미인증 | 401 | 공통 `UNAUTHORIZED` |

---

## 권한 가드

- `@PreAuthorize("hasRole('ADMIN')")` — 메서드별로 명시적으로 붙임.
- `@EnableMethodSecurity` 가 SecurityConfig 에 켜져 있음.
- `/api/menus` 의 GET 만 `permitAll`, 나머지는 기본 `authenticated` 상태에서 PreAuthorize 로 ADMIN 체크.

---

## 결정 로그 (계획 대비 변경점)

| 계획 | 실제 | 이유 |
|------|------|------|
| `/api/admin/menus/**` 경로 분리 | `/api/menus` 단일 + 메서드 가드 | 같은 리소스면 같은 path. ADMIN 체크는 메서드 단위가 더 명시적 |
| `PATCH /{id}/parent` 분리 | 일반 PATCH 에 포함 | 호출 지점 없음 |
| `PATCH /reorder` 분리 | 개별 PATCH × N | 메뉴 수 ≤ 수십 건, 네트워크 비용 낮음 |
| `MenuAdminController` 별도 | 단일 `MenuController` | 컨트롤러 쪼갤 만큼 메서드 많지 않음 |
| DTO `@Valid` + @NotBlank 등 | 동일 적용 | — |
| 순환 참조 도메인 메서드 `changeParent()` | 미구현 | 현재 UI 가 부모를 루트만 선택 가능 → 순환 불가 |
