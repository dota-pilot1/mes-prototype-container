# 3. RefreshToken 엔티티 + 리포지토리

## 목표
사용자별 refresh token 1개를 DB 에 보관. 재로그인 시 덮어쓰기, 로그아웃 시 삭제. 토큰 회전도 이 테이블로 구현.

## 파일
```
com.cj.twilio.callcenter.auth
├─ domain
│  └─ RefreshToken.java
└─ infrastructure
   └─ RefreshTokenRepository.java
```

### `auth/domain/RefreshToken.java`
- 테이블명: `refresh_tokens`
- 필드:
  | 필드 | 타입 | 제약 |
  | --- | --- | --- |
  | `id` | `Long` | `@Id @GeneratedValue(IDENTITY)` |
  | `userId` | `Long` | `unique=true, nullable=false` |
  | `token` | `String` | `nullable=false, length=500` |
  | `expiresAt` | `Instant` | `nullable=false` |
  | `createdAt` | `Instant` | `@CreationTimestamp` |

- 팩토리: `RefreshToken.create(Long userId, String token, Instant expiresAt)`
- 도메인 메서드: `boolean isExpired()`, `void rotate(String newToken, Instant newExpiresAt)`

```java
package com.cj.twilio.callcenter.auth.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 500)
    private String token;

    @Column(nullable = false)
    private Instant expiresAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public static RefreshToken create(Long userId, String token, Instant expiresAt) {
        RefreshToken rt = new RefreshToken();
        rt.userId = userId;
        rt.token = token;
        rt.expiresAt = expiresAt;
        return rt;
    }

    public boolean isExpired() { return Instant.now().isAfter(expiresAt); }

    public void rotate(String newToken, Instant newExpiresAt) {
        this.token = newToken;
        this.expiresAt = newExpiresAt;
    }
}
```

### `auth/infrastructure/RefreshTokenRepository.java`
```java
package com.cj.twilio.callcenter.auth.infrastructure;

import com.cj.twilio.callcenter.auth.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByUserId(Long userId);
    Optional<RefreshToken> findByToken(String token);
    void deleteByUserId(Long userId);
}
```

## 저장 정책
- **1 user = 1 row** (userId unique 제약). 재로그인 시 기존 row 에 `rotate()` 호출.
- 토큰 회전 시: 같은 row 의 `token`, `expiresAt` 갱신. row 개수는 변하지 않음.
- 로그아웃 시: `deleteByUserId(userId)`.
- 만료 정리: 별도 스케줄러 고려 가능 (기본 스코프에서는 생략). `isExpired()` 는 사용 시점 체크로 충분.

## 검증
- 기동 후 `docker exec ... psql ... \d refresh_tokens` 로 스키마 확인
- 인덱스: `user_id` unique, `token` 은 lookup 용 인덱스 자동 생성 안 됨 → 필요하면 `@Index` 추가
  ```java
  @Table(name="refresh_tokens", indexes = @Index(columnList = "token"))
  ```

## 대안 고려 (지금은 안 함)
- Redis 에 TTL 로 저장: DB I/O 줄일 수 있지만 인프라 추가
- In-memory (ConcurrentHashMap): 재기동 시 모든 세션 날아감 → 개발 편의성 / UX 안 맞음
- 저장 안 함(stateless refresh): 로그아웃이 사실상 불가능 → 기각
