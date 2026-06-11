import { Accelerometer, Gyroscope } from "expo-sensors";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { pairDevice } from "./src/api/deviceApi";
import { uploadSensorReading } from "./src/api/sensorApi";
import { appConfig } from "./src/config/appConfig";
import { clearDeviceSession, loadDeviceSession, saveDeviceSession } from "./src/storage/deviceSession";
import type { StoredDeviceSession } from "./src/types/device";
import type { MotionVector, SensorReadingResponse } from "./src/types/sensorReading";

const SENSOR_UPDATE_INTERVAL_MS = 500;
const SENSOR_UPLOAD_INTERVAL_MS = 2_000;

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
  const [isLoading, setIsLoading] = useState(true);
  const [isPairing, setIsPairing] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [accelerometer, setAccelerometer] = useState<MotionVector>(emptyVector);
  const [gyroscope, setGyroscope] = useState<MotionVector>(emptyVector);
  const [latestUpload, setLatestUpload] = useState<SensorReadingResponse | null>(null);
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
    setStatus("Ready to pair");
  };

  const toggleMonitoring = () => {
    if (!session) {
      return;
    }

    setIsMonitoring((current) => !current);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#15735d" />
          <Text style={styles.description}>Loading device session</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.brand}>SafeMotion</Text>
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

        {session ? (
          <View style={styles.infoGrid}>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f7f6"
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  screen: {
    flex: 1,
    padding: 22,
    gap: 18
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  brand: {
    color: "#10231f",
    fontSize: 28,
    fontWeight: "800"
  },
  badge: {
    overflow: "hidden",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#ffffff",
    backgroundColor: "#15735d",
    fontSize: 13,
    fontWeight: "700"
  },
  panel: {
    borderWidth: 1,
    borderColor: "#d9e3e0",
    borderRadius: 8,
    padding: 18,
    backgroundColor: "#ffffff"
  },
  title: {
    marginBottom: 8,
    color: "#17202a",
    fontSize: 24,
    fontWeight: "800"
  },
  sectionTitle: {
    marginBottom: 8,
    color: "#17202a",
    fontSize: 18,
    fontWeight: "800"
  },
  description: {
    color: "#405650",
    fontSize: 16,
    lineHeight: 24
  },
  form: {
    gap: 10
  },
  inputLabel: {
    color: "#405650",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  input: {
    borderWidth: 1,
    borderColor: "#b7c9c3",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#17202a",
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
    backgroundColor: "#15735d"
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
  secondaryButton: {
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#b7c9c3",
    borderRadius: 8,
    paddingVertical: 12,
    backgroundColor: "#ffffff"
  },
  secondaryButtonText: {
    color: "#10231f",
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
    borderColor: "#d9e3e0",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#ffffff"
  },
  infoLabel: {
    marginBottom: 4,
    color: "#5c6f6a",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  infoValue: {
    color: "#17202a",
    fontSize: 15,
    fontWeight: "700"
  }
});
