export type MotionVector = {
  x: number;
  y: number;
  z: number;
};

export type SensorReadingPayload = {
  recordedAt: string;
  accelerometer: MotionVector;
  gyroscope: MotionVector;
};

export type SensorReadingResponse = {
  id: string;
  status: "ACCEPTED";
  detectionStatus: "NORMAL" | "FALL_SUSPECTED" | "INACTIVITY_DETECTED";
  recordedAt: string;
  receivedAt: string;
  accelerationMagnitude: number | null;
  rotationMagnitude: number | null;
};

