/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import DropDownPicker from "react-native-dropdown-picker";
import { supabase } from "./supabaseClient";

export default function QualityGuide() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [qualityGuideData, setQualityGuideData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("best");

  const qualityTabs = [
    { key: "best", label: "BEST" },
    { key: "good", label: "GOOD" },
    { key: "bad", label: "BAD" },
  ];

  useEffect(() => {
    const fetchQualityGuideData = async () => {
      let { data, error } = await supabase.from("quality_guide").select(`
        pns_id,
        details,
        product_and_services (
          name,
          pns_image
        )
      `);
      if (error) {
        console.error("Error fetching quality guides:", error.message);
        return;
      }
      setQualityGuideData(data || []);
      setFilteredData(data || []);
    };
    fetchQualityGuideData();
  }, []);

  // Search filter effect
  useEffect(() => {
    if (!search.trim()) {
      setFilteredData(qualityGuideData);
      setSelectedIdx(0);
      return;
    }
    const lower = search.toLowerCase();
    const filtered = qualityGuideData.filter(
      g =>
        g.product_and_services?.name?.toLowerCase().includes(lower) ||
        ["best", "good", "bad"].some(q =>
          (g.details?.[q]?.descriptions || []).some(d =>
            d.toLowerCase().includes(lower)
          )
        )
    );
    setFilteredData(filtered);
    setSelectedIdx(0);
  }, [search, qualityGuideData]);

  // Get the currently selected product from filteredData
  const selectedGuide = filteredData[selectedIdx];

  // Helper for image selection
  const getProductImage = guide =>
    guide?.product_and_services?.pns_image
      ? { uri: guide.product_and_services.pns_image }
      : guide?.details?.best?.images?.[0]
        ? { uri: guide.details.best.images[0] }
        : require("./assets/image.png");

  return (
    <>
      {/* Top HUD */}
      <LinearGradient
        colors={["#0766AD", "#BCE2BD"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerRowSpace}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image source={require("./assets/logo.png")} style={styles.logo} />
            <Text style={styles.logo_name}>PathSmart</Text>
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              router.push("/screens/loginScreen");
            }}
          >
            <Text style={{ fontWeight: "600", color: "#0766AD" }}>Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        {/* Back + Title */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.pageHeader}>Quality Guide</Text>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#666"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in quality guide..."
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* === PREVIEW SECTION === */}
        {filteredData.length > 0 && selectedGuide && (
          <View style={styles.previewCardRow}>
            {/* Left: Image and Name */}
            <View style={styles.previewImageCol}>
              <Image
                source={getProductImage(selectedGuide)}
                style={styles.previewImage}
              />
              <Text style={styles.previewName}>
                {selectedGuide.product_and_services?.name || "Unknown"}
              </Text>
            </View>
            {/* Right: Details with Tabs */}
            <View style={styles.previewDetailsCol}>
              {/* Tabs Row */}
              <View style={styles.tabsRow}>
                {qualityTabs.map(tab => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[
                      styles.tabButton,
                      activeTab === tab.key && styles.activeTabButton,
                    ]}
                    onPress={() => setActiveTab(tab.key)}
                  >
                    <Text
                      style={[
                        styles.tabButtonText,
                        activeTab === tab.key && styles.activeTabButtonText,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab Content */}
              <View style={styles.tabContent}>
                {(selectedGuide.details?.[activeTab]?.descriptions || []).map(
                  (desc, i) => (
                    <Text style={styles.qualityDesc} key={i}>
                      {i + 1}. {desc}
                    </Text>
                  )
                )}
                {selectedGuide.details?.[activeTab]?.images?.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.qualityImagesRow}
                  >
                    {selectedGuide.details[activeTab].images.map((img, idx) => (
                      <Image
                        key={img + idx}
                        source={{ uri: img }}
                        style={styles.qualityImage}
                      />
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Show message if no results */}
        {filteredData.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text style={{ fontSize: 18, color: "#888" }}>
              No quality guide found.
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* === LIST SECTION === */}
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.itemsGrid}>
            {filteredData.map((guide, idx) => (
              <TouchableOpacity
                key={guide.pns_id + "_grid"}
                style={[
                  styles.itemCard,
                  idx === selectedIdx && styles.selectedItemCard,
                ]}
                onPress={() => setSelectedIdx(idx)}
              >
                <Image
                  source={getProductImage(guide)}
                  style={styles.itemImage}
                />
                <Text style={styles.itemName}>
                  {guide.product_and_services?.name || "Unknown"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    elevation: 3,
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
    fontWeight: "600",
    color: "#fff",
  },
  loginButton: {
    padding: 8,
    height: 42,
    width: 126,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 30,
  },
  pageHeader: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    marginTop: 10,
  },
  searchContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 14,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  dropdown: {
    borderRadius: 8,
    borderColor: "#ccc",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  generalGuideRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // <--- center vertically
  },
  columnImage: {
    flex: 1,
    alignItems: "center",
  },
  columnTips: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    textTransform: "capitalize",
  },
  guideImage: {
    width: 90,
    height: 90,
    resizeMode: "contain",
    marginBottom: 8,
  },
  guideName: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#0766AD",
    textTransform: "capitalize",
  },
  tip: {
    fontSize: 20,
    color: "#000",
    marginBottom: 10,
    lineHeight: 20,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 22,
    textTransform: "capitalize",
    maxWidth: "500px",
  },
  itemCard: {
    width: "30%", // 3 per row
    alignItems: "center",
    marginBottom: 20,
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  previewCard: {
    display: "flex",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    elevation: 2,
  },
  previewCardRow: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 32,
    alignItems: "flex-start",
    marginBottom: 24,
    elevation: 2,
    gap: 32,
  },
  previewImageCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  previewDetailsCol: {
    flex: 2,
    justifyContent: "flex-start",
  },
  previewImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  previewName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0766AD",
    textAlign: "center",
    textTransform: "capitalize",
  },
  qualitySection: {
    marginBottom: 12,
    width: "100%",
  },
  qualityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  qualityDesc: {
    fontSize: 15,
    color: "#222",
    marginLeft: 8,
    marginBottom: 2,
  },
  qualityImagesRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  qualityImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
    borderRadius: 8,
    marginRight: 8,
  },
  selectedItemCard: {
    borderColor: "#0766AD",
    borderWidth: 2,
    borderRadius: 10,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#0766AD",
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0766AD",
  },
  activeTabButtonText: {
    color: "#fff",
  },
  tabContent: {
    width: "100%",
  },
});
