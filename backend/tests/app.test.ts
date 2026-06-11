import request from "supertest";

import { createApp } from "../src/app.js";

const app = createApp();

describe("SafeMotion API app", () => {
  it("returns backend health status", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      service: "safemotion-backend"
    });
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it("serves the OpenAPI document", async () => {
    const response = await request(app).get("/openapi.json").expect(200);

    expect(response.body.info.title).toBe("SafeMotion API");
    expect(response.body.paths).toHaveProperty("/auth/login");
    expect(response.body.paths).toHaveProperty("/auth/signup");
    expect(response.body.paths).toHaveProperty("/monitored-persons");
    expect(response.body.paths).toHaveProperty("/monitored-persons/{id}");
    expect(response.body.paths).toHaveProperty("/devices/pair");
    expect(response.body.paths).toHaveProperty("/sensor-readings");
    expect(response.body.components.securitySchemes).toHaveProperty("deviceTokenAuth");
  });

  it("returns validation errors for invalid login body", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({
        email: "invalid-email",
        password: ""
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns a bad request for malformed JSON", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send("{")
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it("requires JWT for protected alert routes", async () => {
    const response = await request(app).get("/api/v1/alerts").expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("requires JWT for monitored person routes", async () => {
    const response = await request(app).get("/api/v1/monitored-persons").expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("requires JWT for alert CSV export", async () => {
    const response = await request(app).get("/api/v1/alerts/export.csv").expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("requires device token for sensor upload", async () => {
    const response = await request(app)
      .post("/api/v1/sensor-readings")
      .send({
        recordedAt: new Date().toISOString(),
        accelerometer: { x: 0, y: 9.81, z: 0 },
        gyroscope: { x: 0, y: 0, z: 0 }
      })
      .expect(401);

    expect(response.body.error.code).toBe("INVALID_DEVICE_TOKEN");
  });

  it("returns not found for unknown routes", async () => {
    const response = await request(app).get("/api/v1/unknown").expect(404);

    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
