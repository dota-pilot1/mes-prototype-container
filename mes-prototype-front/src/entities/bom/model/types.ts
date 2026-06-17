export type ItemType = "PRODUCT" | "MATERIAL";
export type BomStatus = "DRAFT" | "APPROVED" | "INACTIVE";

export type Item = {
  id: number;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  unit: string;
  safetyStock: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateItemBody = {
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  unit: string;
  safetyStock?: number;
  description?: string;
};

export type Inventory = {
  id: number;
  item: Item;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  updatedAt: string;
};

export type CreateInventoryBody = {
  itemId: number;
  onHandQty: number;
  reservedQty?: number;
};

export type BomLine = {
  id: number;
  materialItem: Item;
  requiredQty: number;
  lossRate: number;
  description?: string | null;
};

export type Bom = {
  id: number;
  bomCode: string;
  bomName: string;
  productItem: Item;
  version: string;
  status: BomStatus;
  description?: string | null;
  lines: BomLine[];
  createdAt: string;
  updatedAt: string;
};

export type CreateBomLineBody = {
  materialItemId: number;
  requiredQty: number;
  lossRate?: number;
  description?: string;
};

export type CreateBomBody = {
  bomCode: string;
  bomName: string;
  productItemId: number;
  version: string;
  status?: BomStatus;
  description?: string;
  lines: CreateBomLineBody[];
};

export type MrpCalculateBody = {
  productItemId: number;
  quantity: number;
};

export type MrpMaterial = {
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  requiredQuantity: number;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  safetyStock: number;
  shortageQuantity: number;
};

export type MrpCalculateResult = {
  productItemId: number;
  productItemCode: string;
  productItemName: string;
  quantity: number;
  materials: MrpMaterial[];
};
