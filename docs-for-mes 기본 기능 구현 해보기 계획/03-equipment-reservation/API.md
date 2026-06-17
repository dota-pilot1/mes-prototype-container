# 설비 예약 API 초안

## 설비

- `GET /api/equipments`
- `POST /api/equipments`
- `PUT /api/equipments/{id}`

## 예약

- `GET /api/equipment-reservations`
- `POST /api/equipment-reservations`
- `PATCH /api/equipment-reservations/{id}/cancel`

## 중복 검증

- 예약 생성 시 서버에서 검증한다.
- 중복이면 `409 Conflict`를 반환한다.
