import actionData from "./actions.json";
import type { ShareholderActionV1 } from "@victoroff/contracts";

export const shareholderActions = actionData as ShareholderActionV1[];

export const syntheticStaffRecords = [
  {
    id: "SYN-104",
    title: "Supplier bank-detail change guidance",
    revision: 3,
    state: "in_review",
    owner: "Payment operations — synthetic",
  },
  {
    id: "SYN-108",
    title: "Payment exception policy review",
    revision: 2,
    state: "approved",
    owner: "Accounts payable — synthetic",
  },
] as const;
