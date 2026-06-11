import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { appConfig } from "./src/config/appConfig";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.brand}>SafeMotion</Text>
          <Text style={styles.badge}>Mobile setup</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.title}>Device safety companion</Text>
          <Text style={styles.description}>
            Pairing, motion sensor upload, and fall confirmation will be implemented in the next mobile phases.
          </Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>API</Text>
            <Text style={styles.infoValue}>{appConfig.apiBaseUrl}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Socket</Text>
            <Text style={styles.infoValue}>{appConfig.socketUrl}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f7f6"
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

