/* eslint-disable prettier/prettier */
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function SyncModal({ visible, onCancel, onConfirm }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
        />

        <View style={styles.card}>
          <Text style={styles.title}>Sync store and product data</Text>
          <Text style={styles.message}>
            This will update the store and product information in your device
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onConfirm}
            >
              <Text style={styles.primaryText}>Start syncing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#e15050",
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: "#609966",
    marginLeft: 8,
  },
  cancelText: {
    color: "#fff",
    fontWeight: "700",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
  },
});