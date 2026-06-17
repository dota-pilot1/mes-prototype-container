# 스텝 0: 유저 관리 + 롤 관리 기본 CRUD

> 모든 후속 단계의 토대. **유저 CRUD + 롤 CRUD** 백엔드·프론트 완성.
> 권한(Permission) 제어는 스텝 1~2에서 추가.

---

## 구현 현황 (2026-04-21)

| 대상 | Create | Read(목록) | Update | Delete |
|------|:------:|:----------:|:------:|:------:|
| **유저** | ✅ 관리자생성 + 회원가입 | ✅ 페이지네이션 | ✅ 프로필/롤/활성 | ✅ |
| **롤** | ✅ | ✅ | ✅ name/description | ✅ 시스템/사용중 차단 |

---

## 백엔드 완료 내역

### 유저 API
- `POST /api/auth/signup` — 회원가입 (공개)
- `GET /api/users` — 목록 (페이지네이션)
- `GET /api/users/{id}` — 상세
- `POST /api/users` — 관리자 생성 (email, password, username, roleId)
- `PATCH /api/users/{id}` — 프로필 수정 (email, username)
- `PATCH /api/users/{id}/role` — 롤 변경
- `PATCH /api/users/{id}/active` — 활성/비활성 토글
- `DELETE /api/users/{id}` — 삭제 (refresh token 정리 포함)

### 롤 API
- `GET /api/roles` — 목록
- `GET /api/roles/{id}` — 상세
- `POST /api/roles` — 등록 (`^ROLE_[A-Z][A-Z0-9_]*$` 검증, code 중복 차단)
- `PATCH /api/roles/{id}` — name/description 수정 (systemRole 차단)
- `DELETE /api/roles/{id}` — 시스템 롤/사용 중 롤 차단

### 기본 시드 롤
| code | name | systemRole |
|------|------|:----------:|
| ROLE_USER | 기본 사용자 | ✅ |
| ROLE_MANAGER | 중간 관리자 | ✅ |
| ROLE_ADMIN | 시스템 관리자 | ✅ |

---

## 프론트엔드 완료 내역

- `/users` 페이지: 목록 테이블, 롤 변경 다이얼로그, 활성 토글
- `/roles` 페이지: 목록 테이블, 등록/수정/삭제 다이얼로그
- `RoleBadge` — 롤 코드별 색상 배지
- Header — 관리 드롭다운 (유저관리/롤관리)

## 프론트엔드 완성 항목

- [x] `/users` — CreateUserDialog (관리자 유저 등록) 추가
- [x] `/users` — Delete 액션 추가 (ConfirmDialog)
- [x] `userApi.ts` — `create()`, `delete()` 추가

---

## 에러 코드

| 코드 | 상태 | 설명 |
|------|------|------|
| USER_NOT_FOUND | 404 | |
| DUPLICATE_EMAIL | 409 | |
| ROLE_NOT_FOUND | 404 | |
| ROLE_CODE_DUPLICATE | 409 | |
| ROLE_SYSTEM_READONLY | 400 | 시스템 롤 수정/삭제 차단 |
| ROLE_IN_USE | 409 | 사용 중 롤 삭제 차단 |

---

## 다음 스텝

→ **스텝 1**: Permission 엔티티 도입 + Role-Permission CRUD
