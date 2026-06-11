import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
import { appConfig } from "./src/config/appConfig";
import { clearDeviceSession, loadDeviceSession, saveDeviceSession } from "./src/storage/deviceSession";
import type { StoredDeviceSession } from "./src/types/device";

export default function App() {
  const [pairingCode, setPairingCode] = useState("");
  const [session, setSession] = useState<StoredDeviceSession | null>(null);
  const [status, setStatus] = useState("Ready to pair");
  const [isLoading, setIsLoading] = useState(true);
  const [isPairing, setIsPairing] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const storedSession = await loadDeviceSession();
      setSession(storedSession);
      setStatus(storedSession ? "Device paired" : "Ready to pair");
      setIsLoading(false);
    };

    void restoreSession();
  }, []);

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
    await clearDeviceSession();
    setSession(null);
    setStatus("Ready to pair");
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

