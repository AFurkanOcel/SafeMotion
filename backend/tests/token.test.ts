import { createDeviceToken, createPairingCode, hashDeviceSecret } from "../src/utils/token.js";

describe("device token utilities", () => {
  it("creates six digit pairing codes", () => {
    expect(createPairingCode()).toMatch(/^\d{6}$/);
  });

  it("creates device tokens and deterministic hashes", () => {
    const token = createDeviceToken();
    const hash = hashDeviceSecret(token);

    expect(token).toHaveLength(64);
    expect(hash).toBe(hashDeviceSecret(token));
    expect(hash).not.toBe(token);
  });
});

