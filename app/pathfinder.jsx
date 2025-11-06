/* eslint-disable prettier/prettier */
import React, { useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  Image,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Dimensions,
} from 'react-native';
import styles from './assets/Styles/Maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MapSVG from './utils/MapSVG';
import { useSelection } from './context/SelectionContext'; 
import SearchBar from "./components/searchBar";
import { LinearGradient } from "expo-linear-gradient";

const window = Dimensions.get('window');

export default function HomeScreen() {
  const { selectedItem, setSelectedItem } = useSelection();
  const [showProductList, setShowProductList] = useState(false);
  const [showQualityGuide, setShowQualityGuide] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [shoppingList, setShoppingList] = useState([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [fromShoppingList, setFromShoppingList] = useState(false);
  const [isLocationToolActive, setIsLocationToolActive] = useState(false);
  const [startNodeId, setStartNodeId] = useState(null);
  const [currentStallId, setCurrentStallId] = useState(null);
  const [path, setPath] = useState([]);
  const [visitedNodes, setVisitedNodes] = useState(new Set());
  const [previousEndNodes, setPreviousEndNodes] = useState(new Set());
  const [excludedEndNodes, setExcludedEndNodes] = useState(new Set());
  const [optimizeEnabled, setOptimizeEnabled] = useState(false);
  console.log('[Map.js] selectedItem:', selectedItem);
  const router = useRouter();

  // Load shopping list on mount
  useEffect(() => {
    try {
      const savedList = localStorage.getItem('shoppingList');
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        setShoppingList(parsedList);
        console.log('Loaded shopping list:', parsedList); // Debug log
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    }
  }, []);

  // Add this function to reset pathfinding state
  const resetPathfinding = async () => {
    try {
      const response = await fetch('http://localhost:5000/findpath', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reset: true
        }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      // Clear local state
      setPath([]);
      setStartNodeId(null);
      setCurrentStallId(null);
      setExcludedEndNodes(new Set());
      
    } catch (error) {
      console.error('Error resetting pathfinding:', error);
    }
  };

  // Reset on component mount/unmount
  useEffect(() => {
    resetPathfinding();
    return () => resetPathfinding(); // Cleanup on unmount
  }, []);

  // Reset when changing items in shopping list
  useEffect(() => {
    resetPathfinding();
  }, [currentItemIndex]);

  // Update navigation handlers
  const updatePathForProduct = async (productId) => {
    if (!startNodeId) return;
    
    try {
      const response = await fetch('http://localhost:5000/findpath', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: startNodeId,
          product_id: parseInt(productId),
        }),
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Received new path:', data.path);
      setPath(data.path);
    } catch (error) {
      console.error('Error updating path:', error);
    }
  };

  const handleNext = () => {
    resetPathfinding();
    const nextIndex = (currentItemIndex + 1) % shoppingList.length;
    setCurrentItemIndex(nextIndex);
    
    const nextItem = shoppingList[nextIndex];
    if (nextItem?.type === 'Product') {
      const productId = nextItem.id.replace('p', '');
      updatePathForProduct(productId);
    }
  };

  const handlePrevious = () => {
    resetPathfinding();
    const prevIndex = (currentItemIndex - 1 + shoppingList.length) % shoppingList.length;
    setCurrentItemIndex(prevIndex);
    
    const prevItem = shoppingList[prevIndex];
    if (prevItem?.type === 'Product') {
      const productId = prevItem.id.replace('p', '');
      updatePathForProduct(productId);
    }
  };

  // Add check/uncheck handler
  const toggleItemCheck = (itemId) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  // Reset visited nodes when changing items
  useEffect(() => {
    setVisitedNodes(new Set());
  }, [currentItemIndex]);

  const handleTryNextStore = () => {
    const currentEndNode = path[path.length - 1];
    if (!currentEndNode || !currentStallId) return;
    
    // Add current end node to excluded nodes
    setExcludedEndNodes(prev => new Set([...prev, currentEndNode]));
    
    // Update start node to trigger path update
    setStartNodeId(currentEndNode);
  };

  // Update shopping list render to show loaded items
  const renderShoppingList = () => {
    if (shoppingList.length === 0) return null;

    return (
      <View>
        <View style={customStyles.listHeader}>
          <TouchableOpacity 
            onPress={() => setShowProductList(!showProductList)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={customStyles.sectionTitle}>
              Shopping List ({shoppingList.length})
            </Text>
            <Ionicons 
              name={showProductList ? "chevron-up" : "chevron-down"} 
              size={24} 
              color="#333"
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[
                customStyles.optimizeButton,
                optimizeEnabled && customStyles.optimizeButtonActive
              ]}
              onPress={() => setOptimizeEnabled(!optimizeEnabled)}
            >
              <Ionicons 
                name="map" 
                size={20} 
                color={optimizeEnabled ? "white" : "#0766AD"} 
              />
              <Text style={[
                customStyles.optimizeButtonText,
                optimizeEnabled && customStyles.optimizeButtonTextActive
              ]}>
                Optimize
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ marginLeft: 8, padding: 4 }}
              onMouseEnter={(e) => {
                e.currentTarget.title = "Arranges your shopping list for efficient shopping";
              }}
            >
              <Ionicons 
                name="help-circle-outline" 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {showProductList && (
          <ScrollView style={customStyles.productList}>
            {shoppingList.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  customStyles.productItem,
                  index === currentItemIndex && customStyles.productItemActive
                ]}
                onPress={() => {
                  console.log('Selected Item:', {
                    index: index,
                    id: item.id,
                    name: item.name,
                    type: item.type
                  });
                  setCurrentItemIndex(index);
                }}
              >
                <View style={customStyles.productItemIcon}>
                  <Ionicons name="cart-outline" size={20} color="#0766AD" />
                </View>
                <View style={customStyles.productItemInfo}>
                  <Text style={customStyles.productItemName}>{item.name}</Text>
                  <Text style={customStyles.productItemLocation}>{item.category}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleItemCheck(item.id)}>
                  <Ionicons 
                    name={checkedItems.has(item.id) ? "checkmark-circle" : "checkmark-circle-outline"} 
                    size={24} 
                    color={checkedItems.has(item.id) ? "#609966" : "#ccc"} 
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  // Update the useEffect that handles path updates
  useEffect(() => {
    const updatePath = async () => {
      if (!startNodeId) return;
      
      try {
        const response = await fetch('http://localhost:5000/findpath', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            start: startNodeId,
            shopping_list: shoppingList,
            current_index: currentItemIndex,
            current_stall_id: currentStallId,
            excluded_end_nodes: Array.from(excludedEndNodes),
            optimize: optimizeEnabled  // Add optimize flag
          }),
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            alert('No more stores available for this product');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received new path:', data.path);
        setPath(data.path);
        setCurrentStallId(data.current_stall);
        if (data.shopping_list) {
          setShoppingList(data.shopping_list);
        }
        if (data.current_index !== undefined) {
          setCurrentItemIndex(data.current_index);
        }
      } catch (error) {
        console.error('Error updating path:', error);
      }
    };

    updatePath();
  }, [startNodeId, currentItemIndex, shoppingList?.length]); // excludedEndNodes not in dependencies

  return (
    <View style={{ flex: 1 }}>
      {/* Top HUD */}
      <LinearGradient
        colors={["#0766AD", "#BCE2BD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Logo */}
        <Image
          source={require("./assets/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.logo_name}>PathSmart</Text>
        <SearchBar />
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => { router.push("/screens/loginScreen"); }}>
          <Text style={{ fontWeight: "600", color: "#0766AD" }}>Login</Text>
        </TouchableOpacity>
      </LinearGradient>
      
      {/* Main Content: Map + Sidebar */}
      <View style={customStyles.mainContainer}>
        {/* Map Container */}
        <View style={customStyles.mapWrapper}>
          {/* Floor Selection and Location Tool Buttons - Floating */}
          <View style={customStyles.floatingButtons}>
            <View style={customStyles.floatingFloorButtons}>
              {[1, 2, 3].map((floor) => (
                <TouchableOpacity
                  key={floor}
                  style={[
                    customStyles.floorButton,
                    selectedFloor === floor && customStyles.floorButtonActive
                  ]}
                  onPress={() => setSelectedFloor(floor)}
                >
                  <Text style={[
                    customStyles.floorButtonText,
                    selectedFloor === floor && customStyles.floorButtonTextActive
                  ]}>{floor}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Location Tool Button */}
            <TouchableOpacity
              style={[
                customStyles.toolButton,
                isLocationToolActive && customStyles.toolButtonActive
              ]}
              onPress={() => setIsLocationToolActive(!isLocationToolActive)}
            >
              <Ionicons 
                name="location" 
                size={24} 
                color={isLocationToolActive ? "#fff" : "#0766AD"} 
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={customStyles.scrollView}
            contentContainerStyle={{ flexGrow: 1 }}
            maximumZoomScale={4}
            minimumZoomScale={1}
            bounces={false}
            pinchGestureEnabled={true}
            horizontal
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.mapContainer}>
              <MapSVG 
                width={window.width * 3} 
                height={window.height * 3}
                selectedItem={shoppingList[currentItemIndex]}
                isLocationToolActive={isLocationToolActive}
                fromShoppingList={fromShoppingList}
                onLocationSet={() => {
                  setIsLocationToolActive(false);  // Just deactivate the tool
                }}
                startNodeId={startNodeId}
                setStartNodeId={setStartNodeId}
                path={path}
                setPath={setPath}
                resetPath={resetPathfinding}
              />
            </View>
          </ScrollView>
        </View>

        {/* Right Sidebar - Now Scrollable */}
        <ScrollView 
          style={customStyles.sidebar}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          <View style={customStyles.sidebarContent}>
            {/* Quality Guide Accordion - Open by Default */}
            <View>
              <TouchableOpacity 
                onPress={() => setShowQualityGuide(!showQualityGuide)}
              >
                <Text style={customStyles.sectionTitle}>Quality Guide</Text>
                <Ionicons 
                  name={showQualityGuide ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#333" 
                />
              </TouchableOpacity>
              
              {showQualityGuide && (
                <View>
                  <View style={customStyles.productImageContainer}>
                    {selectedItem ? (
                      <Image 
                        source={{ uri: selectedItem.image || 'https://via.placeholder.com/150' }}
                        style={customStyles.productImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={customStyles.placeholderImage}>
                        <Ionicons name="image-outline" size={50} color="#ccc" />
                      </View>
                    )}
                  </View>
                  
                  <View style={customStyles.qualityGuide}>
                    <Text style={customStyles.guideTitle}>Quality Tips:</Text>
                    <Text style={customStyles.guideText}>
                      • Check for freshness and expiration dates{'\n'}
                      • Look for organic certifications{'\n'}
                      • Inspect packaging for damage{'\n'}
                      • Compare prices between stores
                    </Text>
                  </View>
                </View>
              )}
            </View>

                <View>
                  {/* Product Navigation */}
                  <View style={customStyles.productNav}>
                    <TouchableOpacity 
                      style={[
                        customStyles.navButton,
                        currentItemIndex === 0 && customStyles.navButtonDisabled
                      ]}
                      onPress={handlePrevious}
                      disabled={currentItemIndex === 0}
                    >
                      <Ionicons name="chevron-back" size={24} color="#0766AD" />
                    </TouchableOpacity>
                    
                    <View style={customStyles.productCounter}>
                      <Text style={customStyles.counterText}>
                        {shoppingList.length > 0 ? `${currentItemIndex + 1} / ${shoppingList.length}` : '0 / 0'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        customStyles.navButton,
                        currentItemIndex === shoppingList.length - 1 && customStyles.navButtonDisabled
                      ]}
                      onPress={handleNext}
                      disabled={currentItemIndex === shoppingList.length - 1}
                    >
                      <Ionicons name="chevron-forward" size={24} color="#0766AD" />
                    </TouchableOpacity>
                  </View>

                  {/* Store Buttons Container */}
                  <View style={customStyles.storeButtonsContainer}>
                    <TouchableOpacity 
                      style={customStyles.nextStoreButton}
                      onPress={handleTryNextStore}  // Add this line
                    >
                      <Ionicons name="storefront-outline" size={20} color="white" />
                      <Text style={customStyles.nextStoreText}>Try Next Store</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[customStyles.nextStoreButton, { backgroundColor: '#609966' }]}>
                      <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                      <Text style={customStyles.nextStoreText}>Item Found</Text>
                    </TouchableOpacity>
                  </View>

            {/* Product List Accordion */}
            {renderShoppingList()}
          </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const customStyles = {
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    gap: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,

  },
  optimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0766AD',
    gap: 6,
  },
  optimizeButtonActive: {
    backgroundColor: '#0766AD',
  },
  optimizeButtonText: {
    fontSize: 14,
    color: '#0766AD',
  },
  optimizeButtonTextActive: {
    color: 'white',
  },
  mapWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  floatingButtons: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
    flexDirection: 'row',
    gap: 16,
  },
  floatingFloorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  floorButton: {
    width: 40,
    height: 40,
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
    shadowRadius: 3.84,
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
  scrollView: {
    width: '100%',
    height: '100%',
  },
  sidebar: {
    flex: 1,
    minWidth: 280,
    maxWidth: 450, 
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sidebarContent: {
    padding: 20,
    gap: 10,
  },
  productSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productImageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityGuide: {
    marginTop: 5,
    backgroundColor: '#f0f7ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0766AD',
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0766AD',
    marginBottom: 6,
  },
  guideText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  controlsSection: {
    gap: 12,
  },
  productNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0766AD',
    backgroundColor: 'white',
    gap: 4,
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  productCounter: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
  },
  counterText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0766AD',
  },
  nextStoreButton: {
    flex: 1, // Added to make buttons take equal width
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0766AD',
    paddingHorizontal: 20, // Increased from 12 to 20
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
  },
  nextStoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  productList: {
    maxHeight: 350,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  productItemActive: {
    backgroundColor: '#e0f7fa',
    borderColor: '#81d4fa',
    borderWidth: 1,
  },
  productItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productItemInfo: {
    flex: 1,
  },
  productItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  productItemLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  toolButton: {
    width: 40,
    height: 40,
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
    shadowRadius: 3.84,
  },
  toolButtonActive: {
    backgroundColor: '#0766AD',
    borderColor: '#0766AD',
  },
  storeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4, // Reduced from 10 to 4
    marginTop: 10,
  },
};