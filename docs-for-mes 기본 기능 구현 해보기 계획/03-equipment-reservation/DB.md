# 설비 예약 DB 초안

## equipments

- id
- code
- name
- equipment_type
- active
- created_at
- updated_at

## equipment_reservations

- id
- equipment_id
- title
- start_at
- end_at
- status: RESERVED, CANCELLED, DONE
- created_by
- memo
- created_at
- updated_at

## 설계 메모

- 중복 검증 조건: 같은 설비, 취소가 아닌 예약, 시간이 겹치는 경우
- PostgreSQL exclusion constraint는 나중에 검토한다.
