/* eslint-disable prettier/prettier */
// app/components/SearchBar.jsx
import React, { useState } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // ⬅️ import router
import ToolsDropdown from "./ToolsDropdown";

// Global variable to store last search text
if (typeof global !== 'undefined') {
  global.__SHOPPING_LIST_SEARCH__ = global.__SHOPPING_LIST_SEARCH__ || "";
}

export default function SearchBar({ placeholder = "What are you looking for?" }) {
  const [text, setText] = useState(typeof global !== 'undefined' ? global.__SHOPPING_LIST_SEARCH__ : "");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Search Group with Logo */}
      <View style={styles.filterSearchGroup}>
        {/* Logo inside search */}
        <TouchableOpacity onPress={() => router.push('/') /* or router.replace('/') if you want to clear stack */}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.searchLogo}
          />
        </TouchableOpacity>
        {/* Search Box with Icon */}
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
            }} // ⬅️ ENTER goes to Shopping List with search
            returnKeyType="search"
          />
        </View>
      </View>
      {/* Sync Button */}
      <TouchableOpacity
        style={styles.syncButton}
        onPress={() => {
          // TODO: Implement sync functionality
          console.log('Sync pressed');
        }}
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
