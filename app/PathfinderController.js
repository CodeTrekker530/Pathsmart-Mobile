/* eslint-disable prettier/prettier */
// PathfinderController.js
// This is a JavaScript/TypeScript translation of the Python pathfinder.py logic for use in React Native (mobile/offline)
// It does not use Flask or any backend server; all logic is in-memory and synchronous.
// Assumes f1nodes.json, connections.json, and saveData.json are available in the app/utils directory.

import nodesData from './utils/f1nodes.json';
import connectionsData from './utils/connections.json';
import saveData from './utils/saveData.json';

class PathfinderController {
              /**
               * Greedy nearest-neighbor shopping route optimizer.
               * @param {number} startNodeId - The node where the user starts.
               * @param {string[]} shoppingList - Array of product IDs (e.g., ["p1", "p2", ...]).
               * @returns {Array} Sorted array of product IDs for efficient shopping.
               */
              findOptimizedShoppingOrder(startNodeId, shoppingList) {
    let currentNode = startNodeId;
    let unvisited = [...shoppingList];
    let sorted = [];
    let visitedStalls = new Set();

    while (unvisited.length > 0) {
      let best = null;
      let bestCost = Infinity;
      let bestStall = null;
      let bestEndNode = null;
      let bestType = null;

      for (let itemId of unvisited) {
        let isProduct = typeof itemId === 'string' && itemId.startsWith('p');
        let isStall = typeof itemId === 'string' && (itemId.startsWith('s') || !isNaN(itemId));
        if (isProduct) {
          // Product: find closest stall selling it
          for (let [stallId, stallData] of Object.entries(this.saveData.stalls)) {
            if ((stallData.products || []).includes(itemId) && !visitedStalls.has(stallId)) {
              for (let endNode of stallData.stall_endNode || []) {
                const path = this.findPath(currentNode, endNode);
                if (path.length > 0) {
                  let cost = 0;
                  for (let i = 0; i < path.length - 1; i++) {
                    cost += parseFloat(this.getNeighbors(path[i])[String(path[i + 1])]);
                  }
                  if (cost < bestCost) {
                    best = itemId;
                    bestCost = cost;
                    bestStall = stallId;
                    bestEndNode = endNode;
                    bestType = 'product';
                  }
                }
              }
            }
          }
        } else if (isStall) {
          // Stall: find closest endNode for this stall
          let stallId = itemId.startsWith('s') ? itemId.slice(1) : String(itemId);
          if (!visitedStalls.has(stallId)) {
            let stallData = this.saveData.stalls[stallId];
            if (stallData && Array.isArray(stallData.stall_endNode)) {
              for (let endNode of stallData.stall_endNode) {
                const path = this.findPath(currentNode, endNode);
                if (path.length > 0) {
                  let cost = 0;
                  for (let i = 0; i < path.length - 1; i++) {
                    cost += parseFloat(this.getNeighbors(path[i])[String(path[i + 1])]);
                  }
                  if (cost < bestCost) {
                    best = itemId;
                    bestCost = cost;
                    bestStall = stallId;
                    bestEndNode = endNode;
                    bestType = 'stall';
                  }
                }
              }
            }
          }
        }
      }

      if (bestType === 'product') {
        // Visit all products at the best stall
        let productsAtStall = unvisited.filter(pid => {
          let isProduct = typeof pid === 'string' && pid.startsWith('p');
          return isProduct && (this.saveData.stalls[bestStall].products || []).includes(pid);
        });
        sorted.push(...productsAtStall);
        unvisited = unvisited.filter(pid => !productsAtStall.includes(pid));
        visitedStalls.add(bestStall);
        currentNode = bestEndNode;
      } else if (bestType === 'stall') {
        // Visit the stall
        sorted.push(best);
        unvisited = unvisited.filter(pid => pid !== best);
        visitedStalls.add(bestStall);
        currentNode = bestEndNode;
      } else {
        // Fallback: can't find a path, just add remaining items
        sorted.push(...unvisited);
        break;
      }
    }

    return sorted;
              }
            /**
             * Finds the closest stall (and its closest endNode) for a given product from a startNodeId.
             * @param {number} startNodeId - The node ID to start from
             * @param {string} productId - The product ID (e.g., 'p1')
             * @returns {{stallId: string, endNode: number, cost: number, path: number[]}}
             */
    findClosestStallAndEndNode(startNodeId, id) {
      id = String(id);
      let minCost = Infinity;
      let bestStallId = null;
      let bestEndNode = null;
      let bestPath = [];
      if (id.startsWith('p')) {
        // Product ID: find closest stall selling this product
        for (const [stallId, stallData] of Object.entries(this.saveData.stalls)) {
          if ((stallData.products || []).includes(id)) {
            for (const endNode of stallData.stall_endNode || []) {
              const path = this.findPath(startNodeId, endNode);
              if (path.length > 0) {
                let cost = 0;
                for (let i = 0; i < path.length - 1; i++) {
                  cost += parseFloat(this.getNeighbors(path[i])[String(path[i + 1])]);
                }
                if (cost < minCost) {
                  minCost = cost;
                  bestStallId = stallId;
                  bestEndNode = endNode;
                  bestPath = path;
                }
              }
            }
          }
        }
      } else {
        // Stall ID: support both 's1' and '1'
        let stallId = id.startsWith('s') ? id.slice(1) : id;
        const stallData = this.saveData.stalls[stallId];
        if (stallData && Array.isArray(stallData.stall_endNode)) {
          for (const endNode of stallData.stall_endNode) {
            const path = this.findPath(startNodeId, endNode);
            if (path.length > 0) {
              let cost = 0;
              for (let i = 0; i < path.length - 1; i++) {
                cost += parseFloat(this.getNeighbors(path[i])[String(path[i + 1])]);
              }
              if (cost < minCost) {
                minCost = cost;
                bestStallId = stallId;
                bestEndNode = endNode;
                bestPath = path;
              }
            }
          }
        }
      }
      console.log('[findClosestStallAndEndNode] result:', {
        stallId: bestStallId,
        endNode: bestEndNode,
        cost: minCost,
        path: bestPath
      });
      return {
        stallId: bestStallId,
        endNode: bestEndNode,
        cost: minCost,
        path: bestPath
      };
    }
          /**
           * Returns grouped stall_endNodes per stall for a given product or stall id, excluding visited stalls.
           * @param {string} id - product or stall id
           * @param {Set<string>} visitedStalls - set of visited stall IDs
           * @returns {Array<{stallId: string, stall_endNodes: number[]}>}
           */
           getGroupedStallEndNodes(id, visitedStalls = new Set()) {
    // Always group stall_endNodes for each stall ID, for both product and stall selection
    const stalls = this.getStallsToHighlight(id);
    const result = [];
    for (const stallIdRaw of stalls) {
      const stallId = String(stallIdRaw);
      if (visitedStalls.has(stallId)) continue;
      const stallData = this.saveData.stalls[stallId];
      result.push({
        stallId,
        stall_endNodes: stallData && Array.isArray(stallData.stall_endNode) ? stallData.stall_endNode : []
      });
    }
    return result;
           }
        /**
         * Returns stall IDs to highlight for a given ID (product or stall).
         * If id is a product ID (starts with 'p'), returns all stalls selling that product.
         * If id is a stall ID (number as string), returns just that stall.
         * @param {string} id
         * @returns {string[]} Array of stall IDs
         */
        getStallsToHighlight(id) {
          if (!id) return [];
          if (typeof id === 'string' && id.startsWith('p')) {
            // Product ID: highlight all stalls selling this product
            return this.getStallsForProduct(id);
          } else if (typeof id === 'string' && id.startsWith('s')) {
            // Stall ID with 's' prefix: remove 's' and return the number as string
            return [id.slice(1)];
          } else {
            // Stall ID: highlight just this stall
            return [String(id)];
          }
        }
      /**
       * Returns all stall_endNode values for stalls selling the given productId.
       * @param {string} productId
       * @returns {number[]} Array of stall_endNode values
       */
      getStallEndNodesForProduct(productId) {
        productId = String(productId);
        const endNodes = [];
        for (const stallData of Object.values(this.saveData.stalls)) {
          if ((stallData.products || []).includes(productId)) {
            for (const node of stallData.stall_endNode || []) {
              endNodes.push(node);
            }
          }
        }
        return endNodes;
      }
    /**
     * Returns an array of stall IDs that sell the given productId.
     * @param {number|string} productId
     * @returns {string[]} Array of stall IDs (as strings)
     */
    getStallsForProduct(productId) {
      // Ensure productId is a string (e.g., "p1")
      productId = String(productId);
      const stalls = [];
      for (const [stallId, stallData] of Object.entries(this.saveData.stalls)) {
        if ((stallData.products || []).includes(productId)) {
          stalls.push(stallId);
        }
      }
      return stalls;
    }
  constructor() {
    this.nodes = nodesData.nodes;
    this.connections = connectionsData.connections;
    this.saveData = saveData;
    this.resetState();
  }

