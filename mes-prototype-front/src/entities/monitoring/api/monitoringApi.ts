import { api } from "@/shared/api/axios";
import type { MonitoringLineSnapshot } from "../model/types";

export const monitoringApi = {
  snapshot: () =>
    api
      .get<MonitoringLineSnapshot[]>("/api/monitoring/snapshot")
      .then((r) => r.data),
};
