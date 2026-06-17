import { api } from "@/shared/api/axios";
import type { MrpCalculateBody, MrpCalculateResult } from "../model/types";

export const mrpApi = {
  calculate: (body: MrpCalculateBody) =>
    api.post<MrpCalculateResult>("/api/mrp/calculate", body).then((r) => r.data),
};
