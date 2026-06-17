# GPT 의견: BeautyBook 보일러플레이트 검토

## 1. 한줄 결론

현재 프로젝트는 **예약 사이트 계열 서비스를 만들기 위한 인증/인가 기반 파일럿 보일러플레이트**로는 좋은 출발점이다.

다만 지금 상태를 바로 “스타트업, SI, 솔루션, 엔터프라이즈에서 반복 사용 가능한 검증된 보일러플레이트”라고 부르기에는 아직 부족하다. 구조와 기능 방향은 좋지만, 검증 체계와 운영 기준이 더 필요하다.

## 2. 현재 프로젝트의 성격

이 프로젝트는 단순 샘플 앱보다는 훨씬 낫다.

이미 다음 요소가 들어가 있다.

- Next.js 프론트엔드
- Spring Boot 백엔드
- PostgreSQL
- JWT 로그인
- Refresh Token
- 회원가입
- Role 기반 권한
- Permission 관리
- Role-Permission 매핑
- 관리자 페이지 가드
- DB 기반 메뉴 관리
- 사이트 설정
- 다국어
- 테마 스위처
- Swagger
- Docker Compose 기반 DB

즉, 예약 사이트, 관리자 콘솔, B2B 서비스, 소규모 SaaS를 시작할 때 반복되는 기본 뼈대는 어느 정도 갖췄다.

## 3. BeautyBook 네이밍은 유지해도 되는가

유지해도 된다.

처음에는 `BeautyBook`이라는 이름이 특정 프로젝트처럼 보일 수 있다고 판단했지만, 사용 목적이 “예약 사이트 계열 보일러플레이트”라면 오히려 자연스럽다.

BeautyBook은 다음 서비스의 예시 도메인으로 쓸 수 있다.

- 미용실 예약
- 네일샵 예약
- 피부관리샵 예약
- 마사지/스파 예약
- PT/레슨 예약
- 병원/클리닉 예약
- 상담 예약
- 소규모 매장 예약

따라서 `BeautyBook`을 완전 중립 이름으로 바꾸기보다, “예약형 서비스 예시 도메인”으로 남겨두는 전략이 괜찮다.

다만 이전 프로젝트 흔적처럼 보이는 이름은 정리하는 게 좋다.

이미 정리한 항목:

- `pilot-callcenter-front` -> `beauty-book-front`

나중에 정리하면 좋은 항목:

- `twilio.accessToken`
- `twilio.refreshToken`

이 두 개는 Twilio 기능과 직접 관련이 없기 때문에 `beautybook.accessToken`, `beautybook.refreshToken` 또는 `auth.accessToken`, `auth.refreshToken` 정도로 바꾸는 것이 좋다.

## 4. 현재 장점

### 4-1. AI가 확장하기 좋은 구조다

백엔드는 DDD 4-Layer 형태를 지향하고 있다.

```text
presentation
application
domain
infrastructure
```

프론트는 FSD 구조를 지향하고 있다.

```text
app
widgets
features
entities
shared
```

이 구조는 AI에게 작업을 맡길 때 유리하다.

예를 들어 “예약 기능을 추가해줘”라고 할 때, AI가 무작위로 파일을 만들기보다 다음처럼 확장하도록 지시할 수 있다.

- 백엔드: `reservation/domain`, `reservation/application`, `reservation/presentation`
- 프론트: `features/reservation-management`, `entities/reservation`
- 공통 API: `shared/api`

즉, AI를 “생성기”가 아니라 “기존 구조를 확장하는 도구”로 쓰기 좋다.

### 4-2. 예약 서비스에 필요한 관리자 기반이 있다

예약 사이트는 결국 관리자 기능이 중요하다.

현재 프로젝트에는 다음 기반이 있다.

- 관리자 로그인
- 사용자 관리
- 역할 관리
- 권한 관리
- 메뉴 관리
- 사이트 설정

예약 도메인을 붙이면 다음 기능으로 확장하기 쉽다.

