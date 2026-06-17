# 스텝 1 — Twilio 계정 및 SDK 연동

## 목표
Twilio 계정을 설정하고 Spring Boot에 twilio-java SDK를 연동한다.
이후 모든 단계의 기반이 되는 설정 작업.

---

## 할 일 목록

### 1. Twilio 계정 준비
- [ ] https://www.twilio.com 가입 (무료 트라이얼)
- [ ] 대시보드에서 다음 값 복사:
  - `Account SID` (AC로 시작)
  - `Auth Token`
- [ ] 트라이얼 전화번호 발급 (Twilio에서 제공하는 가상번호)

### 2. 환경변수 설정
`twilio-callcenter-server/src/main/resources/application.yaml` 에 추가:
```yaml
twilio:
  account-sid: ${TWILIO_ACCOUNT_SID}
  auth-token: ${TWILIO_AUTH_TOKEN}
  phone-number: ${TWILIO_PHONE_NUMBER}
```

로컬 개발용 `.env` 또는 IntelliJ Run Configuration 환경변수에 실제 값 입력.

### 3. build.gradle 의존성 추가
```gradle
implementation 'com.twilio.sdk:twilio:10.6.7'
```

### 4. TwilioConfig.java 작성
**경로:** `src/main/java/com/cj/twilio/callcenter/config/TwilioConfig.java`

```java
@Configuration
@ConfigurationProperties(prefix = "twilio")
public class TwilioConfig {
    private String accountSid;
    private String authToken;
    private String phoneNumber;

    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }
    // getters/setters
}
```

### 5. 연동 확인
서버 기동 시 오류 없이 `Twilio.init()` 완료되면 성공.

---

## 완료 기준
- 서버 기동 로그에 Twilio 초기화 오류 없음
- `TwilioConfig` Bean 정상 등록 확인

---

## 참고
- Twilio Java SDK: https://www.twilio.com/docs/libraries/java
- 트라이얼 계정 제한: 인증된 번호로만 발신 가능, 수신은 제한 없음
