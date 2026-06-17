# 스텝 2 — ngrok + Webhook 엔드포인트 구성

## 목표
Twilio는 통화 이벤트 발생 시 외부 URL로 HTTP 요청을 보낸다.
로컬 개발 환경에서 이 webhook을 수신하려면 ngrok으로 터널을 열어야 한다.

---

## 할 일 목록

### 1. ngrok 설치 및 실행
```bash
# macOS
brew install ngrok

# 터널 열기 (백엔드 포트 4101)
ngrok http 4101
```

실행 후 출력되는 Forwarding URL 복사:
```
Forwarding  https://xxxx-xx-xx.ngrok-free.app -> http://localhost:4101
```

### 2. Twilio 콘솔에서 Webhook URL 등록
1. https://console.twilio.com → Phone Numbers → Manage → Active numbers
2. 발급받은 번호 클릭
3. **Voice Configuration** 섹션:
   - `A call comes in` → Webhook
   - URL: `https://xxxx.ngrok-free.app/api/voice/inbound`
   - HTTP Method: `POST`
4. Save 클릭

### 3. VoiceController.java 뼈대 작성
**경로:** `src/main/java/com/cj/twilio/callcenter/voice/presentation/VoiceController.java`

```java
@RestController
@RequestMapping("/api/voice")
public class VoiceController {

    @PostMapping(value = "/inbound", produces = "application/xml")
    public String inbound(HttpServletRequest request) {
        VoiceResponse response = new VoiceResponse.Builder()
                .say(new Say.Builder("안녕하세요. 연결 중입니다.").build())
                .build();
        return response.toXml();
    }
}
```

### 4. SecurityConfig — webhook 경로 인증 제외
```java
.requestMatchers("/api/voice/**").permitAll()
```

### 5. 테스트
1. ngrok 실행 중인 상태에서 백엔드 기동
2. Twilio 콘솔 → Phone Numbers → 번호로 실제 전화 발신
3. 백엔드 로그에서 `POST /api/voice/inbound` 요청 수신 확인
4. 전화기에서 TTS "안녕하세요. 연결 중입니다." 음성 들림

---

## 완료 기준
- 전화 걸었을 때 TTS 음성 정상 재생
- 백엔드 로그에 webhook 수신 로그 확인

---

## 참고
- ngrok 무료 플랜: 세션마다 URL 변경됨 → Twilio 콘솔에서 매번 URL 업데이트 필요
- ngrok 고정 도메인: 유료 또는 무료 계정 1개 고정 도메인 제공
- TwiML 응답 형식: https://www.twilio.com/docs/voice/twiml
