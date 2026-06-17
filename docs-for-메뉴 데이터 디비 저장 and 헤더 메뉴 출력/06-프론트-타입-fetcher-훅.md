# 스텝 6: 프론트 — 타입 / API 클라이언트

> FSD 배치에 따라 **`entities/menu`** 에 타입과 API 만 둔다. React Query 훅은 **별도 파일로 만들지 않고** 각 소비 지점(Header, MenuTreeTab)에서 `useQuery/useMutation` 직접 호출한다.

---

## FSD 배치 (실제)

```
src/entities/menu/
├── model/types.ts          ← MenuRecord, MenuItem
└── api/menuApi.ts          ← getAll / create / update / delete

src/features/menu-management/
├── MenuTreeTab.tsx         ← 관리 UI (트리 + DetailPanel + DnD)
└── MenuFormDialog.tsx      ← 신규 생성 다이얼로그

src/app/menu-management/page.tsx   ← 라우트

src/widgets/header/ui/Header.tsx   ← 헤더 (buildTree 인라인)
```

> 원래 계획엔 `entities/menu/model/useMenus.ts`, `useAdminMenus.ts` 로 훅을 분리하는 안이 있었지만 **미구현**. 각 소비 지점이 훅 한 개씩만 쓰고 로직이 단순해서 래핑할 필요가 없었다.

---

## 타입 정의 ([types.ts](../../beauty-book--front/src/entities/menu/model/types.ts))

```ts
export type MenuRecord = {
  id: number;
  code: string;
  parentId: number | null;
  label: string;
  labelKey: string | null;
  path: string | null;
  icon: string | null;
  isExternal: boolean;
  requiredRole: string | null;
  requiredPermission: string | null;
  visible: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type MenuItem = MenuRecord & {
  children: MenuItem[];
};
```

### 계획 대비 변화

| 계획 | 실제 | 비고 |
|------|------|------|
| `MenuFlat` | `MenuRecord` | 이름만 다름 |
| `MenuNode extends MenuFlat { depth, children }` | `MenuItem = MenuRecord & { children }` | **`depth` 필드 없음** — 들여쓰기는 재귀 렌더에서 파라미터로 넘김 |

---

## API 클라이언트 ([menuApi.ts](../../beauty-book--front/src/entities/menu/api/menuApi.ts))

```ts
import { api } from "@/shared/api/axios";
import type { MenuRecord } from "../model/types";

export type CreateMenuBody = {
  code: string;
  parentId: number | null;
  label: string;
  labelKey: string | null;
  path: string | null;
  icon: string | null;
  isExternal: boolean;
  requiredRole: string | null;
  requiredPermission: string | null;
  visible: boolean;
  displayOrder: number;
};

export type UpdateMenuBody = Omit<CreateMenuBody, "code">;

export const menuApi = {
  getAll: () => api.get<MenuRecord[]>("/api/menus").then(r => r.data),
  create: (body: CreateMenuBody) =>
    api.post<MenuRecord>("/api/menus", body).then(r => r.data),
  update: (id: number, body: UpdateMenuBody) =>
    api.patch<MenuRecord>(`/api/menus/${id}`, body).then(r => r.data),
  delete: (id: number) => api.delete(`/api/menus/${id}`),
};
```

- 엔드포인트가 `/api/menus` 단일 (계획의 `/api/admin/menus` 분리 안 함).
- `listAll` vs `listForCurrentUser` 분리 없음 — GET 하나.
- `changeParent`, `reorder` **없음** — `update()` 로 통합.

---

## React Query 사용 (소비 지점)

### Header — 조회만

```ts
const { data: flatMenus = [] } = useQuery({
  queryKey: ["menus"],
  queryFn: menuApi.getAll,
  staleTime: 1000 * 60 * 5,
});
```

### MenuTreeTab — 조회 + 변경 + 삭제

```ts
const { data: serverMenus = [] } = useQuery({ queryKey: ["menus"], queryFn: menuApi.getAll, ... });

const saveMutation = useMutation({
  mutationFn: (items: MenuRecord[]) =>
    Promise.all(items.map(m => menuApi.update(m.id, toUpdateBody(m)))),
  onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
});

// DetailPanel 안
const mutation = useMutation({ mutationFn: () => menuApi.update(menu.id, form), ... });
const deleteMutation = useMutation({ mutationFn: () => menuApi.delete(menu.id), ... });

// MenuFormDialog 안
const mutation = useMutation({ mutationFn: (v) => menuApi.create({ code, ...body }), ... });
```

모든 성공 시 `["menus"]` 쿼리 invalidate → **Header 와 관리 UI 둘 다 즉시 갱신**.

---

## 쿼리 키 전략

현재 하나의 키만 사용:
```ts
["menus"]
```

계획에 있던 `menusKeys.all / .mine / .admin` 구조는 **미도입**. 관리 UI 와 헤더가 같은 GET 을 쓰므로 분리할 필요가 없음.

---

## 로딩/에러 UX (실제)

- 헤더: `data = []` 폴백 → 로딩 중 빈 메뉴, 실패해도 헤더 자체는 렌더. Skeleton 없음.
- 관리 UI: `isLoading` 시 `<p>로딩 중...</p>`, mutation 실패 시 toast.

---

## index.ts (공개 API)

현재는 각 파일이 named export 만 하고, 소비 지점에서 직접 경로로 import. 별도 `index.ts` barrel 없음.

```ts
// 현재 사용 패턴
import { menuApi } from "@/entities/menu/api/menuApi";
import type { MenuRecord, MenuItem } from "@/entities/menu/model/types";
```

FSD 경계는 지켜졌지만 barrel 파일은 굳이 만들지 않음. 의존성 수가 적어서.
