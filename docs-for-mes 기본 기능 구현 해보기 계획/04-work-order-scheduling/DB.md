# 작업지시 스케줄링 DB 초안

## processes

- id
- code
- name
- display_order
- active

## routings

- id
- item_id
- name
- active

## routing_steps

- id
- routing_id
- process_id
- equipment_id
- sequence
- units_per_hour

## work_orders

- id
- work_order_no
- production_plan_id
- process_id
- equipment_id
- quantity
- scheduled_start_at
- scheduled_end_at
- status: READY, RUNNING, DONE, CANCELLED
- created_at
- updated_at

## 설계 메모

- 처음에는 라우팅 step 순서대로 순차 생성한다.
- 설비 예약과의 충돌 반영은 후속 단계로 둔다.
