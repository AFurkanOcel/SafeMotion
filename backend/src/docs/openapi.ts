export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "SafeMotion API",
    version: "0.1.0",
    description:
      "REST API for SafeMotion, a verified fall and inactivity monitoring platform using device-token mobile uploads and JWT dashboard access."
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Local development API"
    }
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Monitored Persons" },
    { name: "Devices" },
    { name: "Sensor Readings" },
    { name: "Confirmation Responses" },
    { name: "Alerts" },
    { name: "Database" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      deviceTokenAuth: {
        type: "http",
        scheme: "bearer",
        description: "Device token returned by the mobile device pairing endpoint."
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Invalid request body" }
            },
            required: ["code", "message"]
          }
        },
        required: ["error"]
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          fullName: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "CAREGIVER"] }
        },
        required: ["id", "email", "fullName", "role"]
      },
      MonitoredPerson: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          displayName: { type: "string", example: "Demo Patient" },
          notes: { type: "string", nullable: true },
          caregiverId: { type: "string", format: "uuid" },
          createdById: { type: "string", format: "uuid" },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "displayName", "caregiverId", "createdById", "isActive", "createdAt", "updatedAt"]
      },
      SensorVector: {
        type: "object",
        properties: {
          x: { type: "number", example: 0.12 },
          y: { type: "number", example: 9.81 },
          z: { type: "number", example: 0.34 }
        },
        required: ["x", "y", "z"]
      },
      Alert: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          monitoredPersonId: { type: "string", format: "uuid" },
          detectionEventId: { type: "string", format: "uuid", nullable: true },
          status: { type: "string", enum: ["ACTIVE", "RESOLVED"] },
          severity: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          title: { type: "string" },
          message: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          resolvedAt: { type: "string", format: "date-time", nullable: true }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check backend health",
        responses: {
          "200": {
            description: "Backend is running"
          }
        }
      }
    },
    "/database/health": {
      get: {
        tags: ["Database"],
        summary: "Check database connectivity",
        responses: {
          "200": { description: "Database is connected" },
          "500": { description: "Database check failed", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in a dashboard user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email", example: "caregiver@example.com" },
                  password: { type: "string", example: "StrongPassword123!" }
                },
                required: ["email", "password"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Login succeeded"
          },
          "401": { description: "Invalid credentials" }
        }
      }
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a caregiver dashboard account",
        description: "Public signup creates caregiver accounts only. Admin accounts are created by seed data or by an authenticated admin.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email", example: "newcaregiver@example.com" },
                  password: { type: "string", minLength: 8, example: "StrongPassword123!" },
                  fullName: { type: "string", example: "New Caregiver" }
                },
                required: ["email", "password", "fullName"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Caregiver account created and signed in" },
          "400": { description: "Invalid signup body" },
          "409": { description: "Email already exists" }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a dashboard user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  fullName: { type: "string" },
                  role: { type: "string", enum: ["ADMIN", "CAREGIVER"] }
                },
                required: ["email", "password", "fullName", "role"]
              }
            }
          }
        },
        responses: {
          "201": { description: "User registered" },
          "403": { description: "Admin role required" },
          "409": { description: "Email already exists" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current dashboard user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Current user" },
          "401": { description: "JWT is missing or invalid" }
        }
      }
    },
    "/monitored-persons": {
      get: {
        tags: ["Monitored Persons"],
        summary: "List monitored persons available to the current dashboard user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Monitored person list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/MonitoredPerson" }
                    }
                  },
                  required: ["items"]
                }
              }
            }
          },
          "401": { description: "JWT is missing or invalid" }
        }
      },
      post: {
        tags: ["Monitored Persons"],
        summary: "Create a monitored person",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: "string", minLength: 2, example: "Demo Patient" },
                  notes: { type: "string", maxLength: 500, example: "Lives alone and carries the paired phone." },
                  caregiverId: {
                    type: "string",
                    format: "uuid",
                    description: "Optional for admins. Caregivers can only create monitored persons for themselves."
                  }
                },
                required: ["displayName"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Monitored person created" },
          "400": { description: "Invalid request body" },
          "403": { description: "User cannot assign this monitored person" },
          "404": { description: "Caregiver was not found" }
        }
      }
    },
    "/monitored-persons/{id}": {
      get: {
        tags: ["Monitored Persons"],
        summary: "Get a monitored person by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Monitored person details" },
          "403": { description: "User cannot access this monitored person" },
          "404": { description: "Monitored person not found" }
        }
      }
    },
    "/devices/pairing-codes": {
      post: {
        tags: ["Devices"],
        summary: "Create a temporary mobile device pairing code",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  monitoredPersonId: { type: "string", format: "uuid" },
                  deviceName: { type: "string", example: "Demo Android Phone" },
                  platform: { type: "string", enum: ["IOS", "ANDROID", "UNKNOWN"] }
                },
                required: ["monitoredPersonId", "deviceName"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Pairing code created" },
          "403": { description: "User cannot access the monitored person" }
        }
      }
    },
    "/devices/pair": {
      post: {
        tags: ["Devices"],
        summary: "Pair a mobile device and receive a device token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  pairingCode: { type: "string", example: "842913" },
                  deviceName: { type: "string" },
                  platform: { type: "string", enum: ["IOS", "ANDROID", "UNKNOWN"] }
                },
                required: ["pairingCode", "deviceName"]
              }
            }
          }
        },
        responses: {
          "200": { description: "Device paired" },
          "401": { description: "Invalid pairing code" },
          "410": { description: "Pairing code expired" }
        }
      }
    },
    "/devices/me": {
      get: {
        tags: ["Devices"],
        summary: "Get the current paired device",
        security: [{ deviceTokenAuth: [] }],
        responses: {
          "200": { description: "Current device" },
          "401": { description: "Device token is missing or invalid" }
        }
      }
    },
    "/devices/me/active-confirmation": {
      get: {
        tags: ["Confirmation Responses"],
        summary: "Get the active fall confirmation request for the paired device",
        security: [{ deviceTokenAuth: [] }],
        responses: {
          "200": { description: "Active confirmation request" },
          "404": { description: "No active confirmation request" }
        }
      }
    },
    "/devices/{id}/status": {
      get: {
        tags: ["Devices"],
        summary: "Get device status for dashboard users",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Device status" },
          "403": { description: "User cannot access this device" },
          "404": { description: "Device not found" }
        }
      }
    },
    "/sensor-readings": {
      post: {
        tags: ["Sensor Readings"],
        summary: "Upload one accelerometer and gyroscope reading",
        security: [{ deviceTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  recordedAt: { type: "string", format: "date-time" },
                  accelerometer: { $ref: "#/components/schemas/SensorVector" },
                  gyroscope: { $ref: "#/components/schemas/SensorVector" }
                },
                required: ["recordedAt", "accelerometer", "gyroscope"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Reading accepted and analyzed" },
          "401": { description: "Device token is missing or invalid" }
        }
      }
    },
    "/sensor-readings/batch": {
      post: {
        tags: ["Sensor Readings"],
        summary: "Upload a batch of sensor readings",
        security: [{ deviceTokenAuth: [] }],
        responses: {
          "201": { description: "Batch accepted" },
          "400": { description: "Invalid batch" }
        }
      }
    },
    "/sensor-readings/monitored-persons/{monitoredPersonId}": {
      get: {
        tags: ["Sensor Readings"],
        summary: "List sensor readings for a monitored person",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "monitoredPersonId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 500 } },
          { name: "from", in: "query", required: false, schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", required: false, schema: { type: "string", format: "date-time" } }
        ],
        responses: {
          "200": { description: "Sensor readings" },
          "403": { description: "User cannot access this monitored person" }
        }
      }
    },
    "/confirmation-responses": {
      post: {
        tags: ["Confirmation Responses"],
        summary: "Submit a mobile fall confirmation response",
        security: [{ deviceTokenAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  detectionEventId: { type: "string", format: "uuid" },
                  response: { type: "string", enum: ["SAFE", "NEEDS_HELP"] }
                },
                required: ["detectionEventId", "response"]
              }
            }
          }
        },
        responses: {
          "201": { description: "Confirmation response accepted" },
          "403": { description: "Device cannot respond to this event" },
          "409": { description: "Event is already closed" }
        }
      }
    },
    "/alerts": {
      get: {
        tags: ["Alerts"],
        summary: "List alerts",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", required: false, schema: { type: "string", enum: ["ACTIVE", "RESOLVED"] } },
          { name: "severity", in: "query", required: false, schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
          { name: "monitoredPersonId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200 } }
        ],
        responses: {
          "200": { description: "Alert list" }
        }
      }
    },
    "/alerts/export.csv": {
      get: {
        tags: ["Alerts"],
        summary: "Export alert history as CSV",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", required: false, schema: { type: "string", enum: ["ACTIVE", "RESOLVED"] } },
          { name: "severity", in: "query", required: false, schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
          { name: "monitoredPersonId", in: "query", required: false, schema: { type: "string", format: "uuid" } },
          { name: "from", in: "query", required: false, schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", required: false, schema: { type: "string", format: "date-time" } }
        ],
        responses: {
          "200": {
            description: "CSV alert export",
            content: {
              "text/csv": {
                schema: {
                  type: "string",
                  example: "id,status,severity,title,createdAt,resolvedAt\nalert-id,ACTIVE,CRITICAL,Critical fall alert,2026-06-11T12:00:00.000Z,"
                }
              }
            }
          }
        }
      }
    },
    "/alerts/{id}": {
      get: {
        tags: ["Alerts"],
        summary: "Get an alert by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Alert details" },
          "403": { description: "User cannot access this alert" },
          "404": { description: "Alert not found" }
        }
      }
    },
    "/alerts/{id}/resolve": {
      patch: {
        tags: ["Alerts"],
        summary: "Resolve an active alert",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  resolutionNote: { type: "string", maxLength: 500 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Alert resolved" },
          "409": { description: "Alert already resolved" }
        }
      }
    }
  }
} as const;
