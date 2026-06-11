import { Accelerometer, Gyroscope } from "expo-sensors";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { getActiveConfirmation, submitConfirmationResponse } from "./src/api/confirmationApi";
import { pairDevice } from "./src/api/deviceApi";
import { getBackendHealth } from "./src/api/healthApi";
import { uploadSensorReading } from "./src/api/sensorApi";
import { appConfig } from "./src/config/appConfig";
import { clearDeviceSession, loadDeviceSession, saveDeviceSession } from "./src/storage/deviceSession";
import type { ActiveConfirmationRequest, ConfirmationResponseType } from "./src/types/confirmation";
import type { StoredDeviceSession } from "./src/types/device";
import type { MotionVector, SensorReadingResponse } from "./src/types/sensorReading";

const SENSOR_UPDATE_INTERVAL_MS = 500;
const SENSOR_UPLOAD_INTERVAL_MS = 2_000;
const CONFIRMATION_POLL_INTERVAL_MS = 3_000;
const APP_ICON = require("./assets/safemotion.png");

type ConnectionState = "checking" | "online" | "offline";

const emptyVector: MotionVector = {
  x: 0,
  y: 0,
  z: 0
};

const formatVector = (vector: MotionVector) =>
  `x ${vector.x.toFixed(2)}  y ${vector.y.toFixed(2)}  z ${vector.z.toFixed(2)}`;

