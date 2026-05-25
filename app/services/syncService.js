import { supabase } from "../supabaseClient";
import db from "../../backend/database";

/**
 * Syncs products from Supabase to SQLite
 * Maps Supabase columns to SQLite columns:
 * - pns_id → id
 * - name → name
 * - pns_category → category
 */
export const syncProducts = async () => {
  try {
    // Fetch products from Supabase
    const { data, error } = await supabase
      .from("product_and_services")
      .select("pns_id, name, pns_category");

    if (error) {
      throw new Error(`Supabase fetch failed: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log("No products to sync");
      return { success: true, count: 0 };
    }

    // Clear existing products
    db.execSync("DELETE FROM products;");

    // Insert new products with mapped column names
    const insertStatement = db.prepareSync(
      "INSERT INTO products (id, name, category) VALUES (?, ?, ?)"
    );

    for (const product of data) {
      insertStatement.executeSync([
        product.pns_id,
        product.name,
        product.pns_category,
      ]);
    }

    console.log(`Successfully synced ${data.length} products`);
    return { success: true, count: data.length };
  } catch (error) {
    console.error("Product sync error:", error);
    throw error;
  }
};

/**
 * Syncs stalls and listings from Supabase to SQLite
 * Stalls table maps:
 * - stall_id → stall_id
 * - stall_name → stall_name
 * - node_id → node_id
 * - stall_endNode → stall_endNode
 * 
 * Listing table maps:
 * - listing_id → listing_id
 * - stall_id → stall_id
 * - pns_id → pns_id
 */
export const syncStalls = async () => {
  try {
    // Fetch stalls from Supabase
    const { data: stallsData, error: stallsError } = await supabase
      .from("stalls")
      .select("stall_id, stall_name, node_id, stall_endNode");

    if (stallsError) {
      throw new Error(`Stalls fetch failed: ${stallsError.message}`);
    }

    // Fetch listings from Supabase
    const { data: listingData, error: listingError } = await supabase
      .from("listing")
      .select("listing_id, stall_id, pns_id");

    if (listingError) {
      throw new Error(`Listings fetch failed: ${listingError.message}`);
    }

    if (!stallsData || stallsData.length === 0) {
      console.log("No stalls to sync");
      return { success: true, stallCount: 0, listingCount: 0 };
    }

    // Clear existing stalls and listings
    db.execSync("DELETE FROM listing;");
    db.execSync("DELETE FROM stalls;");

    // Insert new stalls
    const stallStatement = db.prepareSync(
      "INSERT INTO stalls (stall_id, stall_name, node_id, stall_endNode) VALUES (?, ?, ?, ?)"
    );

    for (const stall of stallsData) {
      // Convert stall_endNode to integer string, removing decimals if present
      let endNode = null;
      if (stall.stall_endNode !== null && stall.stall_endNode !== undefined) {
        const parsed = Number(stall.stall_endNode);
        if (!isNaN(parsed)) {
          endNode = String(Math.floor(parsed));
        }
      }
      
      stallStatement.executeSync([
        stall.stall_id,
        stall.stall_name,
        stall.node_id,
        endNode, // Can be null
      ]);
    }

    // Insert new listings
    const listingStatement = db.prepareSync(
      "INSERT INTO listing (listing_id, stall_id, pns_id) VALUES (?, ?, ?)"
    );

    for (const listing of listingData || []) {
      listingStatement.executeSync([
        listing.listing_id,
        listing.stall_id,
        listing.pns_id,
      ]);
    }

    console.log(`Successfully synced ${stallsData.length} stalls and ${listingData?.length || 0} listings`);
    return { 
      success: true, 
      stallCount: stallsData.length, 
      listingCount: listingData?.length || 0 
    };
  } catch (error) {
    console.error("Stalls sync error:", error);
    throw error;
  }
};

/**
 * Get all stalls that sell a specific product
 * @param {string} productId - The product ID (pns_id)
 * @returns {Array} Array of stall objects with stall_id, stall_name, node_id, stall_endNode
 */
export const getStallsByProduct = (productId) => {
  try {
    const stalls = db.getAllSync(`
      SELECT DISTINCT s.stall_id, s.stall_name, s.node_id, s.stall_endNode
      FROM stalls s
      INNER JOIN listing l ON s.stall_id = l.stall_id
      WHERE l.pns_id = ?
    `, [productId]);
    return stalls || [];
  } catch (error) {
    console.error(`Error fetching stalls for product ${productId}:`, error);
    return [];
  }
};

/**
 * Get all stalls with their end nodes and product lists
 * @returns {Object} Object mapping stall_id to stall data with products array
 */
export const getAllStallsWithProducts = () => {
  try {
    const stalls = db.getAllSync("SELECT * FROM stalls");
    const result = {};
    
    for (const stall of stalls) {
      const listings = db.getAllSync(
        "SELECT pns_id FROM listing WHERE stall_id = ?",
        [stall.stall_id]
      );
      
      // Parse stall_endNode - handle null, undefined, empty string, and convert float to int
      let endNode = null;
      if (stall.stall_endNode !== null && stall.stall_endNode !== undefined && stall.stall_endNode !== '') {
        const parsed = Number(stall.stall_endNode);
        // Only use if it's a valid number (not NaN)
        if (!isNaN(parsed)) {
          endNode = Math.floor(parsed);
        }
      }
      
      // Add 'p' prefix to pns_ids to match expected format (p1, p2, etc)
      const products = listings.map(l => `p${l.pns_id}`);
      
      result[stall.stall_id] = {
        products: products,
        stall_endNode: (endNode !== null) ? [endNode] : [],
      };
    }
    
    return result;
  } catch (error) {
    console.error("Error fetching stalls with products:", error);
    return {};
  }
};

/**
 * Get all products
 * @returns {Array} Array of all products from SQLite
 */
export const getAllProducts = () => {
  try {
    return db.getAllSync("SELECT id, name, category FROM products") || [];
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
};

/**
 * Get all stalls
 * @returns {Array} Array of all stalls from SQLite
 */
export const getAllStalls = () => {
  try {
    return db.getAllSync("SELECT stall_id, stall_name, node_id FROM stalls") || [];
  } catch (error) {
    console.error("Error fetching all stalls:", error);
    return [];
  }
};
