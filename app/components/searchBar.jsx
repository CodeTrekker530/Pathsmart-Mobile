/* eslint-disable prettier/prettier */
// app/components/SearchBar.jsx
import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import NetInfo from "@react-native-community/netinfo"; // ✅ ADD THIS
import ToolsDropdown from "./ToolsDropdown";
import SyncModal from "./SyncModal";
import { syncProducts, syncStalls } from "../services/syncService";

// Global variable to store last search text
if (typeof global !== 'undefined') {
  global.__SHOPPING_LIST_SEARCH__ = global.__SHOPPING_LIST_SEARCH__ || "";
}

export default function SearchBar({ placeholder = "What are you looking for?" }) {
  const [text, setText] = useState(typeof global !== 'undefined' ? global.__SHOPPING_LIST_SEARCH__ : "");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [syncModalVisible, setSyncModalVisible] = useState(false);
  const router = useRouter();

  // ✅ NEW: Handle sync button press
  const handleSyncPress = async () => {
    const state = await NetInfo.fetch();

    if (state.isConnected && state.isInternetReachable) {
      setSyncModalVisible(true); // ✅ show modal
    } else {
      Alert.alert(
        "No Internet",
        "You can still use the app offline. Connect to the internet to sync latest data."
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Group with Logo */}
      <View style={styles.filterSearchGroup}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.searchLogo}
          />
        </TouchableOpacity>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchBox}
            placeholder={placeholder}
            placeholderTextColor="#909090"
            value={text}
            onChangeText={val => {
              setText(val);
              if (typeof global !== 'undefined') global.__SHOPPING_LIST_SEARCH__ = val;
            }}
            onSubmitEditing={() => {
              if (typeof global !== 'undefined') global.__SHOPPING_LIST_SEARCH__ = text;
              router.push({ pathname: "/ShoppingList", query: { search: text } });
            }}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* ✅ Sync Button (UPDATED) */}
      <TouchableOpacity
        style={styles.syncButton}
        onPress={handleSyncPress} // ✅ USE THIS
      >
        <Ionicons name="sync-outline" size={22} color="#000" />
      </TouchableOpacity>

      {/* Options Button */}
      <View style={{ position: "relative", zIndex: 999 }}>
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => setDropdownVisible((v) => !v)}
        >
          <Ionicons name="ellipsis-vertical" size={22} color="#000" />
        </TouchableOpacity>
        <ToolsDropdown visible={dropdownVisible} onClose={() => setDropdownVisible(false)} />
      </View>

      {/* Sync Modal */}
      <SyncModal
        visible={syncModalVisible}
        onCancel={() => setSyncModalVisible(false)}
        onConfirm={async () => {
          // ✅ EXTRA SAFETY CHECK
          const state = await NetInfo.fetch();

          if (!(state.isConnected && state.isInternetReachable)) {
            Alert.alert("Connection Lost", "Internet connection was lost.");
            return;
          }

          setSyncModalVisible(false);
          
          try {
            Alert.alert("Syncing", "Fetching latest data...");
            const productResult = await syncProducts();
            const stallResult = await syncStalls();
            Alert.alert(
              "Sync Complete",
              `Synced ${productResult.count} products and ${stallResult.stallCount} stalls`
            );
          } catch (error) {
            Alert.alert("Sync Failed", error.message || "Failed to sync data");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  optionsButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  syncButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginRight: 10,
  },
  filterSearchGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ededed",
    borderRadius: 10,
    flex: 1,
    paddingLeft: 8,
  },
  searchLogo: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    marginRight: 6,
  },
  searchWrapper: {
    flex: 1,
    position: "relative",
  },
  searchBox: {
    height: 46,
    backgroundColor: "#ededed",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
});