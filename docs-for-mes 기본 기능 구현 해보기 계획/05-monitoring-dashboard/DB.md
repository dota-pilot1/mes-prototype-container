# 모니터링 DB 초안

## production_results

- id
- work_order_id
- item_id
- produced_quantity
- defect_quantity
- started_at
- ended_at
- created_at

## equipment_runtime_logs

- id
- equipment_id
- status: RUNNING, IDLE, DOWN
- started_at
- ended_at

## 설계 메모

- 대시보드는 원본 데이터를 직접 수정하지 않고 조회/집계만 담당한다.
- 처음에는 단순 집계 쿼리로 충분하다.
