# 2. JwtTokenProvider + build.gradle 의존성

## 목표
토큰 생성/검증을 전담하는 단일 컴포넌트. 이후 필터/서비스는 이걸 호출하기만.

## build.gradle 추가
```gradle
dependencies {
    // ... 기존 ...
    implementation 'io.jsonwebtoken:jjwt-api:0.12.6'
    runtimeOnly  'io.jsonwebtoken:jjwt-impl:0.12.6'
    runtimeOnly  'io.jsonwebtoken:jjwt-jackson:0.12.6'
}
```

## 파일
```
com.cj.twilio.callcenter.auth
├─ jwt
│  ├─ JwtTokenProvider.java
│  ├─ JwtProperties.java       // @ConfigurationProperties
│  └─ TokenType.java
```

### `auth/jwt/TokenType.java`
```java
package com.cj.twilio.callcenter.auth.jwt;

public enum TokenType { ACCESS, REFRESH }
```

### `auth/jwt/JwtProperties.java`
```java
package com.cj.twilio.callcenter.auth.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
    String secret,
    long accessTokenExpirationMs,
    long refreshTokenExpirationMs,
    String issuer
) {}
```
> `TwilioCallcenterServerApplication` 에 `@ConfigurationPropertiesScan` 추가 필요.

### `auth/jwt/JwtTokenProvider.java`
핵심 스펙:
- 생성자에서 `SecretKey` 1회 생성 후 재사용 (매번 `Keys.hmacShaKeyFor` 호출 낭비 방지)
- `generateAccessToken(Long userId, String email, UserRole role)` → JWT 문자열
- `generateRefreshToken(Long userId)` → JWT 문자열
- `parse(String token)` → `Jws<Claims>` (서명 검증 포함)
- `getUserId(Claims)`, `getEmail(Claims)`, `getRole(Claims)`, `getType(Claims)`

```java
package com.cj.twilio.callcenter.auth.jwt;

import com.cj.twilio.callcenter.user.domain.UserRole;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final JwtProperties props;
    private final SecretKey key;

    public JwtTokenProvider(JwtProperties props) {
        this.props = props;
        if (props.secret() == null || props.secret().getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("jwt.secret must be at least 32 bytes");
        }
        this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId, String email, UserRole role) {
        Date now = new Date();
        return Jwts.builder()
            .issuer(props.issuer())
            .subject(String.valueOf(userId))
            .claim("email", email)
            .claim("role", role.name())
            .claim("type", TokenType.ACCESS.name())
            .issuedAt(now)
            .expiration(new Date(now.getTime() + props.accessTokenExpirationMs()))
            .signWith(key, Jwts.SIG.HS256)
            .compact();
    }

    public String generateRefreshToken(Long userId) {
        Date now = new Date();
        return Jwts.builder()
            .issuer(props.issuer())
            .subject(String.valueOf(userId))
            .claim("type", TokenType.REFRESH.name())
            .issuedAt(now)
            .expiration(new Date(now.getTime() + props.refreshTokenExpirationMs()))
            .signWith(key, Jwts.SIG.HS256)
            .compact();
    }

    public Jws<Claims> parse(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .requireIssuer(props.issuer())
            .build()
            .parseSignedClaims(token);
    }

    public Long getUserId(Claims c) { return Long.parseLong(c.getSubject()); }
    public String getEmail(Claims c) { return c.get("email", String.class); }
    public String getRole(Claims c) { return c.get("role", String.class); }
    public TokenType getType(Claims c) { return TokenType.valueOf(c.get("type", String.class)); }

    public long refreshTokenExpirationMs() { return props.refreshTokenExpirationMs(); }
}
```

## 예외 매핑 (GlobalExceptionHandler 에 추가)
JJWT 파싱 실패 시 아래 예외들 나옴 — 전부 **401** 로 매핑:

| 예외 | 의미 |
| --- | --- |
| `ExpiredJwtException` | 만료 |
| `SecurityException` / `SignatureException` | 서명 불일치 |
| `MalformedJwtException` | 형식 오류 |
| `UnsupportedJwtException` | 지원하지 않는 형식 |
| `IllegalArgumentException` | 빈 토큰 등 |

`ErrorCode.INVALID_CREDENTIALS` 재사용 or 새 `INVALID_TOKEN(401, "AUTH_005", "유효하지 않은 토큰입니다.")` 추가 권장.

## 검증
단위 테스트 권장 (기본 스코프 밖이지만):
- 생성 → parse 왕복
- 만료 토큰 parse → `ExpiredJwtException`
- 다른 시크릿으로 parse → `SignatureException`

실행 테스트는 06 단계(컨트롤러) 이후 통합으로.
