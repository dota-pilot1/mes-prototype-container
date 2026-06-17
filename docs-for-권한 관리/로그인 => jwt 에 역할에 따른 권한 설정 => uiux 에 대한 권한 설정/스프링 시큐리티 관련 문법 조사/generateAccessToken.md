# JWT에 권한 정보를 포함시키는 전체 프로세스

---

## 전체 흐름 (로그인 → API 요청까지)

```
[로그인 요청]
      ↓
AuthService.login()
  → AuthService.issueTokens(user)
      → user.getRole().getPermissions() 로 권한 목록 조회
      → JwtTokenProvider.generateAccessToken(..., permCodes)
          → JWT payload에 "permissions": ["USER_VIEW", ...] 포함
      → JWT 문자열 반환

[이후 API 요청]
      ↓
JwtAuthenticationFilter.doFilterInternal()
  → JWT 파싱 → claims에서 permissions 추출
  → UserPrincipal.fromClaims(..., permissions)
      → getAuthorities() = [ROLE_ADMIN, USER_VIEW, USER_EDIT, ...]
  → SecurityContext에 등록

[컨트롤러 도달]
      ↓
@PreAuthorize("hasAuthority('USER_VIEW')") 체크
  → SecurityContext의 authorities에 "USER_VIEW" 있으면 통과
  → 없으면 403
```

---

## 지금 어디까지 되어 있나?

| 단계 | 현재 상태 |
|------|-----------|
| **AuthService.issueTokens()** | `generateAccessToken(userId, email, username, roleCode)` — roleCode만 전달, permissions 없음 |
| **JwtTokenProvider.generateAccessToken()** | `"role"` 클레임만 있음, `"permissions"` 클레임 없음 |
| **JwtAuthenticationFilter** | JWT에서 role만 파싱, permissions 파싱 코드 없음 |
| **UserPrincipal.getAuthorities()** | role 하나만 반환 |
| **@PreAuthorize** | `hasRole('ADMIN')` — role 기반, permission 기반 아님 |

즉 **전체 파이프라인 중 아무것도 안 되어 있는 상태**.  
Step 1~4를 순서대로 구현해야 한다.

---

## 맞는 방향인가? → YES, 이게 정석

### Step 1 — AuthService: permissions 조회 후 generateAccessToken에 전달

```java
private TokenResponse issueTokens(User user) {
    // ← 추가: role에 매핑된 permission 코드 목록 조회
    List<String> permCodes = user.getRole().getPermissions()
        .stream().map(Permission::getCode).toList();

    // ← 변경: permCodes 파라미터 추가
    String access = jwtTokenProvider.generateAccessToken(
        user.getId(), user.getEmail(), user.getUsername(),
        user.getRole().getCode(),
        permCodes
    );
    // ... 이하 동일
}
```

### Step 2 — JwtTokenProvider: permissions 클레임 추가 + 파싱 메서드 추가

```java
// 시그니처 변경
public String generateAccessToken(
    Long userId, String email, String username,
    String roleCode, List<String> permissions   // ← 추가
) {
    return Jwts.builder()
        ...
        .claim("role", roleCode)
        .claim("permissions", permissions)       // ← 추가
        .compact();
}

// 파싱 메서드 추가
@SuppressWarnings("unchecked")
public List<String> getPermissions(Claims c) {
    Object raw = c.get("permissions");
    if (raw instanceof List<?> list) return (List<String>) list;
    return List.of();
}
```

### Step 3 — JwtAuthenticationFilter: permissions 파싱 후 UserPrincipal에 전달

```java
// ← 추가: JWT에서 permissions 파싱
List<String> permissions = jwtTokenProvider.getPermissions(claims);

// ← 변경: permissions 파라미터 추가
UserPrincipal principal = UserPrincipal.fromClaims(
    jwtTokenProvider.getUserId(claims),
    jwtTokenProvider.getEmail(claims),
    jwtTokenProvider.getUsername(claims),
    jwtTokenProvider.getRole(claims),
    permissions   // ← 추가
);
```

### Step 4 — UserPrincipal: permissions 필드 추가 + getAuthorities() 변경

```java
private final List<String> permissions;   // ← 추가

// fromClaims() 시그니처 변경
public static UserPrincipal fromClaims(
    Long id, String email, String username, String roleCode,
    List<String> permissions   // ← 추가
) { ... }

// getAuthorities() — role + permissions 모두 반환
@Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    List<GrantedAuthority> authorities = new ArrayList<>();
    authorities.add(new SimpleGrantedAuthority(roleCode));
    permissions.forEach(p -> authorities.add(new SimpleGrantedAuthority(p)));
    return authorities;
}
```

---

## Step 1~4 완료 후 달라지는 것

**JWT payload** (Before → After):
```json
// Before
{ "role": "ROLE_ADMIN" }

// After
{
  "role": "ROLE_ADMIN",
  "permissions": ["USER_VIEW", "USER_EDIT", "USER_DELETE", "ROLE_VIEW", "ROLE_EDIT"]
}
```

**@PreAuthorize** 변경 가능:
```java
// Before (role 단위)
@PreAuthorize("hasRole('ADMIN')")

// After (permission 단위 — 더 세밀)
@PreAuthorize("hasAuthority('USER_VIEW')")
@PreAuthorize("hasAuthority('USER_DELETE')")
```
