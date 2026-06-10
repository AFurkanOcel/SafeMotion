import { z } from "zod";

const sensorAxisSchema = z.number().finite().min(-200).max(200);

const readingPayloadSchema = z.object({
  recordedAt: z.string().datetime(),
  accelerometer: z.object({
    x: sensorAxisSchema,
    y: sensorAxisSchema,
    z: sensorAxisSchema
  }),
  gyroscope: z.object({
    x: sensorAxisSchema,
    y: sensorAxisSchema,
    z: sensorAxisSchema
  })
});

export const createSensorReadingSchema = z.object({
  body: readingPayloadSchema
});

export const createSensorReadingBatchSchema = z.object({
  body: z.object({
    readings: z.array(readingPayloadSchema).min(1).max(100)
  })
});

export const listSensorReadingsSchema = z.object({
  params: z.object({
    monitoredPersonId: z.string().uuid()
  }),
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .pipe(z.number().int().min(1).max(500))
      .default("100"),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  })
});

export type SensorReadingPayload = z.infer<typeof createSensorReadingSchema>["body"];
export type SensorReadingBatchInput = z.infer<typeof createSensorReadingBatchSchema>["body"];
export type ListSensorReadingsInput = z.infer<typeof listSensorReadingsSchema>;