- 예약 관리
- 예약 가능 시간 관리
- 직원/디자이너 관리
- 서비스 상품 관리
- 매장 관리
- 고객 관리
- 알림 발송
- 예약 상태 변경

### 4-3. RBAC가 이미 있다

예약 서비스도 권한이 필요하다.

예:

- 최고 관리자
- 매장 관리자
- 직원
- 고객

현재 Role/Permission 구조가 있으므로 이후에 다음처럼 확장할 수 있다.

- `ROLE_ADMIN`
- `ROLE_MANAGER`
- `ROLE_STAFF`
- `ROLE_CUSTOMER`

권한 예:

- `RESERVATION_READ`
- `RESERVATION_WRITE`
- `RESERVATION_CANCEL`
- `STAFF_MANAGE`
- `SERVICE_MANAGE`
- `SHOP_SETTING_MANAGE`

## 5. 현재 부족한 점

### 5-1. 프론트 lint가 깨져 있다

현재 `npm run lint`가 실패한다.

보일러플레이트는 복제해서 쓰는 시작점이므로 최소한 아래 명령은 통과해야 한다.

```bash
npm run lint
npm run build
./gradlew test
./gradlew build
```

lint가 깨져 있으면 이후 AI가 코드를 추가할 때 품질이 더 쉽게 무너진다.

### 5-2. 테스트가 부족하다

백엔드 테스트는 통과하지만 실제 핵심 기능 검증은 부족하다.

필요한 테스트는 다음과 같다.

- 회원가입
- 로그인
- refresh token
- 권한 없는 사용자 접근 차단
- 관리자 접근 허용
- Role 생성/수정/삭제
- Permission 매핑
- 메뉴 조회
- 메뉴 권한 필터링

예약 기능을 추가한다면 다음 테스트도 필요하다.

- 예약 생성
- 중복 시간 예약 차단
- 예약 취소
- 예약 상태 변경
- 직원별 예약 조회
- 고객별 예약 조회

### 5-3. CI가 없다

GitHub Actions 같은 자동 검증 파이프라인이 필요하다.

최소 구성은 다음이면 충분하다.

- 프론트 lint
- 프론트 build
- 백엔드 test
- 백엔드 build

보일러플레이트는 “항상 깨지지 않는 시작점”이어야 하므로 CI가 중요하다.

### 5-4. DB 마이그레이션이 없다

현재는 JPA `ddl-auto: update` 기반이다.

개발 중에는 편하지만 실무에서는 위험하다.

운영 가능한 보일러플레이트라면 다음 중 하나를 도입해야 한다.

- Flyway
- Liquibase

예약 서비스는 테이블이 빠르게 늘어난다.

예:

- shops
- services
- staff
- reservations
- reservation_slots
- payments
- notifications

이 구조를 안정적으로 관리하려면 마이그레이션이 필요하다.

### 5-5. 인증 보안이 아직 약하다

현재 refresh token을 프론트 localStorage에 저장하는 구조다.

실서비스에서는 다음 구조가 더 안전하다.

- Access Token: 짧게 유지
- Refresh Token: httpOnly Secure Cookie
- refresh token rotation
- 로그아웃 시 서버 토큰 무효화
- 로그인 실패 횟수 제한
- 계정 잠금

예약 서비스는 고객 개인정보와 예약 이력이 들어갈 수 있으므로 인증 보안은 반드시 강화해야 한다.

## 6. 스타트업, SI, 솔루션, 엔터프라이즈 관점 판단

| 용도 | 현재 평가 | 이유 |
| --- | --- | --- |
| 개인 학습/파일럿 | 좋음 | 구조와 기능이 충분하다. |
| 예약 서비스 MVP | 조건부 좋음 | 예약 도메인만 붙이면 빠르게 시작 가능하다. |
| 스타트업 MVP | 조건부 가능 | 이메일 인증, 비밀번호 재설정, 배포 자동화가 필요하다. |
| SI 관리자 시스템 | 조건부 가능 | 권한/메뉴/사용자 관리 기반이 좋다. |
| 솔루션 제품 | 아직 부족 | 멀티테넌시, 감사 로그, 설정 확장성이 필요하다. |
| 엔터프라이즈 | 아직 부족 | SSO, 2FA, Audit Log, CI, 마이그레이션, 운영 보안이 필요하다. |

