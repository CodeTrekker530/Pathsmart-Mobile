/* eslint-disable prettier/prettier */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SearchBar from './components/searchBar';
import CategoryButton from './components/CategoryButton';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const categories = [
    { 
      id: 1, 
      name: 'Vegetables', 
      color: '#036B00',
      image: require('./assets/images/vegetables_img.png'),
    },
    { 
      id: 2, 
      name: 'Fruits', 
      color: '#CD0000',
      image: require('./assets/images/fruits_img.png'),
    },
    { 
      id: 3, 
      name: 'Meat', 
      color: '#B94A4A',
      image: require('./assets/images/meat_img.png'),
    },
    { 
      id: 4, 
      name: 'Services', 
      color: '#000000',
      image: require('./assets/images/services_img.png'),
    },
  ];

  const handleCategoryPress = (category) => {
    // Navigate to map with category filter or handle category selection
    router.push('/pathfinder');
  };

  const handleTutorial = () => {
    // Navigate to tutorial screen (you can create this later)
    router.push('/pathfinder');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Top HUD - Flex Row */}
      <View style={styles.topHUD}>
        {/* Search Bar */}
        <View style={styles.hudSearchBar}>
          <SearchBar />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Middle Section - App Description & Tutorial Button */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>
            Shop Smarter with PathSmart
          </Text>
          <Text style={styles.descriptionText}>
            PathSmart helps you navigate through the store and find everything on your shopping list with ease. Get optimal routes and save time!
          </Text>

          <TouchableOpacity
            style={styles.tutorialButton}
            onPress={handleTutorial}
          >
            <Text style={styles.tutorialButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Browse by Category</Text>

          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <CategoryButton
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  topHUD: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hudSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hudSearchLogo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginRight: 8,
  },
  descriptionSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    gap: 16,
    alignItems: 'center',
  },
  descriptionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#609966',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  tutorialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
};
