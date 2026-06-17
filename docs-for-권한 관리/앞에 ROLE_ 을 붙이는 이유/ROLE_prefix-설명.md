# 왜 롤 코드 앞에 `ROLE_`을 붙이나?

## 핵심 이유: Spring Security 규칙

Spring Security의 `hasRole("ADMIN")` 메서드는 내부적으로 자동으로 `ROLE_`을 붙여서 비교한다.

```java
// 이 두 줄은 완전히 동일하게 동작
.requestMatchers("/admin/**").hasRole("ADMIN")       // → 내부적으로 "ROLE_ADMIN" 과 비교
.requestMatchers("/admin/**").hasAuthority("ROLE_ADMIN")  // → 명시적으로 "ROLE_ADMIN" 과 비교
```

즉, `ROLE_` 접두어는 **"이건 역할(Role)이다"** 라는 Spring Security와의 약속이다.

---

## `hasRole` vs `hasAuthority` 차이

| 메서드 | 입력값 | 실제 비교값 |
|--------|--------|------------|
| `hasRole("ADMIN")` | `"ADMIN"` | `"ROLE_ADMIN"` (자동 추가) |
| `hasAuthority("ROLE_ADMIN")` | `"ROLE_ADMIN"` | `"ROLE_ADMIN"` (그대로) |

이 프로젝트에서는 JWT 클레임에 `"ROLE_ADMIN"` 전체 문자열을 저장하고,
`UserPrincipal.getAuthorities()`에서 `SimpleGrantedAuthority("ROLE_ADMIN")`로 반환한다.
→ 그래서 `hasAuthority("ROLE_ADMIN")` 또는 `hasRole("ADMIN")` 둘 다 사용 가능.

---

## `ROLE_SUPER_ADMIN` 네이밍은 괜찮은가?

**괜찮다.** 다만 관례적으로 두 가지 패턴이 있다:

| 패턴 | 예시 | 특징 |
|------|------|------|
| 단계형 | `ROLE_USER` → `ROLE_ADMIN` | 간단, 2~3단계 |
| 명시형 | `ROLE_USER` → `ROLE_ADMIN` → `ROLE_SUPER_ADMIN` | 최상위 명확히 구분 |

보일러플레이트 용도라면 `ROLE_SUPER_ADMIN`보다 **`ROLE_ADMIN`을 최상위로** 두는 게 더 범용적.
도메인 특화 최상위가 필요할 때만 `SUPER_ADMIN`을 추가하는 걸 권장.

---

## `systemRole` 플래그란?

`Role` 엔티티의 `systemRole: boolean` 컬럼은 **"앱 부트 시 자동 시드된 기본 롤"** 표시다.

**있는 이유:**
- 실수로 `ROLE_USER`, `ROLE_ADMIN` 같은 핵심 롤을 UI에서 삭제하는 걸 방지
- 백엔드에서 `systemRole=true`이면 수정/삭제 요청을 400으로 차단

**없애도 되나?**  
지금처럼 프론트에서 권한 제한 없이 전부 허용하는 단계에서는  
`systemRole` 체크를 백엔드에서 풀어버리면 기본 롤도 지울 수 있다.  
→ 스텝 2 이후 권한 제어가 붙으면 `ROLE_ADMIN`만 CRUD 가능하게 할 예정이므로  
  그때 `systemRole` 가드가 진짜 의미를 가진다.
