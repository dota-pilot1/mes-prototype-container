# 4. UserPrincipal + CustomUserDetailsService

## 목표
Spring Security 의 `Authentication` 객체에 **userId / role** 을 담아 이후 컨트롤러에서 `@AuthenticationPrincipal` 로 꺼내 쓸 수 있게.

## 파일
```
com.cj.twilio.callcenter.auth
├─ security
│  ├─ UserPrincipal.java
│  └─ CustomUserDetailsService.java
```

### `auth/security/UserPrincipal.java`
```java
package com.cj.twilio.callcenter.auth.security;

import com.cj.twilio.callcenter.user.domain.User;
import com.cj.twilio.callcenter.user.domain.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;  // 로그인 검증 시에만 채워짐. 필터 경로에서는 null.
    private final UserRole role;
    private final boolean active;

    private UserPrincipal(Long id, String email, String passwordHash, UserRole role, boolean active) {
        this.id = id;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.active = active;
    }

    public static UserPrincipal fromEntity(User u) {
        return new UserPrincipal(u.getId(), u.getEmail(), u.getPasswordHash(), u.getRole(), u.isActive());
    }

    /** JWT 필터에서 DB 조회 없이 생성 */
    public static UserPrincipal fromClaims(Long id, String email, UserRole role) {
        return new UserPrincipal(id, email, null, role, true);
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return active; }
}
```

### `auth/security/CustomUserDetailsService.java`
> **용도**: 로그인 검증 경로(01/02/...가 아니라) 에서만 호출됨. JWT 필터는 여기 쓰지 않음 (DB 조회 피하기).

```java
package com.cj.twilio.callcenter.auth.security;

import com.cj.twilio.callcenter.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
            .map(UserPrincipal::fromEntity)
            .orElseThrow(() -> new UsernameNotFoundException("user not found: " + email));
    }
}
```

## 사용처 프리뷰
컨트롤러에서 인증된 유저 꺼내기:
```java
@GetMapping("/api/auth/me")
public ResponseEntity<UserResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
    return ResponseEntity.ok(new UserResponse(principal.getId(), principal.getEmail(), principal.getRole().name()));
}
```

## 설계 결정
| 결정 | 이유 |
| --- | --- |
| JWT 필터가 `loadUserByUsername` 을 **호출하지 않음** | 요청마다 DB hit 피함. 토큰 클레임만으로 `UserPrincipal` 조립 (`fromClaims`). 토큰이 검증된 상태면 유저 존재·활성 여부는 최대 30분(access TTL) 지연됨 — 허용 범위. |
| `passwordHash` 를 필드로 들고 있음 | `DaoAuthenticationProvider` 가 검증에 씀. 필터 경로에서는 `fromClaims` 가 null 세팅. |
| role 기반 authorities | 단순 1-role. 나중에 세분화되면 `Set<UserRole>` 또는 별도 permission 테이블. |

## 주의
- `fromClaims` 에서 `active=true` 를 강제로 넣는다. 비활성화된 유저가 이전 토큰으로 30분 동안 API 호출 가능. 엄격하게 막으려면 블랙리스트 or 짧은 TTL.
- `getUsername()` 이 email 을 반환하는 이유: Spring Security 에서 principal identifier 로 email 을 쓰기 위함. 컨트롤러에서는 `getId()` 로 접근.
