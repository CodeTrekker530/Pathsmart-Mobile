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

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const categories = [
    { id: 1, name: 'Baked Goods', icon: '�', color: '#FF6B6B' },
    { id: 2, name: 'Fruits', icon: '🍎', color: '#4ECDC4' },
    { id: 3, name: 'Vegetables', icon: '�', color: '#FFE66D' },
    { id: 4, name: 'Meat', icon: '🥩', color: '#A8D8EA' },
    { id: 5, name: 'Household Tools', icon: '🔨', color: '#FF9999' },
    { id: 6, name: 'Services', icon: '🛠️', color: '#C7CEEA' },
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
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: category.color }]}
                onPress={() => handleCategoryPress(category)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
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
  categoryCard: {
    width: (width - 52) / 2,
    paddingVertical: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  categoryIcon: {
    fontSize: 40,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
};
