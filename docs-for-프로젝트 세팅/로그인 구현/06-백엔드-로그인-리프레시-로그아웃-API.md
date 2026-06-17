# 6. 로그인 · 리프레시 · 로그아웃 · 내정보 API

## 목표
`AuthController` 에 네 엔드포인트 추가. `AuthService` 에 로직. 토큰 회전(refresh rotation) 구현.

## 엔드포인트 스펙

| Method | Path | 인증 | Body/Query | 성공 | 실패 |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | X | `LoginRequest{email,password}` | 200 + `TokenResponse` | 401(AUTH_003) |
| POST | `/api/auth/refresh` | X | `RefreshRequest{refreshToken}` | 200 + `TokenResponse` | 401(AUTH_006) |
| POST | `/api/auth/logout` | ✅ | — | 204 | 401 |
| GET  | `/api/auth/me` | ✅ | — | 200 + `UserResponse` | 401 |

## DTO 추가
`user/presentation/dto/`:
```java
public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}

public record RefreshRequest(@NotBlank String refreshToken) {}

public record TokenResponse(
    String accessToken,
    String refreshToken,
    long accessTokenExpiresInSec,
    UserSummary user
) {}

public record UserSummary(Long id, String email, String username, String role) {
    public static UserSummary from(User u) { ... }
}

public record UserResponse(Long id, String email, String username, String role) {
    // /api/auth/me 응답
}
```

## `ErrorCode` 추가
```java
INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_006", "유효하지 않은 리프레시 토큰입니다."),
INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_005", "유효하지 않은 토큰입니다."),
```
대응 예외:
- `InvalidRefreshTokenException extends BusinessException`

## AuthService 추가

```java
// 기존 필드에 더해:
private final AuthenticationManager authenticationManager;
private final JwtTokenProvider jwtTokenProvider;
private final RefreshTokenRepository refreshTokenRepository;

@Transactional
public TokenResponse login(LoginRequest req) {
    Authentication auth;
    try {
        auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.email(), req.password())
        );
    } catch (AuthenticationException e) {
        throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }
    UserPrincipal p = (UserPrincipal) auth.getPrincipal();
    if (!p.isActive()) throw new BusinessException(ErrorCode.ACCOUNT_INACTIVE);
    return issueTokens(p);
}

@Transactional
public TokenResponse refresh(RefreshRequest req) {
    Claims claims;
    try {
        claims = jwtTokenProvider.parse(req.refreshToken()).getPayload();
    } catch (JwtException | IllegalArgumentException e) {
        throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
    }
    if (jwtTokenProvider.getType(claims) != TokenType.REFRESH) {
        throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
    }
    Long userId = jwtTokenProvider.getUserId(claims);

    RefreshToken saved = refreshTokenRepository.findByUserId(userId)
        .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));
    if (!saved.getToken().equals(req.refreshToken()) || saved.isExpired()) {
        // 토큰 재사용 공격 감지 시 전부 무효화
        refreshTokenRepository.deleteByUserId(userId);
        throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
    }

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    if (!user.isActive()) throw new BusinessException(ErrorCode.ACCOUNT_INACTIVE);

    return issueTokens(UserPrincipal.fromEntity(user));
}

@Transactional
public void logout(Long userId) {
    refreshTokenRepository.deleteByUserId(userId);
}

private TokenResponse issueTokens(UserPrincipal p) {
    String access = jwtTokenProvider.generateAccessToken(p.getId(), p.getEmail(), p.getRole());
    String refresh = jwtTokenProvider.generateRefreshToken(p.getId());
    Instant expiresAt = Instant.now().plusMillis(jwtTokenProvider.refreshTokenExpirationMs());

    // upsert: 있으면 rotate, 없으면 create
    refreshTokenRepository.findByUserId(p.getId())
        .ifPresentOrElse(
            rt -> rt.rotate(refresh, expiresAt),
            () -> refreshTokenRepository.save(RefreshToken.create(p.getId(), refresh, expiresAt))
        );

    long expiresInSec = jwtTokenProvider.accessTokenExpirationMsForResponse() / 1000;
    return new TokenResponse(access, refresh, expiresInSec, UserSummary.from(/* user */));
}
```

> `accessTokenExpirationMsForResponse()` 는 JwtTokenProvider 에 getter 추가 필요.

## AuthController 추가

```java
@PostMapping("/login")
public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest req) {
    return ResponseEntity.ok(authService.login(req));
}

@PostMapping("/refresh")
public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest req) {
    return ResponseEntity.ok(authService.refresh(req));
}

@PostMapping("/logout")
public ResponseEntity<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
    authService.logout(principal.getId());
    return ResponseEntity.noContent().build();
}

@GetMapping("/me")
public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(new UserResponse(
        principal.getId(), principal.getEmail(), principal.getUsername(), principal.getRole().name()
    ));
}
```

> `/me` 는 토큰 클레임만으로 응답. DB 조회 없어 빠름. `username` 은 클레임에 없으므로 `/me` 에 필요하면 토큰 클레임에 추가하거나 DB 조회.
> **권장**: `username` 도 access token 클레임에 포함 → `/me` DB 조회 피함. (JwtTokenProvider `generateAccessToken` 시그니처에 username 추가)

## 검증
```bash
# 로그인
curl -i -X POST http://localhost:4101/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Alice123!@"}'
# → 200 + {accessToken, refreshToken, accessTokenExpiresInSec, user}

# me (성공)
ACCESS='eyJ...'
curl -i http://localhost:4101/api/auth/me -H "Authorization: Bearer $ACCESS"
# → 200 + user json

# 잘못된 비번 → 401 AUTH_003
curl -i -X POST http://localhost:4101/api/auth/login \
  -H 'Content-Type: application/json' -d '{"email":"alice@example.com","password":"wrong"}'

# refresh
REFRESH='eyJ...'
curl -i -X POST http://localhost:4101/api/auth/refresh \
  -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$REFRESH\"}"
# → 200 + new tokens (이전 refresh 는 DB 에서 회전됨)

# 이전 refresh 재사용 → 401 AUTH_006 (회전되어 DB 와 불일치)
curl -i -X POST http://localhost:4101/api/auth/refresh \
  -H 'Content-Type: application/json' -d "{\"refreshToken\":\"$REFRESH\"}"

# 로그아웃
curl -i -X POST http://localhost:4101/api/auth/logout -H "Authorization: Bearer $ACCESS"
# → 204

# 로그아웃 후 refresh 시도 → 401
```

## 주의
- `logout` 은 **access 토큰 기반 인증**으로 호출. access 가 만료됐으면 프론트에서 토큰을 그냥 버리면 충분 (클라이언트 측 로그아웃).
- 회전 시 트랜잭션 실패하면 새 토큰은 리턴됐는데 DB 는 이전 상태 → 경쟁 조건 고려. `@Transactional` 걸려있으니 문제 없음.
- Twilio 같은 외부 서비스에서 JWT 로 콜백 서명 검증하려면 별도 시크릿/알고리즘 분리 권장 (지금은 해당 없음).
