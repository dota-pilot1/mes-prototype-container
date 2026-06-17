# 스텝 1: Permission 엔티티 도입 + CRUD (완료)

> 롤 코드만으로는 "이 롤이 무엇을 할 수 있는지" 알 수 없다.
> **PermissionCategory** 테이블로 카테고리를 DB화하고,
> **Permission** 엔티티가 그 카테고리를 FK로 참조하게 한다.
> 롤-권한 M:N 매핑 UI는 스텝 2에서 완성한다.

---

## 구현 현황 (2026-04-22)

| 항목 | 상태 |
|------|:----:|
| PermissionCategory 엔티티 + JPA Repository | ✅ |
| PermissionCategoryService (CRUD) | ✅ |
| PermissionCategoryController (`/api/permission-categories`) | ✅ |
| PermissionCategorySeeder @Order(1) — 기본 6종 시드 | ✅ |
| Permission 엔티티 category 컬럼 → category_id FK 마이그레이션 | ✅ |
| Permission 엔티티 + JPA Repository | ✅ |
| PermissionService (CRUD, categoryCode → FK 해석) | ✅ |
| PermissionController (`/api/permissions`) | ✅ |
| PermissionSeeder @Order(3) — 기존 rows category FK 업데이트 포함 | ✅ |
| 프론트 `/permission-categories` 페이지 + PermissionCategoryTable | ✅ |
| 프론트 PermissionCategoryFormDialog (등록/수정) | ✅ |
| 프론트 `/permissions` 페이지 + PermissionTable (카테고리별 그룹) | ✅ |
| 프론트 PermissionFormDialog (카테고리 동적 로드) | ✅ |
| 헤더 관리 드롭다운에 "권한 카테고리" / "권한 관리" 링크 추가 | ✅ |
| Role-Permission M:N 매핑 UI (RolePermissionDialog) | ⬜ → 스텝 2 |
| 실제 접근 제어 (`@PreAuthorize`, RequireRole) | ⬜ → 스텝 2 |

> **현재 정책**: 접근 제어는 일단 비활성. 로그인된 유저라면 누구나 관리 페이지 접근 가능.

---

## 데이터 모델

```
permission_categories
  id            BIGINT PK
  code          VARCHAR(40) UNIQUE   예) USER, ROLE, PERMISSION
  name          VARCHAR(80)          예) "사용자 관리"
  description   VARCHAR(255)
  display_order INT                  카테고리 정렬 순서
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

permissions
  id            BIGINT PK
  code          VARCHAR(80) UNIQUE   예) USER_VIEW, ROLE_EDIT
  name          VARCHAR(80)          예) "사용자 조회"
  description   VARCHAR(255)
  category_id   BIGINT FK → permission_categories.id   ← 이전: category VARCHAR
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

role_permissions (join table — API 있음, 매핑 UI는 스텝 2)
  role_id        BIGINT FK → roles.id
  permission_id  BIGINT FK → permissions.id
  PK (role_id, permission_id)
```

> `ddl-auto: update` 로 Hibernate가 `category_id` 컬럼을 자동 추가.
> PermissionSeeder가 기존 rows의 category FK를 `ifPresentOrElse`로 보정.

---

## 시더 실행 순서

| 순서 | 클래스 | @Order | 역할 |
|------|--------|--------|------|
| 1 | PermissionCategorySeeder | 1 | permission_categories 기본 6종 삽입 |
| 2 | RoleSeeder | 2 | 기본 롤 삽입 |
| 3 | PermissionSeeder | 3 | permissions 삽입 + category FK 연결 |

---

## 기본 시드: PermissionCategory

| code | name | displayOrder |
|------|------|:------------:|
| USER | 사용자 관리 | 1 |
| ROLE | 롤 관리 | 2 |
| PERMISSION | 권한 관리 | 3 |
| DASHBOARD | 대시보드 | 4 |
| REPORT | 리포트 | 5 |
| SYSTEM | 시스템 | 6 |

---

## 기본 시드: Permission

| code | name | categoryCode |
|------|------|-------------|
| USER_VIEW | 사용자 조회 | USER |
| USER_EDIT | 사용자 수정 | USER |
| USER_DELETE | 사용자 삭제 | USER |
| ROLE_VIEW | 롤 조회 | ROLE |
| ROLE_EDIT | 롤 수정/등록 | ROLE |
| ROLE_DELETE | 롤 삭제 | ROLE |
| PERMISSION_VIEW | 권한 조회 | PERMISSION |
| PERMISSION_EDIT | 권한 수정/등록 | PERMISSION |
| PERMISSION_DELETE | 권한 삭제 | PERMISSION |

---

## PermissionCategory API

| 메서드 | URL | 설명 | 인증 |
|--------|-----|------|------|
| GET | `/api/permission-categories` | 전체 목록 (displayOrder 정렬) | 로그인 |
| GET | `/api/permission-categories/{id}` | 상세 | 로그인 |
| POST | `/api/permission-categories` | 등록 (code 불변) | 로그인 |
| PATCH | `/api/permission-categories/{id}` | 수정 (name, description) | 로그인 |
| DELETE | `/api/permission-categories/{id}` | 삭제 (권한 참조 중이면 409) | 로그인 |

> 스텝 2에서 `ROLE_ADMIN` 전용으로 강화 예정

---

## Permission API

| 메서드 | URL | 설명 | 인증 |
|--------|-----|------|------|
| GET | `/api/permissions` | 전체 목록 (category 필터) | 로그인 |
| GET | `/api/permissions/{id}` | 상세 | 로그인 |
| POST | `/api/permissions` | 등록 (`categoryCode` 필드로 FK 해석) | 로그인 |
| PATCH | `/api/permissions/{id}` | 수정 (name, description, categoryCode) | 로그인 |
| DELETE | `/api/permissions/{id}` | 삭제 | 로그인 |

> 스텝 2에서 `ROLE_ADMIN` 전용으로 강화 예정

---

## Role-Permission API (RoleController — 이미 구현됨)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/roles/{id}/permissions` | 롤에 할당된 권한 목록 |
| PUT | `/api/roles/{id}/permissions` | 롤 권한 일괄 교체 (permissionIds[]) |

> API는 있으나 프론트 UI(RolePermissionDialog)는 스텝 2에서 구현

---

## 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| PERMISSION_NOT_FOUND | 404 | |
| PERMISSION_CODE_DUPLICATE | 409 | |
| PCAT_001 PERMISSION_CATEGORY_NOT_FOUND | 404 | |
| PCAT_002 PERMISSION_CATEGORY_CODE_DUPLICATE | 409 | |
| PCAT_003 PERMISSION_CATEGORY_IN_USE | 409 | 해당 카테고리를 참조 중인 권한이 있어 삭제 불가 |

---

## 프론트 구조 (FSD)

```
src/
  entities/
    permission-category/
      model/types.ts          ← PermissionCategorySummary, PermissionCategory
      api/permissionCategoryApi.ts
    permission/
      model/types.ts          ← category: PermissionCategorySummary (FK 반영)
      api/permissionApi.ts    ← CreatePermissionBody.categoryCode
  features/
    permission-management/
      PermissionCategoryTable.tsx
      PermissionCategoryFormDialog.tsx
      PermissionTable.tsx     ← p.category.code 로 그룹핑
      PermissionFormDialog.tsx ← 카테고리 목록 동적 로드
  app/
    permission-categories/page.tsx
    permissions/page.tsx
```

---

## 다음 스텝

→ **스텝 2**: Role-Permission 매핑 UI + 실제 접근 제어