## 7. 예약 사이트 보일러플레이트로 발전시키는 방향

BeautyBook을 예약 사이트 보일러플레이트로 가져가려면 다음 도메인을 추가하면 좋다.

### 7-1. 매장/사업장

- Shop
- BusinessProfile
- OpeningHours
- Holiday
- Location

### 7-2. 서비스 상품

- ServiceItem
- Category
- Duration
- Price
- Description

### 7-3. 직원/담당자

- Staff
- StaffSchedule
- StaffServiceMapping

### 7-4. 예약

- Reservation
- ReservationSlot
- ReservationStatus
- CancelReason

### 7-5. 고객

- CustomerProfile
- VisitHistory
- Memo

### 7-6. 알림

- EmailNotification
- SmsNotification
- KakaoNotification
- NotificationTemplate

이 중 가장 먼저 만들 것은 `Reservation`이 아니라 `ServiceItem`, `Staff`, `OpeningHours`다. 예약은 이 세 가지가 있어야 제대로 검증할 수 있다.

## 8. 우선순위

### 지금 바로 하면 좋은 것

1. 프론트 lint 에러 해결
2. `twilio.*` 토큰 키 이름 변경
3. README에 “BeautyBook은 예약형 서비스 예시 도메인”이라고 명시
4. 프론트 build 확인
5. 백엔드 test/build 확인

### 그다음 할 것

1. GitHub Actions 추가
2. Flyway 또는 Liquibase 추가
3. refresh token httpOnly cookie 전환
4. 이메일 인증
5. 비밀번호 재설정

### 예약 도메인 추가 전 해야 할 것

1. Role/Permission 테스트 추가
2. 공통 페이지네이션 규격 정리
3. API 응답 규격 정리
4. 에러 코드 규칙 정리
5. DB 마이그레이션 도입

## 9. 보일러플레이트라는 말의 실무 사용성

`boilerplate`라는 말은 실제로 많이 쓴다.

다만 현업에서는 상황에 따라 표현이 다르다.

| 상황 | 자주 쓰는 표현 |
| --- | --- |
| 오픈소스/개인 개발 | boilerplate, starter, template |
| 스타트업/SaaS | SaaS boilerplate, starter kit |
| SI | project template, starter kit, accelerator |
| 엔터프라이즈 | reference architecture, platform blueprint, golden path |

따라서 이 프로젝트를 외부에 설명할 때는 다음 표현이 적절하다.

```text
BeautyBook은 예약형 서비스 구축을 위한 Next.js + Spring Boot 기반 인증/인가 보일러플레이트입니다.
```

또는 더 정확히는 다음과 같다.

```text
BeautyBook은 예약형 서비스의 관리자 콘솔과 RBAC 기반 인증/인가를 빠르게 시작하기 위한 파일럿 스타터입니다.
```

## 10. 최종 의견

BeautyBook 네이밍은 유지해도 된다.

예약 사이트 보일러플레이트로 활용하려는 목적이라면 오히려 좋은 예시 도메인이다.

다만 “검증된 보일러플레이트”라고 말하려면 다음 4개는 반드시 보강해야 한다.

1. lint/build/test 통과
2. CI 추가
3. DB 마이그레이션 도입
4. 인증 보안 강화

그리고 예약 사이트 보일러플레이트로 발전시키려면 다음 순서가 좋다.

1. 서비스 상품 관리
2. 직원/담당자 관리
3. 영업시간/휴무일 관리
4. 예약 슬롯 관리
5. 예약 생성/취소/변경
6. 고객 예약 내역
7. 알림 발송

현재 프로젝트는 “완성된 엔터프라이즈 보일러플레이트”는 아니지만, **AI와 함께 예약형 서비스 보일러플레이트로 키우기 좋은 파일럿**이다.

