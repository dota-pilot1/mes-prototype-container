# 스텝 3: 관리자 유저 관리 UI

> ADMIN이 유저 목록을 보고 role 변경 / 활성화 비활성화를 할 수 있는 관리 페이지

---

## 백엔드 추가 파일

### 1. `user/presentation/AdminUserController.java`

```
GET  /api/admin/users          유저 목록 (페이지네이션)
GET  /api/admin/users/{id}     유저 상세
PATCH /api/admin/users/{id}/role      롤 변경
PATCH /api/admin/users/{id}/status    활성/비활성 토글
```

### 2. `user/presentation/dto/UserDetailResponse.java`

```java
record UserDetailResponse(
    Long id,
    String email,
    String username,
    UserRole role,
    boolean active,
    Instant createdAt
) {}
```

### 3. `user/presentation/dto/UserPageResponse.java`

```java
record UserPageResponse(
    List<UserDetailResponse> content,
    int page,
    int size,
    long totalElements
) {}
```

---

## 프론트엔드 추가 파일

```
src/
  app/
    admin/
      users/
        page.tsx              유저 목록 테이블 페이지
  features/
    admin/
      user-management/
        UserTable.tsx         Shadcn Table 기반 유저 목록
        RoleChangeDialog.tsx  롤 변경 confirm 다이얼로그
        StatusToggle.tsx      활성/비활성 토글 버튼
  entities/
    user/
      api/
        adminApi.ts           관리자 전용 API 호출
```

---

## UI 구성

### 유저 목록 테이블 (`UserTable.tsx`)

| 이름 | 이메일 | 역할 | 상태 | 가입일 | 액션 |
|------|--------|------|------|--------|------|
| 홍길동 | hong@... | MANAGER | 활성 | 2024-01-01 | [롤 변경] [비활성화] |

- 역할 셀: 색상 뱃지 (ADMIN=red, MANAGER=orange, STYLIST=blue, CUSTOMER=gray)
- 페이지네이션: 10명씩

### 롤 변경 다이얼로그 (`RoleChangeDialog.tsx`)

- `<Select>` 드롭다운으로 새 롤 선택
- 확인 클릭 시 `PATCH /api/admin/users/{id}/role` 호출
- 성공 시 테이블 자동 갱신 (TanStack Query `invalidateQueries`)

---

## 완료 기준

- [ ] ADMIN 계정으로 `/admin/users` 접근 가능
- [ ] ADMIN 미만 계정으로 접근 시 `/unauthorized` 이동
- [ ] 유저 목록 페이지네이션 동작
- [ ] 롤 변경 후 테이블 즉시 반영
- [ ] 활성/비활성 토글 후 해당 유저 로그인 불가 확인
