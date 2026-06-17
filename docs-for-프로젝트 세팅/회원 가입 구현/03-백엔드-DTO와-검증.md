# 3. 백엔드 — DTO & 검증

## 목표
요청/응답 DTO. **검증 규칙을 프론트 Zod 스키마와 동일하게** 맞춘다 (원본 mapo 의 비대칭 문제 수정).

## 패키지
```
com.cj.twilio.callcenter.user.presentation.dto
├─ SignupRequest.java
├─ SignupResponse.java
└─ CheckEmailResponse.java
```

## 비밀번호 정책 (프론트/백 공통)
- 8자 이상, 100자 이하
- 영문 1자 이상
- 숫자 1자 이상
- 특수문자 1자 이상 (`!@#$%^&*()_+\-=[]{};':"\\|,.<>/?`)

정규식 (백/프론트 공통):
```
^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,100}$
```

## 파일

### `SignupRequest.java`
```java
package com.cj.twilio.callcenter.user.presentation.dto;

import jakarta.validation.constraints.*;

public record SignupRequest(
    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Size(max = 255, message = "이메일은 255자 이하여야 합니다.")
    String email,

    @NotBlank(message = "비밀번호를 입력해주세요.")
    @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]).{8,100}$",
        message = "비밀번호는 영문/숫자/특수문자를 포함한 8자 이상이어야 합니다."
    )
    String password,

    @NotBlank(message = "사용자명을 입력해주세요.")
    @Size(min = 2, max = 50, message = "사용자명은 2~50자여야 합니다.")
    String username
) {}
```

### `SignupResponse.java`
```java
public record SignupResponse(
    Long id,
    String email,
    String username,
    String role,
    Instant createdAt
) {
    public static SignupResponse from(User u) {
        return new SignupResponse(
            u.getId(), u.getEmail(), u.getUsername(), u.getRole().name(), u.getCreatedAt()
        );
    }
}
```
> 비밀번호 해시는 **절대** 응답에 포함하지 않음.

### `CheckEmailResponse.java`
```java
public record CheckEmailResponse(boolean available) {}
```

## 검증
- 단위 테스트는 생략 (기본 스코프). 통합 테스트는 09 단계에서 수동 curl.
- DTO 변환 방법: `SignupResponse.from(user)` 정적 팩토리. MapStruct/ModelMapper 도입하지 않음.

## 주의
- `record` 는 자동으로 final + getter 생성 → Lombok 불필요
- `@Valid` 는 **컨트롤러 파라미터에서** 트리거해야 함 (04 단계)
- `@Email` 은 Hibernate Validator 의 기본 규칙으로는 `user@localhost` 같은 것도 통과함. 실서비스 수준의 엄격한 검증이 필요하면 추가 `@Pattern` 고려 — 지금은 기본값으로 충분.
