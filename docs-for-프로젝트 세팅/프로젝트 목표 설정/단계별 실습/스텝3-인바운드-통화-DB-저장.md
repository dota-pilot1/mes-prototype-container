# 스텝 3 — 인바운드 통화 이벤트 DB 저장

## 목표
전화가 수신될 때 통화 정보(발신번호, 수신번호, 상태, 시간 등)를 DB에 저장한다.
이후 상담 이력 조회 / 실시간 대시보드의 기반 데이터가 된다.

---

## 할 일 목록

### 1. calls 테이블 엔티티 작성
**경로:** `src/main/java/com/cj/twilio/callcenter/call/domain/Call.java`

```java
@Entity
@Table(name = "calls")
public class Call {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String callSid;       // Twilio 고유 통화 ID

    private String fromNumber;    // 발신 번호
    private String toNumber;      // 수신 번호 (우리 Twilio 번호)

    @Enumerated(EnumType.STRING)
    private CallStatus status;    // RINGING, IN_PROGRESS, COMPLETED, FAILED

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer durationSec;

    // factory method, getters
}
```

### 2. CallStatus enum
```java
public enum CallStatus {
    RINGING, IN_PROGRESS, COMPLETED, NO_ANSWER, BUSY, FAILED
}
```

### 3. CallRepository
```java
public interface CallRepository extends JpaRepository<Call, Long> {
    Optional<Call> findByCallSid(String callSid);
    List<Call> findAllByOrderByStartedAtDesc();
}
```

### 4. VoiceController — webhook 수신 시 저장
Twilio가 `POST /api/voice/inbound` 로 보내는 파라미터:

| 파라미터 | 설명 |
|----------|------|
| `CallSid` | 통화 고유 ID |
| `From` | 발신 번호 |
| `To` | 수신 번호 |
| `CallStatus` | 현재 상태 |

```java
@PostMapping(value = "/inbound", produces = "application/xml")
public String inbound(
        @RequestParam("CallSid") String callSid,
        @RequestParam("From") String from,
        @RequestParam("To") String to,
        @RequestParam("CallStatus") String status) {

    callService.saveInbound(callSid, from, to, status);

    VoiceResponse response = new VoiceResponse.Builder()
            .say(new Say.Builder("안녕하세요. 연결 중입니다.").build())
            .build();
    return response.toXml();
}
```

### 5. StatusCallback 설정 — 통화 종료 이벤트 수신
Twilio 콘솔에서 `Status Callback URL` 추가:
```
https://xxxx.ngrok-free.app/api/voice/status
```

```java
@PostMapping("/status")
public ResponseEntity<Void> statusCallback(
        @RequestParam("CallSid") String callSid,
        @RequestParam("CallStatus") String status,
        @RequestParam(value = "CallDuration", required = false) Integer duration) {

    callService.updateStatus(callSid, status, duration);
    return ResponseEntity.noContent().build();
}
```

### 6. 통화 목록 조회 API
```java
GET /api/calls  →  List<CallSummaryResponse>
```

---

## 완료 기준
- 전화 수신 → `calls` 테이블에 레코드 생성 확인
- 통화 종료 후 `status = COMPLETED`, `durationSec` 업데이트 확인
- `GET /api/calls` 응답에서 통화 이력 조회 가능

---

## 다음 단계 (스텝 4 예고)
저장된 통화 데이터를 WebSocket으로 프론트에 실시간 Push →
대시보드에서 현재 진행 중인 통화를 실시간으로 표시.
