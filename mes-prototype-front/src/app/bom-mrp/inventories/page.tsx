import { MesFeaturePage } from "../../mes-feature-page";

export default function InventoryManagementPage() {
  return (
    <MesFeaturePage
      title="재고 관리"
      description="품목별 현재고와 예약 수량을 관리하고 가용 수량을 계산해 MRP 부족 수량 계산에 연결하는 화면입니다."
      planPath="docs-for-mes 기본 기능 구현 해보기 계획/01-bom-mrp/PLAN.md"
    />
  );
}
