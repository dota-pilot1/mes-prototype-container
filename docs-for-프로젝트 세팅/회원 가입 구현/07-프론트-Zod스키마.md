# 7. 프론트 — Zod 스키마

## 목표
프론트 폼 검증 스키마. **백엔드 `@Pattern` 과 반드시 동일한 정규식** 사용.

## 파일
```
src/shared/lib/validation/auth.schema.ts
```

### `auth.schema.ts`
```ts
import { z } from "zod";

// 백엔드 SignupRequest 의 @Pattern 과 동일
const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,100}$/;

export const signupSchema = z
  .object({
    email: z
      .string({ required_error: "이메일을 입력해주세요." })
      .min(1, "이메일을 입력해주세요.")
      .max(255, "이메일은 255자 이하여야 합니다.")
      .email("올바른 이메일 형식이 아닙니다."),

    password: z
      .string({ required_error: "비밀번호를 입력해주세요." })
      .min(1, "비밀번호를 입력해주세요.")
      .regex(
        PASSWORD_REGEX,
        "비밀번호는 영문/숫자/특수문자를 포함한 8자 이상이어야 합니다."
      ),

    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해주세요."),

    username: z
      .string({ required_error: "사용자명을 입력해주세요." })
      .min(2, "사용자명은 2자 이상이어야 합니다.")
      .max(50, "사용자명은 50자 이하여야 합니다."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 일치하지 않습니다.",
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
```

## 주의
- `passwordConfirm` 은 **프론트 전용** 필드. 서버로 안 보냄 (08 단계 페이지에서 제거 후 전송).
- zod 에서 `refine` 위치는 `.object(...)` 체인 끝. 필드 내부에서 `passwordConfirm` 을 참조할 수 없음.
- 정규식 안의 특수문자 집합이 **백엔드와 글자 단위로 일치해야** 함. 나중에 바꿀 때 양쪽 동시 수정.
- 이메일 정규식은 `z.email()` 기본값 사용. RFC 5322 완벽 호환 아니지만 실무 충분.

## 검증
- 08 단계에서 폼과 같이 확인.
