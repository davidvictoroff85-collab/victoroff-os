import actionData from "./actions.json";
import type { ShareholderActionV1 } from "@victoroff/contracts";

export const shareholderActions = actionData as ShareholderActionV1[];

export const syntheticStaffRecords = [
  {
    id: "SYN-104",
    title: "September distribution guidance",
    revision: 3,
    state: "in_review",
    owner: "Communications — synthetic",
  },
  {
    id: "SYN-108",
    title: "Descendant enrollment source review",
    revision: 2,
    state: "approved",
    owner: "Shareholder Services — synthetic",
  },
] as const;
