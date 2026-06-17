# 모니터링 API 초안

## 대시보드

- `GET /api/monitoring/summary`

Response:

```json
{
  "producedQuantity": 1200,
  "defectRate": 2.4,
  "equipmentUtilizationRate": 84.1,
  "runningWorkOrderCount": 6,
  "recentIssues": []
}
```
