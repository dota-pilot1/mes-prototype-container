export type ItemType = "PRODUCT" | "MATERIAL";

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
