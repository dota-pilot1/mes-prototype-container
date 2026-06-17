# 작업지시 스케줄링 API 초안

## 라우팅

- `GET /api/routings`
- `POST /api/routings`

## 작업지시

- `GET /api/work-orders`
- `POST /api/production-plans/{id}/work-orders/generate`
- `PATCH /api/work-orders/{id}/status`

## 생성 API Request

```json
{
  "routingId": 1,
  "startAt": "2026-06-17T08:00:00"
}
```