  resetState() {
    this.visitedStalls = new Set();
    this.excludedEndNodes = new Set();
  }

  getNeighbors(nodeId) {
    return this.connections[String(nodeId)] || {};
  }

  getStallFromStall_endNode(nodeId) {
    for (const [stallId, stallData] of Object.entries(this.saveData.stalls)) {
      if ((stallData.stall_endNode || []).includes(nodeId)) {
        return stallId;
      }
    }
    return null;
  }

  getStall_endNodesForItem(itemId, itemType = 'Product', excludeNodes = new Set()) {
    console.log('[PathfinderController] getStall_endNodesForItem called:', { itemId, itemType, excludeNodes: Array.from(excludeNodes) });
    const stall_endNodes = [];
    itemId = parseInt(itemId, 10);
    if (itemType === 'Product') {
      for (const stallData of Object.values(this.saveData.stalls)) {
        if ((stallData.products || []).includes(itemId)) {
          for (const node of stallData.stall_endNode || []) {
            if (!excludeNodes.has(node)) stall_endNodes.push(node);
          }
        }
      }
    } else {
      const stall = this.saveData.stalls[String(itemId)];
      if (stall) {
        for (const node of stall.stall_endNode || []) {
          if (!excludeNodes.has(node)) stall_endNodes.push(node);
        }
      }
    }
    console.log('[PathfinderController] getStall_endNodesForItem result:', { itemId, itemType, stall_endNodes });
    return Array.from(new Set(stall_endNodes));
  }

