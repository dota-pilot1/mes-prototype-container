# 스텝 2: 도메인 모델 — `Menu` 엔티티 + Repository

> 기존 도메인들(`permission`, `role`, `user`)과 동일한 **DDD + 패키지 by 도메인** 구조.
> 패키지: `com.cj.beautybook.menu`.

---

## 패키지 구조 (실제)

```
com.cj.beautybook.menu
├── domain
│   └── Menu.java                       @Entity
├── infrastructure
│   └── MenuRepository.java             JpaRepository
├── application
│   └── MenuService.java                트랜잭션 + 검증
└── presentation
    ├── MenuController.java             /api/menus (CRUD 통합)
    └── dto
        ├── MenuResponse.java
        ├── CreateMenuRequest.java
        └── UpdateMenuRequest.java
```

시더는 도메인 밖 공통 설정 위치:

```
com.cj.beautybook.config/MenuSeeder.java   @Order(4) ApplicationRunner
```

---

## `Menu` 엔티티 (실제 파일: [Menu.java](../../beauty-book-server/src/main/java/com/cj/beautybook/menu/domain/Menu.java))

```java
@Entity
@Table(name = "menus", uniqueConstraints = @UniqueConstraint(columnNames = "code"))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Menu {

    @Id @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String code;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "parent_id")
    private Menu parent;                       // NULL = 루트

    @Column(nullable = false, length = 100)  private String label;
    @Column(length = 100)                     private String labelKey;
    @Column(length = 255)                     private String path;
    @Column(length = 100)                     private String icon;
    @Column(nullable = false)                 private boolean isExternal = false;
    @Column(length = 100)                     private String requiredRole;
    @Column(length = 100)                     private String requiredPermission;
    @Column(nullable = false)                 private boolean visible = true;
    @Column(nullable = false)                 private int displayOrder = 0;

    @CreationTimestamp @Column(nullable = false, updatable = false)
    private Instant createdAt;
    @UpdateTimestamp @Column(nullable = false)
    private Instant updatedAt;

    public static Menu create(...) { /* 11개 파라미터 */ }
    public void update(...)        { /* parent 제외 모든 필드 갱신 */ }
}
```

### 설계 결정

| 결정 | 이유 |
|------|------|
| `@ManyToOne` 방향만 매핑, `@OneToMany children` 두지 않음 | 프론트가 플랫으로 받아 `buildTree` 하므로 서버는 children 탐색 필요 없음. `menu.getChildren().stream()` 같은 N+1 유발 패턴을 원천 차단 |
| `@NoArgsConstructor(PROTECTED)` + 정적 팩토리 `Menu.create(...)` | 무분별한 `new Menu()` 방지, 필수 필드 강제 |
| `update()` 는 parent 포함 전 필드 | 계획에선 `changeParent()` 도메인 메서드 분리했지만, 현재 UI 가 parent 를 다른 필드와 함께 수정하므로 단일 메서드로 통합. **순환 참조 방어는 미구현** (엣지 케이스 정책 참고) |
| `Instant` 사용 | 기존 다른 엔티티와 맞춤 |

---

## Repository (실제 파일: [MenuRepository.java](../../beauty-book-server/src/main/java/com/cj/beautybook/menu/infrastructure/MenuRepository.java))

```java
public interface MenuRepository extends JpaRepository<Menu, Long> {
    boolean existsByCode(String code);
    Optional<Menu> findByCode(String code);

    @Query("SELECT m FROM Menu m LEFT JOIN FETCH m.parent ORDER BY m.displayOrder ASC")
    List<Menu> findAllOrderByDisplayOrder();
}
```

- `findAllOrderByDisplayOrder()` 가 `GET /api/menus` 의 유일한 쿼리. `LEFT JOIN FETCH m.parent` 로 parent 초기화해서 DTO 매핑 시 Lazy 이슈 방지.
- 정렬은 `display_order ASC` 만. 동일값 시 2차 정렬 미적용(row 수 적어 무시 가능).
- **`findVisibleOrdered()` 는 구현 안 함** — 관리 UI 도 숨김 포함 전체를 봐야 하고, 헤더는 프론트 `buildTree` 에서 `visible && requiredRole === userRole` 로 필터링한다. 서버 쿼리를 분기할 이유가 없음.

---

## Service 레이어 — 규칙 배치

실제 파일: [MenuService.java](../../beauty-book-server/src/main/java/com/cj/beautybook/menu/application/MenuService.java)

| 규칙 | 위치 | 상태 |
|------|------|:----:|
| `code` 유니크 체크 | `create()` 에서 `existsByCode` + DB UNIQUE | ✅ |
| 존재 여부 검증 | `getById()` 헬퍼 | ✅ |
| parent 존재 여부 | `resolveParent()` 헬퍼 | ✅ |
| 부모 변경 시 순환 체크 | — | ❌ (UI 제약으로 우회) |
| 삭제 시 자식 존재 차단 | — | ❌ (DB FK 에 맡김, 실패 시 400 반환) |
| 형제 순서 일괄 재조정 | — | ❌ (프론트가 개별 PATCH 를 `Promise.all` 로 호출) |
| 필드 검증 | DTO `@Valid` | ✅ |

---

## 에러 코드

```java
ErrorCode.MENU_NOT_FOUND         (MENU_001)
ErrorCode.MENU_CODE_DUPLICATE    (MENU_002)
ErrorCode.MENU_PARENT_NOT_FOUND  (MENU_003)
```

- `@PreAuthorize("hasRole('ADMIN')")` 미통과 시는 공통 `AccessDeniedHandler` 가 `ErrorCode.FORBIDDEN` 반환 ([SecurityConfig](../../beauty-book-server/src/main/java/com/cj/beautybook/config/SecurityConfig.java)).

---

## 왜 `@OneToMany` 를 안 두는가 (재강조)

- 헤더 조회는 `findAllOrderByDisplayOrder()` 한 방으로 끝.
- 엔티티에 `children` 을 두면 개발자가 무심코 `menu.getChildren()` 을 쓰며 N+1 유발.
- **트리 구성은 전적으로 프론트 `buildTree` 책임** ([07](./07-플랫→트리-변환-유틸.md)).
