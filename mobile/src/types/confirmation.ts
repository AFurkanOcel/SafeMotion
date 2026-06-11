export type ActiveConfirmationRequest = {
  detectionEventId: string;
  message: string;
  actions: string[];
  startedAt: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

export type ConfirmationResponseType = "SAFE" | "NEEDS_HELP";

export type ConfirmationResponseResult = {
  id: string;
  detectionEventId: string;
  response: ConfirmationResponseType;
  respondedAt: string;
  status: "SAFE_CONFIRMED" | "ESCALATED";
};

