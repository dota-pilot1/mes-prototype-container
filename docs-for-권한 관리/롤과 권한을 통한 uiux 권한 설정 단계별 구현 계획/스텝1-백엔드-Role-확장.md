# 스텝 1: Permission 엔티티 도입 + Role-Permission CRUD

> 롤 코드만으로는 "이 롤이 무엇을 할 수 있는지" 알 수 없다.
> **Permission 엔티티**를 도입해 권한을 테이블로 관리하고,
> 롤에 권한을 M:N으로 할당한다.
> 관리 페이지에서 권한 이름·설명을 CRUD할 수 있다.

---

## 데이터 모델

```
permissions
  id          BIGINT PK
  code        VARCHAR(80) UNIQUE  예) USER_VIEW, ROLE_EDIT
  name        VARCHAR(80)         예) "사용자 조회"
  description VARCHAR(255)        예) "유저 목록/상세 페이지 접근"
  category    VARCHAR(40)         예) USER, ROLE, PERMISSION
  created_at  TIMESTAMP
  updated_at  TIMESTAMP

role_permissions (join table)
  role_id        BIGINT FK → roles.id
  permission_id  BIGINT FK → permissions.id
  PK (role_id, permission_id)
```

---

## 기본 시드 권한 (PermissionSeeder)

| code | name | category |
|------|------|---------|
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

## 백엔드 구현

### 신규 파일

| 파일 | 역할 |
|------|------|
| `permission/domain/Permission.java` | 엔티티 |
| `permission/infrastructure/PermissionRepository.java` | JPA Repository |
| `permission/application/PermissionService.java` | CRUD 서비스 |
| `permission/presentation/PermissionController.java` | REST 컨트롤러 |
| `permission/presentation/dto/*.java` | 요청/응답 DTO |
| `config/PermissionSeeder.java` | 기본 권한 시드 |

### Permission API

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/permissions` | 전체 목록 (category 필터 가능) |
| GET | `/api/permissions/{id}` | 상세 |
| POST | `/api/permissions` | 등록 |
| PATCH | `/api/permissions/{id}` | 수정 (name, description, category) |
| DELETE | `/api/permissions/{id}` | 삭제 |

### Role-Permission API (RoleController 확장)

| 메서드 | URL | 설명 |
|--------|-----|------|
| GET | `/api/roles/{id}/permissions` | 롤에 할당된 권한 목록 |
| PUT | `/api/roles/{id}/permissions` | 롤 권한 일괄 교체 (permissionIds[]) |

### Role 엔티티 확장

```java
@ManyToMany(fetch = FetchType.LAZY)
@JoinTable(
  name = "role_permissions",
  joinColumns = @JoinColumn(name = "role_id"),
  inverseJoinColumns = @JoinColumn(name = "permission_id")
)
private Set<Permission> permissions = new HashSet<>();
```

### RoleResponse 확장

```java
// 기존 필드 + 추가
List<PermissionSummary> permissions;  // 롤 상세 조회 시 포함
```

### 에러 코드 추가

| 코드 | 상태 | 설명 |
|------|------|------|
| PERMISSION_NOT_FOUND | 404 | |
| PERMISSION_CODE_DUPLICATE | 409 | |

---

## 프론트엔드 구현

### 신규 파일

| 파일 | 역할 |
|------|------|
| `entities/permission/model/types.ts` | Permission 타입 |
| `entities/permission/api/permissionApi.ts` | API 호출 함수 |
| `features/permission-management/PermissionTable.tsx` | 권한 목록 테이블 |
| `features/permission-management/PermissionFormDialog.tsx` | 등록/수정 다이얼로그 |
| `features/role-management/RolePermissionDialog.tsx` | 롤별 권한 할당 다이얼로그 |
| `app/permissions/page.tsx` | /permissions 페이지 |

### 기존 수정

- `entities/user/api/roleApi.ts` — `getPermissions(id)`, `setPermissions(id, ids)` 추가
- `entities/user/model/types.ts` — `Role`에 `permissions?: PermissionSummary[]` 추가
- `features/role-management/RoleTable.tsx` — [권한 설정] 버튼 추가 → RolePermissionDialog
- `widgets/header/ui/Header.tsx` — AdminDropdown에 "권한 관리" 링크 추가

---

## 완료 기준

- [ ] `GET /api/permissions` 목록 정상 반환
- [ ] Permission CRUD API 모두 동작
- [ ] `PUT /api/roles/{id}/permissions` 권한 일괄 할당 동작
- [ ] `/permissions` 페이지에서 권한 등록/수정/삭제 가능
- [ ] 롤 목록 [권한 설정] 버튼 → 체크박스로 권한 선택 후 저장

---

## 다음 스텝

→ **스텝 2**: 실제 접근 제어 — 백엔드 @PreAuthorize + 프론트 RequireRole 가드
