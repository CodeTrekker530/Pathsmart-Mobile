/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Animated, PanResponder, Modal, Dimensions, TextInput } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

import saveData from './utils/saveData.json';

// Local search bar for ShoppingList
function ShoppingListSearchBar({ value, onChange, placeholder = "Search your list..." }) {

const router = useRouter();

  return (
    <View style={styles.searchBarContainer}>
      <View style={styles.filterSearchGroup}>
        <TouchableOpacity onPress={() => router.push('/') /* or router.replace('/') if you want to clear stack */}>
          <Image
            source={require("./assets/logo.png")}
            style={styles.searchLogo}
          />
        </TouchableOpacity>
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchBox}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={onChange}
            returnKeyType="search"
          />
        </View>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width; // Full screen width

const imageMap = {
  "image.png": require("./assets/image.png"),
};

export default function ShoppingList() {
  const params = useLocalSearchParams();
  // Use param, or global, or blank
  const getInitialSearch = () => {
    if (typeof params.search === 'string') return params.search;
    if (typeof global !== 'undefined' && typeof global.__SHOPPING_LIST_SEARCH__ === 'string') return global.__SHOPPING_LIST_SEARCH__;
    return "";
  };
  const [search, setSearch] = useState(getInitialSearch());

  // Always update search from router param if it changes
  useEffect(() => {
    if (typeof params.search === 'string') {
      setSearch(params.search);
    }
  }, [params.search]);
  const [searchResults, setSearchResults] = useState([]);
  const [listItems, setListItems] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const drawX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const router = useRouter();

  const filters = ['All', 'Products', 'Stores', 'Services'];

  // Animate drawer open/close
  useEffect(() => {
    if (drawerVisible) {
      Animated.timing(drawX, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(drawX, {
        toValue: DRAWER_WIDTH,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
  }, [drawerVisible, drawX]);

  const closeDrawer = () => {
    Animated.timing(drawX, {
      toValue: DRAWER_WIDTH,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setDrawerVisible(false);
    });
  };

  const loadData = (searchTerm = '') => {
    const searchLower = searchTerm.toLowerCase();
    let results = [];

    // Search through products
    Object.entries(saveData.products).forEach(([id, product]) => {
      const nameLower = product.name.toLowerCase();
      const categoryLower = product.category.toLowerCase();
      // Match only if name or category starts with the search string
      if (
        (searchLower && (nameLower.startsWith(searchLower) || categoryLower.startsWith(searchLower))) ||
        (!searchLower) // Show all if search is empty
      ) {
        results.push({
          id: `p${id}`,
          name: product.name,
          category: product.category,
          type: 'Product',
          image: 'image.png'
        });
      }
    });

    // Search through stalls
    Object.entries(saveData.stalls).forEach(([id, stall]) => {
      const nameLower = stall.name.toLowerCase();
      if (
        (searchLower && nameLower.startsWith(searchLower)) ||
        (!searchLower)
      ) {
        results.push({
          id: `s${id}`,
          name: stall.name,
          category: 'Stall',
          type: 'Stall',
          node_id: stall.nodes[0],
          image: 'image.png'
        });
      }
    });

    setSearchResults(results);
  };

  useEffect(() => {
    let debounceTimer = setTimeout(() => {
      loadData(search);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [search]);

  // Store shopping list in AsyncStorage (mobile)
  const saveShoppingList = async (items) => {
    try {
      await AsyncStorage.setItem('shoppingList', JSON.stringify(items));
      console.log('Saved shopping list:', items); // Debug log
    } catch (error) {
      console.error('Error saving shopping list:', error);
    }
  };

  const addToList = (item) => {
    if (!listItems.some(i => i.id === item.id)) {
      const newList = [...listItems, item];
      setListItems(newList);
      saveShoppingList(newList);
    }
  };

  const removeFromList = (id) => {
    const newList = listItems.filter(item => item.id !== id);
    setListItems(newList);
    saveShoppingList(newList);
  };

  // Load saved list on mount (AsyncStorage)
  useEffect(() => {
    const loadSavedList = async () => {
      try {
        const savedList = await AsyncStorage.getItem('shoppingList');
        if (savedList) {
          setListItems(JSON.parse(savedList));
        }
      } catch (error) {
        console.error('Error loading shopping list:', error);
      }
    };

    loadSavedList();
  }, []);

  const filteredResults = searchResults.filter(item => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Products') return item.type === 'Product';
    if (selectedFilter === 'Stores') return item.type === 'Stall';
    if (selectedFilter === 'Services') return item.category?.toLowerCase().includes('service');
    return true;
  });

  // Navigate to pathfinder with shopping list
  const handleFindPath = () => {
    if (listItems.length > 0) {
      saveShoppingList(listItems);
      router.push('/pathfinder');
    }
  };

  // Handler for search input
  const handleSearchChange = (val) => {
    setSearch(val);
  };

  return (
    <>
      {/* Top HUD with ShoppingListSearchBar */}
      <View style={styles.topHUD}>
        <View style={styles.hudSearchBar}>
          <ShoppingListSearchBar value={search} onChange={handleSearchChange} />
        </View>
      </View>
      <View style={styles.container}>
        {/* Search Results */}
        <View style={styles.resultsSection}>
          {/* Filter Buttons */}
          <View style={styles.filters}>
            {filters.map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.activeFilter,
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.activeFilterText,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            data={filteredResults}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultRow}
                onPress={() => addToList(item)}
              >
                <Image
                  source={imageMap[item.image] || imageMap["image.png"]}
                  style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.resultText}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={22} color="#249B3E" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No results found.</Text>
            }
          />
        </View>

        {/* Shopping List Drawer Button */}
        <TouchableOpacity
          style={styles.drawerButton}
          onPress={() => setDrawerVisible(true)}
        >
          <Ionicons name="list" size={24} color="#fff" />
          <Text style={styles.drawerButtonText}>{listItems.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Shopping List Drawer */}
      <Modal
        visible={drawerVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            onPress={closeDrawer}
          />
          <Animated.View style={[styles.drawer, { transform: [{ translateX: drawX }] }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <TouchableOpacity onPress={closeDrawer}>
                <Ionicons name="chevron-forward" size={28} color="#000" />
              </TouchableOpacity>
              <Text style={styles.drawerTitle}>Your List ({listItems.length})</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* Drawer Content */}
            <FlatList
              data={listItems}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <Image
                    source={imageMap[item.image] || imageMap["image.png"]}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemText}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromList(item.id)}>
                    <Ionicons name="close-circle-outline" size={22} color="#d33" />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No items in your list.</Text>
              }
              contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16, paddingTop: 8 }}
            />

            {/* Find Path Button */}
            {listItems.length > 0 && (
              <TouchableOpacity
                style={styles.findPathButton}
                onPress={handleFindPath}
              >
                <Ionicons name="map" size={24} color="#fff" />
                <Text style={styles.findPathText}>Find Path</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  filterSearchGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
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
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
  topHUD: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  hudSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    position: 'relative',
  },
  resultsSection: {
    flex: 1,
  },
  drawerButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2c6e49',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  drawerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
    top: 4,
    right: 6,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    height: '100%',
    paddingTop: 40,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    // marginBottom: 0, // ensure no margin here
  },
  headerRowSpace: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 10,
  },
  logo_name: {
    fontSize: 20,
    fontWeight: "450",
    color: "#fff",
    marginRight: 10,
  },
  loginButton: {
    padding: 8,
    height: 42,
    width: 126,
    borderRadius: 10,
    marginLeft: 10,
    fontSize: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  filters: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 10,
    gap: 6,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  activeFilter: {
    backgroundColor: '#2c6e49',
    borderColor: '#2c6e49',
  },
  activeFilterText: {
    color: '#fff',
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "flex-start",
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "flex-start",
    gap: 10,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
  },
  itemCategory: {
    fontSize: 12,
    color: "#666",
  },
  resultText: {
    fontSize: 16,
    color: "#222",
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },
  findPathButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#609966',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  findPathText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  }
});