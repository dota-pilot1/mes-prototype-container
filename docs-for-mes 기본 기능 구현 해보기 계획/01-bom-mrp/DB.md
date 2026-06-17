# BOM/MRP DB 초안

## items

- id
- code
- name
- item_type: PRODUCT, SEMI_PRODUCT, MATERIAL
- unit
- active
- created_at
- updated_at

## boms

- id
- product_item_id
- name
- version
- active
- created_at
- updated_at

## bom_lines

- id
- bom_id
- material_item_id
- quantity_per_unit
- loss_rate
- display_order

## inventories

- id
- item_id
- quantity
- safety_stock
- updated_at

## 설계 메모

- 처음에는 단일 창고 재고로 시작한다.
- 다단계 BOM은 나중에 확장한다.
- 생산품과 자재를 모두 `items`에서 관리하면 BOM 확장이 쉽다.
