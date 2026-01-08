/* eslint-disable prettier/prettier */
import React from 'react';
import { View, StyleSheet, Dimensions, Image, Text, TouchableOpacity, ScrollView } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Rect, Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import MapSVG from './utils/MapSVG';
import SearchBar from './components/searchBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const checkboxOutlinePng = require('./assets/CheckboxOutline.png');
const checkboxFilledPng = require('./assets/CheckboxFilled.png');
const xOutlinePng = require('./assets/XOutline.png');
const xFilledPng = require('./assets/XFilled.png');

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
    // Normalize shopping list IDs to match saveData.json format
    function normalizeId(id) {
      if (typeof id !== 'string') id = String(id);
      // Product: any id with one or more 'p' followed by digits (e.g., 'p1', 'pp1', 'ppp1')
      if (/^p+p?\d+$/.test(id)) {
        return id.replace(/^p+/, 'p');
      }
      // Stall: 's' followed by digits (e.g., 's1') or just digits (e.g., '1')
      if (/^s\d+$/.test(id)) {
        return id.replace(/^s/, '');
      }
      if (/^\d+$/.test(id)) {
        return id;
      }
      console.warn('[ShoppingList] Unrecognized ID format:', id);
      return id;
    }

    // Re-optimize shopping list order whenever startNodeId or shoppingList changes
    React.useEffect(() => {
      if (startNodeId && shoppingList.length > 0) {
        const controller = PathfinderController.current;
        // Normalize all IDs for optimizer
        const idList = shoppingList.map(item => normalizeId(typeof item === 'object' && item.id ? item.id : item));
        const sortedIds = controller.findOptimizedShoppingOrder(startNodeId, idList);
        const isObjectList = typeof shoppingList[0] === 'object' && shoppingList[0].id;
        if (isObjectList) {
          // Map normalized IDs back to original objects
          const idToObj = Object.fromEntries(shoppingList.map(item => [normalizeId(item.id), item]));
          const newList = sortedIds.map(id => idToObj[id]).filter(Boolean);
          const sameOrder = newList.length === shoppingList.length && newList.every((item, i) => item.id === shoppingList[i].id);
          console.log('[Optimized Shopping List]', newList.map(item => item.id));
          if (!sameOrder) {
            setShoppingList(newList);
          }
        } else {
          const sameOrder = sortedIds.length === shoppingList.length && sortedIds.every((id, i) => id === shoppingList[i]);
          console.log('[Optimized Shopping List]', sortedIds);
          if (!sameOrder) {
            setShoppingList(sortedIds);
          }
        }
      }
    }, [startNodeId, shoppingList]);
  const [startNodeId, setStartNodeId] = React.useState(null);
  const PathfinderController = React.useRef(null);
  if (!PathfinderController.current) {
    PathfinderController.current = new (require('./PathfinderController').default)();
  }

  // Log closest stall_endNode when startNodeId or selectedProductId changes
  const [closestEndNode, setClosestEndNode] = React.useState(null);
  // Store both closestEndNode and the path to it
  const [closestPath, setClosestPath] = React.useState([]);
  React.useEffect(() => {
    if (startNodeId && selectedProductId) {
      // Normalize product ID: replace multiple leading 'p's with a single 'p'
      let normalizedId = selectedProductId.replace(/^p+/, 'p');
      console.log('[Pathfinder] selectedProductId:', normalizedId, 'type:', typeof normalizedId);
      const result = PathfinderController.current.findClosestStallAndEndNode(startNodeId, normalizedId);
      setClosestEndNode(result.endNode);
      setClosestPath(result.path || []);
      console.log('[Closest stall_endNode]', result.endNode);
      console.log('[Path to closest endNode]', result.path);
    } else {
      setClosestEndNode(null);
      setClosestPath([]);
    }
  }, [startNodeId, selectedProductId]);
  const [path, setPath] = React.useState([]);
  const [selectedFloor, setSelectedFloor] = React.useState(1);
  const [dropdownVisible, setDropdownVisible] = React.useState(false);
  // Shopping list state
  const [shoppingList, setShoppingList] = React.useState([]);
  const [checkedItems, setCheckedItems] = React.useState({});
  const [xItems, setXItems] = React.useState({});
  // Selected product index for info row
  const [selectedProductIndex, setSelectedProductIndex] = React.useState(0);
  const [deleteMode, setDeleteMode] = React.useState(false);

  // Load shopping list from AsyncStorage on mount
  React.useEffect(() => {
    const loadShoppingList = async () => {
      try {
        const saved = await AsyncStorage.getItem('shoppingList');
        if (saved) setShoppingList(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    };
    loadShoppingList();
  }, []);

  // Toggle checkbox
  const toggleChecked = (id) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mark X (instead of delete)
  const toggleX = (id) => {
    setXItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Mark check or X as radio (only one per item), then auto-advance to next unmarked item
  const markAndAdvance = (id, type) => {
    setCheckedItems((prevChecked) => {
      const newChecked = { ...prevChecked };
      if (type === 'check') {
        newChecked[id] = true;
      } else {
        newChecked[id] = false;
      }
      return newChecked;
    });
    setXItems((prevX) => {
      const newX = { ...prevX };
      if (type === 'x') {
        newX[id] = true;
      } else {
        newX[id] = false;
      }
      return newX;
    });
    // Advance to next unmarked item
    setSelectedProductIndex((prevIdx) => {
      const len = shoppingList.length;
      let nextIdx = prevIdx;
      for (let i = 1; i < len; i++) {
        const candidateIdx = (prevIdx + i) % len;
        const candidate = shoppingList[candidateIdx];
        if (!checkedItems[candidate.id] && !xItems[candidate.id] && candidate.id !== id) {
          nextIdx = candidateIdx;
          return nextIdx;
        }
      }
      // If all are marked, stay
      return prevIdx;
    });
  };

  // Pan/zoom state
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const lastTranslateX = useSharedValue(0);
  const lastTranslateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const scaleOffset = useSharedValue(1);

  // Pan gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const currentScale = scale.value || 1;
      translateX.value = lastTranslateX.value + event.translationX / currentScale;
      translateY.value = lastTranslateY.value + event.translationY / currentScale;
    })
    .onEnd(() => {
      lastTranslateX.value = translateX.value;
      lastTranslateY.value = translateY.value;
    });

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = scaleOffset.value * event.scale;
    })
    .onEnd(() => {
      scaleOffset.value = Math.max(0.5, Math.min(8, scale.value));
      scale.value = scaleOffset.value;
    });

  // Compose gestures
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  // Drawer state
  const windowHeight = screenHeight;
  const drawerHeight = windowHeight * 0.88; // 80% of screen
  const drawerSnapPoints = [windowHeight - 150, windowHeight - drawerHeight]; // closed, open
  const drawerY = useSharedValue(drawerSnapPoints[0]);

  // Drawer pan gesture
  const drawerPanGesture = Gesture.Pan()
    .onUpdate((event) => {
      let nextY = drawerY.value + event.translationY;
      // Clamp drawer position
      nextY = Math.max(drawerSnapPoints[1], Math.min(drawerSnapPoints[0], nextY));
      drawerY.value = nextY;
    })
    .onEnd((event) => {
      // Snap to open or closed
      const threshold = (drawerSnapPoints[0] + drawerSnapPoints[1]) / 2;
      if (drawerY.value < threshold) {
        drawerY.value = withSpring(drawerSnapPoints[1]); // open
      } else {
        drawerY.value = withSpring(drawerSnapPoints[0]); // closed
      }
    });

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    height: drawerHeight,
    bottom: 0,
    transform: [{ translateY: drawerY.value - drawerSnapPoints[1] }],
    zIndex: 20,
  }));

  React.useEffect(() => {
    scale.value = 3;
    scaleOffset.value = 2;
    // Set initial drawer position (closed)
    drawerY.value = drawerSnapPoints[0];
  }, []);

  // Helper to get selected product
  const selectedProduct = shoppingList[selectedProductIndex] || null;
  // Get selected product id (number or string)
  const selectedProductId = selectedProduct ? selectedProduct.id : null;

  // Navigation handlers
  const goToPrevProduct = () => {
    setSelectedProductIndex((prev) => {
      if (shoppingList.length === 0) return 0;
      return (prev - 1 + shoppingList.length) % shoppingList.length;
    });
  };
  const goToNextProduct = () => {
    setSelectedProductIndex((prev) => {
      if (shoppingList.length === 0) return 0;
      return (prev + 1) % shoppingList.length;
    });
  };

  // Remove item from shopping list
  const removeItem = (id) => {
    setShoppingList((prev) => {
      const newList = prev.filter((item) => item.id !== id);
      AsyncStorage.setItem('shoppingList', JSON.stringify(newList));
      return newList;
    });
    setSelectedProductIndex((prevIdx) => {
      const newList = shoppingList.filter((item) => item.id !== id);
      if (newList.length === 0) return 0;
      if (prevIdx >= newList.length) return newList.length - 1;
      return prevIdx;
    });
    setCheckedItems((prev) => {
      const newChecked = { ...prev };
      delete newChecked[id];
      return newChecked;
    });
    setXItems((prev) => {
      const newX = { ...prev };
      delete newX[id];
      return newX;
    });
  };

  return (
    <View style={styles.container}>
      {/* Floating Top HUD */}
      <View style={styles.topHUD}>
        <View style={styles.searchBar}>
          <SearchBar />
        </View>
      </View>

      {/* Floating Top Left - Set Location Button with Dropdown */}
      <View style={styles.floatingTopLeft}>
        <TouchableOpacity 
          style={styles.setLocationButton}
          onPress={() => setDropdownVisible(!dropdownVisible)}
        >
          <Ionicons name="location" size={18} color="white" />
          <Text style={styles.setLocationText}>My Location</Text>
        </TouchableOpacity>
        {dropdownVisible && (
          <View style={styles.locationDropdown}>
            <TouchableOpacity style={styles.dropdownItem}>
              <Text style={styles.dropdownText}>Pinpoint</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem}>
              <Text style={styles.dropdownText}>QR Code</Text>
            </TouchableOpacity>

          </View>
        )}
      </View>

      {/* Floating Top Right - Floor Buttons */}
      <View style={styles.floatingTopRight}>
        {[1, 2, 3].map((floor) => (
          <TouchableOpacity
            key={floor}
            style={[
              styles.floorButton,
              selectedFloor === floor && styles.floorButtonActive
            ]}
            onPress={() => setSelectedFloor(floor)}
          >
            <Text style={[
              styles.floorButtonText,
              selectedFloor === floor && styles.floorButtonTextActive
            ]}>{floor}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[styles.mapWrapper, animatedStyle]}>
          <MapSVG
            startNodeId={startNodeId}
            onStartPointPress={(nodeId) => {
              setStartNodeId(nodeId);
              // Immediately optimize and log shopping list order with normalized IDs
              if (nodeId && shoppingList.length > 0) {
                const controller = PathfinderController.current;
                const idList = shoppingList.map(item => normalizeId(typeof item === 'object' && item.id ? item.id : item));
                const sortedIds = controller.findOptimizedShoppingOrder(nodeId, idList);
                const isObjectList = typeof shoppingList[0] === 'object' && shoppingList[0].id;
                if (isObjectList) {
                  const idToObj = Object.fromEntries(shoppingList.map(item => [normalizeId(item.id), item]));
                  const newList = sortedIds.map(id => idToObj[id]).filter(Boolean);
                  console.log('[Optimized Shopping List]', newList.map(item => item.id));
                  setShoppingList(newList);
                } else {
                  console.log('[Optimized Shopping List]', sortedIds);
                  setShoppingList(sortedIds);
                }
              }
            }}
            path={closestPath}
            width={screenWidth}
            height={screenHeight}
            selectedProductId={selectedProductId}
          />
        </Animated.View>
      </GestureDetector>

      {/* Bottom Drawer */}
      <Animated.View style={[styles.drawer, drawerAnimatedStyle]}>
        {/* Only the handle is draggable */}
        <GestureDetector gesture={drawerPanGesture}>
          <View style={styles.drawerHandle}>
            <View style={styles.drawerHandleBar} />
          </View>
        </GestureDetector>
          <View style={styles.listController}>
            <View style={styles.productInfoRow}>
              <Image source={require('./assets/image.png')} style={styles.productImage} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.productName, xItems[selectedProduct?.id] && { textDecorationLine: 'line-through', color: '#d33' }]}> {/* Bigger font size */}
                  {selectedProduct ? selectedProduct.name : 'No Product'}
                </Text>
                <Text style={[styles.productCategory]}> {/* Category below name */}
                  {selectedProduct ? selectedProduct.category : ''}
                </Text>
              </View>
              <View style={styles.productButtons}>
                <TouchableOpacity style={styles.navButton} onPress={goToPrevProduct}>
                  <Ionicons name="caret-back" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navButton} onPress={goToNextProduct}>
                  <Ionicons name="caret-forward" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.tryNextButton}>
                  <Image source={require('./assets/try_next.png')} style={styles.tryNextImage} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.checkButton} onPress={() => selectedProduct && markAndAdvance(selectedProduct.id, 'check')}>
                  <Image source={checkedItems[selectedProduct?.id] ? checkboxFilledPng : checkboxOutlinePng} style={{ width: 30, height: 30 }} />

                </TouchableOpacity>
                <TouchableOpacity style={styles.checkButton} onPress={() => selectedProduct && markAndAdvance(selectedProduct.id, 'x')}>
                  <Image source={xItems[selectedProduct?.id] ? xFilledPng : xOutlinePng} style={{ width: 30, height: 30 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.drawerContent}>
            {/* Shopping List Content - Scrollable */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
              {shoppingList.length === 0 ? (
                <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No items in your list.</Text>
              ) : (
                shoppingList.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.shoppingListItemRow}
                    onPress={() => {
                      if (deleteMode) {
                        removeItem(item.id);
                      }
                    }}
                    activeOpacity={deleteMode ? 0.6 : 1}
                  >
                    <Image
                      source={require('./assets/image.png')}
                      style={styles.shoppingListItemImage}
                    />
                    <View style={styles.shoppingListItemInfo}>
                      <Text style={[
                        styles.shoppingListItemText,
                        xItems[item.id] && { textDecorationLine: 'line-through', color: '#d33' }
                      ]}>{item.name}</Text>
                      <Text style={styles.shoppingListItemCategory}>{item.category}</Text>
                    </View>
                    {deleteMode ? (
                      <Text style={{ color: '#d33', fontWeight: 'bold', marginLeft: 8 }}>Click to remove</Text>
                    ) : (
                      <>
                        <TouchableOpacity onPress={() => toggleChecked(item.id)} style={styles.shoppingListCheckbox}>
                          <Image source={checkedItems[item.id] ? checkboxFilledPng : checkboxOutlinePng} style={{ width: 26, height: 26 }} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => toggleX(item.id)} style={styles.shoppingListDeleteButton}>
                          <Image source={xItems[item.id] ? xFilledPng : xOutlinePng} style={{ width: 26, height: 26 }} />
                        </TouchableOpacity>
                      </>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
          {/* Drawer bottom right: Delete mode toggle button */}
          <View style={{ position: 'absolute', bottom: 24, right: 24, zIndex: 50 }}>
            <TouchableOpacity
              style={{
                backgroundColor: deleteMode ? '#d33' : '#0766AD',
                paddingHorizontal: 18,
                paddingVertical: 12,
                borderRadius: 24,
                elevation: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
              onPress={() => setDeleteMode((prev) => !prev)}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }}>
                {deleteMode ? 'Tap items to delete' : 'Delete Items'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
    shoppingListItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      paddingHorizontal: 16,
      gap: 8,
    },
    shoppingListItemImage: {
      width: 36,
      height: 36,
      borderRadius: 6,
      marginRight: 8,
      backgroundColor: '#eee',
    },
    shoppingListItemInfo: {
      flex: 1,
    },
    shoppingListItemText: {
      fontSize: 15,
      color: '#222',
      fontWeight: '500',
    },
    shoppingListItemCategory: {
      fontSize: 12,
      color: '#666',
    },
    shoppingListCheckbox: {
      marginHorizontal: 4,
      padding: 4,
    },
    shoppingListDeleteButton: {
      marginLeft: 2,
      padding: 4,
    },
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  mapWrapper: { flex: 1 },
  topHUD: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 40, // status bar space
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    elevation: 4,
  },
  searchBar: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'visible',
  },
  drawerHandle: {
    width: '100%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60, // Lower the handle
  },
  drawerHandleBar: {
    width: 64,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#bbb',
    marginVertical: 10,
  },
  drawerContent: {
    flex: 1,
  },
  listController: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#0766AD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 10,
    flex: 1,
  },
  productImage: {
    width: 35,
    height: 35,
    borderRadius: 5,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f6f6f6ff',
    marginRight: 10,
    marginLeft: 6,
  },
    productCategory: {
    fontSize: 12,
    fontWeight: '400',
    color: '#e5e5e5ff',
    marginRight: 12,
    marginLeft: 8,
  },
  productButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    marginHorizontal: 2,
    padding: 2,
  },
  tryNextButton: {
    marginHorizontal: 2,
    width: 32,
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tryNextImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  checkButton: {
    marginHorizontal: 2,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingTopLeft: {
    position: 'absolute',
    top: 125,
    left: 15,
    zIndex: 15,
  },
  setLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0766AD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 5,
    gap: 6,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  setLocationText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  locationDropdown: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownText: {
    fontSize: 13,
    color: '#333',
  },
  floatingTopRight: {
    position: 'absolute',
    top: 125,
    right: 12,
    zIndex: 15,
    gap: 8,
  },
  floorButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    marginBottom: 4,
  },
  floorButtonActive: {
    backgroundColor: '#609966',
    borderColor: '#609966',
  },
  floorButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  floorButtonTextActive: {
    color: 'white',
  },
});