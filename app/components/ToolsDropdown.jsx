/* eslint-disable prettier/prettier */
import React from "react";
import { Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function ToolsDropdown({ visible, onClose, dropdownStyle }) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.dropdown, dropdownStyle]}>
          <TouchableOpacity
            style={styles.itemRow}
            onPress={() => { router.push("/QualityGuide"); onClose(); }}
          >
            <Ionicons name="book-outline" size={20} color="#222" style={styles.icon} />
            <Text style={styles.item}>Quality Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.itemRow}
          >
            <Ionicons name="help-circle-outline" size={24} color="#222" style={styles.icon} />
            <Text style={styles.item}>Help</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.01)", // slight overlay, adjust as needed
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  dropdown: {
    marginTop: 65,
    marginLeft: 180,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 8,
    padding: 8,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  icon: {
    marginRight: 10,
  },
  item: {
    fontSize: 16,
    color: "#222",
  },
});