  findPath(startId, endId) {
    // A* algorithm with Euclidean heuristic
    function euclidean(a, b) {
      const nodeA = this.nodes[String(a)];
      const nodeB = this.nodes[String(b)];
      if (!nodeA || !nodeB) return 0;
      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const frontier = [[euclidean.call(this, startId, endId), 0, startId]]; // [priority, costSoFar, node]
    const cameFrom = { [startId]: null };
    const costSoFar = { [startId]: 0 };

    while (frontier.length > 0) {
      frontier.sort((a, b) => a[0] - b[0]);
      const [, , current] = frontier.shift(); // Only use 'current'
      if (current === endId) break;
      for (const [nextStr, distance] of Object.entries(this.getNeighbors(current))) {
        const nextNode = parseInt(nextStr, 10);
        const newCost = costSoFar[current] + parseFloat(distance);
        if (!(nextNode in costSoFar) || newCost < costSoFar[nextNode]) {
          costSoFar[nextNode] = newCost;
          const heuristic = euclidean.call(this, nextNode, endId);
          frontier.push([newCost + heuristic, undefined, nextNode]);
          cameFrom[nextNode] = current;
        }
      }
    }
    // Reconstruct path
    let current = endId;
    const path = [];
    while (current !== null && current !== undefined) {
      path.push(current);
      current = cameFrom[current];
    }
    path.reverse();
    return path[0] === startId ? path : [];
  }

  findClosestStall_endNode(startId, possibleEndNodes) {
    if (!possibleEndNodes || possibleEndNodes.length === 0) return null;
    let minCost = Infinity;
    let bestNode = null;
    for (const endNode of possibleEndNodes) {
      const path = this.findPath(startId, endNode);
      if (path.length > 0) {
        let cost = 0;
        for (let i = 0; i < path.length - 1; i++) {
          cost += parseFloat(this.getNeighbors(path[i])[String(path[i + 1])]);
        }
        if (cost < minCost) {
          minCost = cost;
          bestNode = endNode;
        }
      }
    }
    return bestNode;
  }

  // Add more methods as needed for your app, e.g., findClosestProduct, optimizeShoppingRoute, etc.
  /**
   * Finds the closest product from the start node, reorders the shopping list to put it first, and returns info.
   * @param {number} startNodeId - The node ID to start from
   * @param {number[]} shoppingList - Array of product IDs
   * @returns {{closestProductId: number, path: number[], reorderedList: number[]}}
   */
  findClosestProduct(startNodeId, shoppingList) {
    if (!shoppingList || shoppingList.length === 0) return { closestProductId: null, path: [], reorderedList: [] };

    let minCost = Infinity;
    let bestProductId = null;
    let bestPath = [];
    let bestEndNode = null;

    for (const productId of shoppingList) {
      const possibleEndNodes = this.getStall_endNodesForItem(productId, 'Product');
      for (const endNode of possibleEndNodes) {
        const path = this.findPath(startNodeId, endNode);
        if (path.length > 0) {
          // Calculate cost
          let cost = 0;
          for (let i = 0; i < path.length - 1; i++) {
            cost += parseFloat(this.getNeighbors(path[i])[String(path[i + 1])]);
          }
          if (cost < minCost) {
            minCost = cost;
            bestProductId = productId;
            bestPath = path;
            bestEndNode = endNode;
          }
        }
      }
    }

    // Reorder shopping list: closest product first
    let reorderedList = shoppingList.slice();
    if (bestProductId !== null) {
      reorderedList = [bestProductId, ...shoppingList.filter(id => id !== bestProductId)];
    }

    return {
      closestProductId: bestProductId,
      path: bestPath,
      reorderedList,
      endNode: bestEndNode,
      cost: minCost
    };
  }
}

export default PathfinderController;
