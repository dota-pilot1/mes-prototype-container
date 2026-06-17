# BOM 기반 MRP 계획

## 목표

생산 수량과 BOM을 기반으로 필요한 자재 수량, 현재고, 부족 수량을 계산한다.

## 연습 포인트

- 품목과 자재 모델링
- BOM master/detail 구조
- 계산성 API 설계
- 단순 테이블 UI와 결과 표시

## 최소 기능

- 품목 등록
- BOM 등록
- 품목별 BOM 조회
- 생산 예정 수량 입력
- 필요 자재 수량 계산
- 부족 수량 표시

## 백엔드 패키지

```text
bom/
  domain/
  application/
  infrastructure/
  presentation/
```

## 구현 순서

1. 품목, BOM, BOM 라인 엔티티 생성
2. Repository 생성
3. BOM 등록/조회 API 생성
4. MRP 계산 API 생성
5. 프론트 BOM/MRP 화면 생성
6. 메뉴 시더에 BOM/MRP 메뉴 추가

## 범위 제외

- 구매 발주 자동 생성
- 창고/로케이션별 재고
- 리드타임 반영
- 다단계 BOM 전개
