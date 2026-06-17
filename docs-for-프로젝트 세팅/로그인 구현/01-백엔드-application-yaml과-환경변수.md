# 1. application.yaml & 환경변수

## 목표
JWT 시크릿/만료 시간을 설정 파일로 외부화. 시크릿은 `.env` 로 분리.

## 파일
- `twilio-callcenter-server/src/main/resources/application.yaml` (수정)
- `twilio-callcenter-server/.env` (신규, **git ignore**)
- `twilio-callcenter-server/.env.example` (신규, 커밋)
- `twilio-callcenter-server/.gitignore` (수정)

## 수정: `application.yaml`
기존 내용에 **추가**:
```yaml
jwt:
  secret: ${JWT_SECRET}
  access-token-expiration-ms: 1800000       # 30분
  refresh-token-expiration-ms: 604800000    # 7일
  issuer: twilio-callcenter
```

> `${JWT_SECRET}` 는 환경변수가 없으면 기동 실패 (의도적). 개발자가 반드시 세팅하게 강제.

## 신규: `.env.example` (커밋)
```
# JWT
JWT_SECRET=REPLACE_WITH_BASE64_32BYTES_OR_MORE

# DB (application.yaml 에서 이미 기본값 사용 중이나 참고용)
# SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/twilio_callcenter
# SPRING_DATASOURCE_USERNAME=postgres
# SPRING_DATASOURCE_PASSWORD=postgres
```

## 신규: `.env` (git ignore)
```
JWT_SECRET=<아래 명령으로 생성한 값>
```
생성 예시:
```bash
openssl rand -base64 48
# → 64자 base64 문자열. 32바이트(256bit) 이상이면 충분.
```

## 수정: `.gitignore`
기존 Spring Initializr 기본에 **추가**:
```
# env
.env
.env.local
```

## IntelliJ Run Configuration
환경변수 방식 2가지 중 택1:
1. **Run Configuration → Environment variables** 에 `JWT_SECRET=...` 직접 추가
2. **EnvFile 플러그인** 설치 → `.env` 자동 로드 (권장)

## Gradle CLI
```bash
export $(grep -v '^#' .env | xargs) && ./gradlew bootRun
```
또는 한 줄:
```bash
JWT_SECRET=$(openssl rand -base64 48) ./gradlew bootRun
```

## 검증
- `JWT_SECRET` 없이 기동 → `IllegalArgumentException: Could not resolve placeholder 'JWT_SECRET'` 로 실패해야 함
- 있으면 정상 기동

## 주의
- `JWT_SECRET` 은 32바이트(256bit) 이상 필수. HS256 키 최소 요구치.
- 개발/스테이징/프로덕션 **서로 다른 시크릿** 사용
- 시크릿 회전(rotation) 은 지금은 고려하지 않음
