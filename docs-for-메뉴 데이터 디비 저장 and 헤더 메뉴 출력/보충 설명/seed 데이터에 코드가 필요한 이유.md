# seed 데이터에 `code` 가 필요한 이유

> 메뉴뿐 아니라 `roles`, `permissions`, `permission_categories` 등 **모든 시드 테이블에 `code` 컬럼이 있는 이유** 를 정리.
> 한 줄로: **시더가 "이 row 이미 있나?" 를 `exists` 로 체크하려면, 체크하는 쪽이 값을 미리 알고 있어야 하기 때문.**

---

## 1. 시더는 서버 재시작마다 돈다

```java
@Component
public class MenuSeeder implements CommandLineRunner {
   @Override
   public void run(String... args) {
      // 서버가 뜰 때마다 이 코드가 실행됨
   }
}
```

- 개발 중 코드 수정 → 서버 재시작 → 시더 또 돎. 하루에도 수십 번.
- 운영 배포 → 서버 재시작 → 시더 돎.

그러니 시더는 **"매번 돌아도 안전" 해야** 한다. 이미 있는 데이터를 또 넣어선 안 된다.

---

## 2. 두 가지 시더 전략

### 전략 A. 매번 삭제 후 재생성 (나쁨)

```java
public void run(String... args) {
   repo.deleteAll();               // 전부 삭제
   insert("대시보드", ...)         // 다시 넣기
   insert("관리",     ...)
}
```

- 서버 뜰 때마다 데이터 초기화.
- **운영자가 관리 UI 로 바꾼 내용이 재배포마다 전부 날아감.** ❌
- 이 방식은 `code` 없이도 동작하긴 함 (어차피 매번 초기화).

### 전략 B. 있으면 스킵 (좋음)

```java
public void run(String... args) {
   if (!repo.existsByCode("DASHBOARD"))    insert(code: "DASHBOARD",    ...)
   if (!repo.existsByCode("ADMIN_FOLDER")) insert(code: "ADMIN_FOLDER", ...)
   if (!repo.existsByCode("ADMIN_USERS"))  insert(code: "ADMIN_USERS",  ...)
}
```

- 이미 있으면 **건드리지 않음.**
- **운영자 수정 보존.** ✅
- 이 방식을 쓰려면 **"이미 있나?" 를 묻는 기준값이 필요함** → 그게 `code`.

우리 프로젝트는 전략 B 를 쓴다.

---

## 3. `id` 로 체크가 불가능한 이유

시더 코드에 이렇게 써보면:

```java
if (!repo.existsById(???)) {
   insert("대시보드", ...)
}
```

**물음표에 뭘 넣어야 할까?**

`id` 는 DB 가 `INSERT` 순간에 자동으로 매기는 숫자다.
개발자는 시더를 **쓸 때** `id` 가 뭐가 될지 모른다.

- 처음 실행: `대시보드` 가 `id=1` 을 받을 수도 있고, `id=47` 일 수도 있음 (다른 테이블 상태에 따라).
- 두 번째 실행: 같은 데이터를 찾으려 해도 "어떤 id 를 넣어야 할지" 알 방법이 없음.

→ **`id` 기반으로는 `exists` 질문 자체가 성립 안 한다.**

---

## 4. `code` 로는 왜 되는가

```java
if (!repo.existsByCode("DASHBOARD")) {
   insert(code: "DASHBOARD", label: "대시보드", ...)
}
```

`"DASHBOARD"` 는 **개발자가 시더 코드에 직접 박아둔 고정 문자열**.

- 처음 실행 시에도 `"DASHBOARD"`
- 두 번째 실행 시에도 `"DASHBOARD"`
- 1년 뒤 실행 시에도 `"DASHBOARD"`

→ **시더가 "이 row 있나?" 를 항상 같은 값으로 물어볼 수 있다.**

---

## 5. `id` vs `code` 비교표

| | `id` | `code` |
|---|------|--------|
| 값을 누가 정함? | DB 가 자동 배정 | **개발자가 직접 박음** |
| 언제 결정됨? | `INSERT` 실행 순간 | 소스 코드에 이미 있음 |
| 개발자가 미리 알 수 있음? | ❌ | ✅ |
| 재시작/재생성 후 같은 값 보장? | ❌ (환경·순서 따라 다름) | ✅ (항상 같음) |
| 시더가 `exists` 로 질문 가능? | ❌ | ✅ |

---

## 6. 비유

- `id` = 식당에서 주는 **대기번호표**
  - 주는 순간 결정, 다음에 와도 번호 다름.
  - "어제 받은 번호 있나요?" → 성립 안 하는 질문.

- `code` = 예약 시 쓰는 **내 이름**
  - 내가 정하는 값. 언제 와도 같은 이름.
  - "김철수 예약 있나요?" → 정상 질문.

시더가 DB 에 던지는 질문은 후자 형태여야만 성립한다.

---

## 7. 결국 `code` 가 하는 일 (요약)

```
[시더 재실행]
   ↓
"이 row 이미 있나?" 라는 질문이 필요함
   ↓
질문하려면 "뭘 기준으로?" 가 있어야 함
   ↓
그 기준이 고정값이어야 함 (매번 바뀌면 질문 못 함)
   ↓
DB 가 정하는 id 는 고정값 아님 → 탈락
   ↓
개발자가 정하는 code 는 고정값 ✅
   ↓
→ 모든 시드 테이블은 code 컬럼을 가진다
```

---

## 8. 우리 프로젝트의 실제 예

전부 같은 이유로 `code` 가 있다:

| 테이블 | code 예시 | 시더가 하는 일 |
|--------|-----------|---------------|
| `roles` | `ROLE_ADMIN`, `ROLE_USER` | `existsByCode("ROLE_ADMIN")` 으로 중복 방지 |
| `permissions` | `USER_VIEW`, `ROLE_EDIT` | 같음 |
| `permission_categories` | `USER`, `ROLE` | 같음 |
| `menus` (신규) | `DASHBOARD`, `ADMIN_USERS` | 같음 |

즉 `code` 는 **"시더가 DB 에 질문을 던지기 위해, 개발자가 미리 정해둔 이름표"** 다.
이 이름표 없이는 "있으면 스킵" 전략을 구현할 방법이 없다.

---

## 9. 덤 — `code` 의 부수적 이점

`code` 는 시더 중복 방지가 **주 목적** 이지만, 부수적으로 쓸 수 있는 곳이 많다.

- **시더 내부의 부모-자식 연결**
  ```java
  Menu parent = repo.findByCode("ADMIN_FOLDER").orElseThrow();
  insert(code: "ADMIN_USERS", parent: parent, ...)
  ```
- **테스트 코드에서 안정 참조**
  ```java
  Menu m = repo.findByCode("DASHBOARD").orElseThrow();
  ```
- **특정 row 에만 적용되는 비즈니스 로직**
  ```java
  if (menu.getCode().equals("ADMIN_USERS")) { ... }
  ```
- **로그/에러 메시지 가독성**
  `"menu id 47 not accessible"` vs `"menu ADMIN_USERS not accessible"` — 후자가 바로 의미 파악됨.

이 부가 효과들은 덤이고, **본질은 "시더의 `exists` 체크 기준값"** 이라는 점만 기억하면 된다.
