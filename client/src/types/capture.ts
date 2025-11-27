export interface CaptureApiPayload {
  error?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface CaptureResult {
  roomCode: string;
  completedAt: string;
  apiResponse: CaptureApiPayload;
}
