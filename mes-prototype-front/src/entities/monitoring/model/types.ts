export type LineStatus = "RUNNING" | "IDLE" | "STOPPED";

export type MonitoringLineSnapshot = {
  line: string;
  status: LineStatus;
  workOrderCode: string | null;
  itemName: string | null;
  processName: string | null;
  oee: number;
  outputQty: number;
  targetQty: number;
  defectRate: number;
};
