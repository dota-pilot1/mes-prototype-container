# 생산계획 DB 초안

## production_plans

- id
- plan_no
- item_id
- quantity
- start_date
- end_date
- status: PLANNED, IN_PROGRESS, DELAYED, DONE, CANCELLED
- memo
- created_at
- updated_at

## 설계 메모

- 처음에는 날짜 단위 계획으로 시작한다.
- 시간 단위 계획은 설비 예약/작업지시 단계에서 확장한다.
- `item_id`는 BOM/MRP의 `items`를 재사용한다.