export default function App() {
  const [pairingCode, setPairingCode] = useState("");
  const [session, setSession] = useState<StoredDeviceSession | null>(null);
  const [status, setStatus] = useState("Ready to pair");
  const [connectionState, setConnectionState] = useState<ConnectionState>("checking");
  const [connectionMessage, setConnectionMessage] = useState("Checking backend connection");
  const [isLoading, setIsLoading] = useState(true);
  const [isPairing, setIsPairing] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isSendingDemoFall, setIsSendingDemoFall] = useState(false);
  const [accelerometer, setAccelerometer] = useState<MotionVector>(emptyVector);
  const [gyroscope, setGyroscope] = useState<MotionVector>(emptyVector);
  const [latestUpload, setLatestUpload] = useState<SensorReadingResponse | null>(null);
  const [activeConfirmation, setActiveConfirmation] = useState<ActiveConfirmationRequest | null>(null);
  const [lastConfirmationAction, setLastConfirmationAction] = useState("No confirmation response sent yet");
  const latestAccelerometerRef = useRef<MotionVector>(emptyVector);
  const latestGyroscopeRef = useRef<MotionVector>(emptyVector);
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      const storedSession = await loadDeviceSession();
      setSession(storedSession);
      setStatus(storedSession ? "Device paired" : "Ready to pair");
      setIsLoading(false);
    };

    void restoreSession();
  }, []);

  const checkBackendConnection = async () => {
    setConnectionState("checking");
    setConnectionMessage("Checking backend connection");

    try {
      const health = await getBackendHealth();
      setConnectionState("online");
      setConnectionMessage(`${health.service} online`);
    } catch (error) {
      setConnectionState("offline");
      setConnectionMessage(error instanceof Error ? error.message : "Backend connection failed");
    }
  };

  useEffect(() => {
    void checkBackendConnection();
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const refreshConfirmation = async () => {
      try {
        const confirmation = await getActiveConfirmation(session.deviceToken);
        setActiveConfirmation(confirmation);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Confirmation check failed");
      }
    };

    void refreshConfirmation();
    const timer = setInterval(() => {
      void refreshConfirmation();
    }, CONFIRMATION_POLL_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [session]);

  useEffect(() => {
    if (!isMonitoring || !session) {
      return undefined;
    }

    Accelerometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);
    Gyroscope.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS);

    const accelerometerSubscription = Accelerometer.addListener((reading) => {
      const nextReading = {
        x: reading.x,
        y: reading.y,
        z: reading.z
      };

      latestAccelerometerRef.current = nextReading;
      setAccelerometer(nextReading);
    });

    const gyroscopeSubscription = Gyroscope.addListener((reading) => {
      const nextReading = {
        x: reading.x,
        y: reading.y,
        z: reading.z
      };

      latestGyroscopeRef.current = nextReading;
      setGyroscope(nextReading);
    });

    uploadTimerRef.current = setInterval(() => {
      const payload = {
        recordedAt: new Date().toISOString(),
        accelerometer: latestAccelerometerRef.current,
        gyroscope: latestGyroscopeRef.current
      };

      void uploadSensorReading(session.deviceToken, payload)
        .then((result) => {
          setLatestUpload(result);
          setStatus(`Upload accepted: ${result.detectionStatus}`);

          if (result.detectionStatus === "FALL_SUSPECTED") {
            void getActiveConfirmation(session.deviceToken)
              .then((confirmation) => setActiveConfirmation(confirmation))
              .catch(() => undefined);
          }
        })
        .catch((error) => {
          setStatus(error instanceof Error ? error.message : "Sensor upload failed");
        });
    }, SENSOR_UPLOAD_INTERVAL_MS);

    setStatus("Monitoring started");

    return () => {
      accelerometerSubscription.remove();
      gyroscopeSubscription.remove();

      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
    };
  }, [isMonitoring, session]);

  const handlePair = async () => {
    const normalizedCode = pairingCode.trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      Alert.alert("Invalid code", "Enter the 6-digit pairing code from the dashboard.");
      return;
    }

    setIsPairing(true);
    setStatus("Pairing device");

    try {
      const result = await pairDevice(normalizedCode);
      const nextSession: StoredDeviceSession = {
        ...result,
        pairedAt: new Date().toISOString()
      };

      await saveDeviceSession(nextSession);
      setSession(nextSession);
      setPairingCode("");
      setStatus("Device paired");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pairing failed";
      setStatus(message);
      Alert.alert("Pairing failed", message);
    } finally {
      setIsPairing(false);
    }
  };

  const handleReset = async () => {
    setIsMonitoring(false);
    await clearDeviceSession();
    setSession(null);
    setLatestUpload(null);
    setActiveConfirmation(null);
    setStatus("Ready to pair");
  };

  const toggleMonitoring = () => {
    if (!session) {
      return;
    }

    setIsMonitoring((current) => !current);
  };

  const handleConfirmationResponse = async (responseType: ConfirmationResponseType) => {
    if (!session || !activeConfirmation) {
      return;
    }

    setIsResponding(true);

    try {
      const result = await submitConfirmationResponse(session.deviceToken, activeConfirmation.detectionEventId, responseType);
      setActiveConfirmation(null);
      setLastConfirmationAction(responseType === "SAFE" ? "Safe response sent" : "Help request sent");
      setStatus(`Confirmation submitted: ${result.status}`);
      Alert.alert("Confirmation sent", responseType === "SAFE" ? "Your safe response was submitted." : "Help request was submitted.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Confirmation response failed";
      setStatus(message);
      Alert.alert("Confirmation failed", message);
    } finally {
      setIsResponding(false);
    }
  };

  const handleSendDemoFallReading = async () => {
    if (!session) {
      return;
    }

    setIsSendingDemoFall(true);
    setStatus("Sending demo fall reading");

    try {
      const result = await uploadSensorReading(session.deviceToken, {
        recordedAt: new Date().toISOString(),
        accelerometer: {
          x: 0,
          y: 0,
          z: 28
        },
        gyroscope: {
          x: 0,
          y: 0,
          z: 9.5
        }
      });

      setLatestUpload(result);
      setAccelerometer({ x: 0, y: 0, z: 28 });
      setGyroscope({ x: 0, y: 0, z: 9.5 });
      setStatus(`Demo upload accepted: ${result.detectionStatus}`);

      if (result.detectionStatus === "FALL_SUSPECTED") {
        const confirmation = await getActiveConfirmation(session.deviceToken);
        setActiveConfirmation(confirmation);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo fall upload failed";
      setStatus(message);
      Alert.alert("Demo fall failed", message);
    } finally {
      setIsSendingDemoFall(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#1261a6" />
          <Text style={styles.description}>Loading device session</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.brandGroup}>
              <Image source={APP_ICON} style={styles.brandIcon} />
              <Text style={styles.brand}>SafeMotion</Text>
            </View>
            <Text style={styles.badge}>{session ? "Paired" : "Pairing"}</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.title}>{session ? "Device is paired" : "Pair this phone"}</Text>
            <Text style={styles.description}>
              {session
                ? "This phone is authorized to send SafeMotion data with a device token."
                : "Enter the 6-digit code generated from the caregiver dashboard."}
            </Text>
          </View>

          <View style={styles.connectionPanel}>
            <View style={styles.connectionHeader}>
              <View style={[styles.connectionDot, styles[`connectionDot_${connectionState}`]]} />
              <Text style={styles.connectionTitle}>
                {connectionState === "online"
                  ? "Backend online"
                  : connectionState === "checking"
                    ? "Checking backend"
                    : "Backend offline"}
              </Text>
            </View>
            <Text style={styles.description}>{connectionMessage}</Text>
            {appConfig.usesLocalhost ? (
              <Text style={styles.warningText}>
                Physical phones need your computer LAN IP instead of localhost.
              </Text>
            ) : null}
            <Pressable style={styles.secondaryButton} onPress={() => void checkBackendConnection()}>
              <Text style={styles.secondaryButtonText}>Check connection</Text>
            </Pressable>
          </View>

          {session ? (
            <View style={styles.infoGrid}>
              {activeConfirmation ? (
                <View style={styles.confirmationPanel}>
                  <Text style={styles.confirmationKicker}>Fall confirmation required</Text>
                  <Text style={styles.confirmationTitle}>Are you okay?</Text>
                  <Text style={styles.confirmationMessage}>{activeConfirmation.message}</Text>
                  <Text style={styles.confirmationText}>Severity: {activeConfirmation.severity}</Text>
                  <View style={styles.confirmationActions}>
                    <Pressable
                      style={[styles.safeButton, isResponding && styles.disabledButton]}
                      onPress={() => void handleConfirmationResponse("SAFE")}
                      disabled={isResponding}
                    >
                      <Text style={styles.primaryButtonText}>I'm safe</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.dangerButton, isResponding && styles.disabledButton]}
                      onPress={() => void handleConfirmationResponse("NEEDS_HELP")}
                      disabled={isResponding}
                    >
                      <Text style={styles.primaryButtonText}>Need help</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.confirmationStatusPanel}>
                  <Text style={styles.infoLabel}>Confirmation status</Text>
                  <Text style={styles.infoValue}>{lastConfirmationAction}</Text>
                </View>
              )}

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Device ID</Text>
                <Text style={styles.infoValue}>{session.deviceId}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Monitored person ID</Text>
                <Text style={styles.infoValue}>{session.monitoredPersonId}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Paired at</Text>
                <Text style={styles.infoValue}>{new Date(session.pairedAt).toLocaleString()}</Text>
              </View>
              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Motion upload</Text>
                <Text style={styles.description}>
                  {isMonitoring
                    ? "Accelerometer and gyroscope readings are being uploaded to the backend."
                    : "Start monitoring to upload live motion readings with the device token."}
                </Text>
                <Pressable style={isMonitoring ? styles.dangerButton : styles.primaryButton} onPress={toggleMonitoring}>
                  <Text style={styles.primaryButtonText}>{isMonitoring ? "Stop monitoring" : "Start monitoring"}</Text>
                </Pressable>
              </View>
              <View style={styles.demoPanel}>
                <Text style={styles.sectionTitle}>Demo fall trigger</Text>
                <Text style={styles.description}>
                  Send one controlled test reading that crosses the fall detection threshold.
                </Text>
                <Pressable
                  style={[styles.warningButton, isSendingDemoFall && styles.disabledButton]}
                  onPress={() => void handleSendDemoFallReading()}
                  disabled={isSendingDemoFall}
                >
                  <Text style={styles.primaryButtonText}>
                    {isSendingDemoFall ? "Sending demo reading..." : "Send test fall reading"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Accelerometer</Text>
                <Text style={styles.infoValue}>{formatVector(accelerometer)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Gyroscope</Text>
                <Text style={styles.infoValue}>{formatVector(gyroscope)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Latest upload</Text>
                <Text style={styles.infoValue}>
                  {latestUpload
                    ? `${latestUpload.detectionStatus} at ${new Date(latestUpload.receivedAt).toLocaleTimeString()}`
                    : "No upload yet"}
                </Text>
              </View>
              <Pressable style={styles.secondaryButton} onPress={handleReset}>
                <Text style={styles.secondaryButtonText}>Reset pairing</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.inputLabel}>Pairing code</Text>
              <TextInput
                value={pairingCode}
                onChangeText={(value) => setPairingCode(value.replace(/\D/g, "").slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
                placeholderTextColor="#83948f"
                style={styles.input}
              />
              <Pressable style={[styles.primaryButton, isPairing && styles.disabledButton]} onPress={handlePair} disabled={isPairing}>
                <Text style={styles.primaryButtonText}>{isPairing ? "Pairing..." : "Pair device"}</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>{status}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>API</Text>
              <Text style={styles.infoValue}>{appConfig.apiBaseUrl}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f8fc"
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  screen: {
    flex: 1
  },
  scrollContent: {
    padding: 22,
    gap: 18,
    paddingBottom: 36
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  brand: {
    color: "#10243f",
    fontSize: 28,
    fontWeight: "800"
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 8
  },
  badge: {
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#ffffff",
    backgroundColor: "#1261a6",
    fontSize: 13,
    fontWeight: "700"
  },
  panel: {
    borderWidth: 1,
    borderColor: "#d7e5f2",
    borderRadius: 8,
    padding: 18,
    backgroundColor: "#ffffff"
  },
  connectionPanel: {
    borderWidth: 1,
    borderColor: "#d7e5f2",
    borderRadius: 8,
    gap: 10,
    padding: 18,
    backgroundColor: "#ffffff"
  },
  connectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 999
  },
  connectionDot_checking: {
    backgroundColor: "#f6c76f"
  },
  connectionDot_online: {
    backgroundColor: "#16a34a"
  },
  connectionDot_offline: {
    backgroundColor: "#b42318"
  },
  connectionTitle: {
    color: "#172033",
    fontSize: 16,
    fontWeight: "800"
  },
  warningText: {
    color: "#8a4b05",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  title: {
    marginBottom: 8,
    color: "#172033",
    fontSize: 24,
    fontWeight: "800"
  },
  sectionTitle: {
    marginBottom: 8,
    color: "#172033",
    fontSize: 18,
    fontWeight: "800"
  },
  description: {
    color: "#405a78",
    fontSize: 16,
    lineHeight: 24
  },
  form: {
    gap: 10
  },
  inputLabel: {
    color: "#405a78",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  input: {
    borderWidth: 1,
    borderColor: "#bdd1e5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#172033",
    backgroundColor: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0,
    textAlign: "center"
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    backgroundColor: "#1261a6"
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800"
  },
  dangerButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    backgroundColor: "#b42318"
  },
  warningButton: {
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    backgroundColor: "#8a4b05"
  },
  safeButton: {
    flex: 1,
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    backgroundColor: "#1261a6"
  },
  confirmationPanel: {
    borderWidth: 1,
    borderColor: "#f2a19b",
    borderRadius: 8,
    gap: 8,
    padding: 18,
    backgroundColor: "#fff1f0"
  },
  confirmationKicker: {
    color: "#b42318",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  confirmationTitle: {
    color: "#172033",
    fontSize: 28,
    fontWeight: "900"
  },
  confirmationMessage: {
    color: "#405a78",
    fontSize: 16,
    lineHeight: 24
  },
  confirmationText: {
    color: "#9f1c12",
    fontSize: 15,
    fontWeight: "700"
  },
  confirmationActions: {
    flexDirection: "row",
    gap: 10
  },
  demoPanel: {
    borderWidth: 1,
    borderColor: "#f6c76f",
    borderRadius: 8,
    gap: 12,
    padding: 18,
    backgroundColor: "#fff7e6"
  },
  confirmationStatusPanel: {
    borderWidth: 1,
    borderColor: "#d7e5f2",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#f8fbff"
  },
  secondaryButton: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bdd1e5",
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "#ffffff"
  },
  secondaryButtonText: {
    color: "#10243f",
    fontSize: 15,
    fontWeight: "800"
  },
  disabledButton: {
    opacity: 0.6
  },
  infoGrid: {
    gap: 12
  },
  infoItem: {
    borderWidth: 1,
    borderColor: "#d7e5f2",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#ffffff"
  },
  infoLabel: {
    marginBottom: 4,
    color: "#617995",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  infoValue: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "700"
  }
});
