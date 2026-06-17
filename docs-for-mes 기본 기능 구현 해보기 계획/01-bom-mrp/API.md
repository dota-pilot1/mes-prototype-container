# BOM/MRP API 초안

## 품목

- `GET /api/items`
- `POST /api/items`
- `PUT /api/items/{id}`

## BOM

- `GET /api/boms`
- `GET /api/boms/{id}`
- `POST /api/boms`
- `PUT /api/boms/{id}`

## MRP 계산

- `POST /api/mrp/calculate`

Request:

```json
{
  "productItemId": 1,
  "quantity": 1000
}
```

Response:

```json
{
  "productItemId": 1,
  "quantity": 1000,
  "materials": [
    {
      "itemId": 10,
      "itemName": "알루미늄 프레임",
      "requiredQuantity": 1000,
      "inventoryQuantity": 800,
      "shortageQuantity": 200
    }
  ]
}
```
