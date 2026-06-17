# 스텝 4: API 설계 (1) — 플랫 조회 `GET /api/menus`

> 프론트가 메뉴 로드 시 호출하는 엔드포인트. **공개(인증 없이 호출 가능)** 하고 **전체 메뉴를 플랫 배열로** 반환한다.
> 실제 파일: [MenuController.java](../../beauty-book-server/src/main/java/com/cj/beautybook/menu/presentation/MenuController.java)

---

## 엔드포인트

| 메서드 | URL | 인증 | 반환 |
|--------|-----|:----:|------|
| `GET` | `/api/menus` | **공개** (permitAll) | `MenuResponse[]` (전체, 숨김 포함) |

SecurityConfig 에 명시적으로 permitAll:
```java
.requestMatchers(HttpMethod.GET, "/api/menus").permitAll()
```

---

## 왜 단일 엔드포인트인가 (계획 대비 결정)

원래 계획은 `/api/menus` (로그인 유저용, 권한 필터링됨) + `/api/admin/menus` (관리자용, 전체) 로 분리였다. 실제 구현은 **공개 단일**:

| 이유 | 설명 |
|------|------|
| 메뉴는 비밀이 아니다 | 비로그인 유저에게 "관리" 드롭다운이 보여도 클릭 시 어차피 `/users` 는 가드됨 |
| 공개로 만들면 CDN/브라우저 캐싱 가능 | 유저별 응답이면 개인화되어 캐싱 포기 |
| 프론트 필터가 이미 있음 | Header 의 `buildTree(flat, userRole)` 가 role 로 필터링 |
| 관리 UI 는 전체 필요 | 분리하면 두 엔드포인트 관리 |

> 단점: 메뉴에 기밀성이 필요한 경우(예: "VIP 전용 메뉴" 같은 게 존재를 드러내면 안 되는 경우) 서버측 필터가 필요. 이 프로젝트는 해당 없음.

---

## `MenuResponse` 스키마

```ts
interface MenuResponse {
  id: number;
  code: string;
  parentId: number | null;       // 루트는 null
  label: string;
  labelKey: string | null;
  path: string | null;
  icon: string | null;
  isExternal: boolean;
  requiredRole: string | null;
  requiredPermission: string | null;
  visible: boolean;
  displayOrder: number;
  createdAt: string;             // ISO8601
  updatedAt: string;
}
```

- `parentId` 는 서버에서 **`menu.getParent() == null ? null : menu.getParent().getId()`** 로 평탄화.
- 트리 구조 **없음**. 서버는 트리를 만들지 않는다.

---

## 서버 로직 (실제)

```java
@Transactional(readOnly = true)
public List<MenuResponse> getAll() {
    return menuRepository.findAllOrderByDisplayOrder()
            .stream()
            .map(MenuResponse::from)
            .toList();
}
```

- 권한 필터 **없음** — 프론트 책임.
- 숨김 필터 **없음** — 관리 UI 도 숨김을 봐야 하므로.
- `LEFT JOIN FETCH m.parent` 로 Lazy 이슈 방지.

---

## 프론트 호출 (참고)

```ts
// src/entities/menu/api/menuApi.ts
getAll: () => api.get<MenuRecord[]>("/api/menus").then(r => r.data)
```

Header 에서:
```ts
const { data: flatMenus = [] } = useQuery({
  queryKey: ["menus"],
  queryFn: menuApi.getAll,
  staleTime: 1000 * 60 * 5,   // 5분
});
const tree = buildTree(flatMenus, userRole);
```

---

## 캐싱 (현재)

- 클라이언트: React Query `staleTime: 5분`.
- 서버: 없음. 필요시 Spring `@Cacheable` 로 전역 캐시 + CUD 에서 evict.
- CDN: 공개 GET 이므로 이론상 가능하지만 현재 미적용.

---

## 에러 응답

정상 케이스만 존재 (200). 서버 오류 시 공통 `ErrorResponse` 포맷 ([공통 에러 처리](../docs-for-서버%20공통%20에러%20처리)).
