/* eslint-disable prettier/prettier */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import db from '../backend/database';

export default function DatabaseViewer() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [rows, setRows] = useState([]);

  // Get all tables
  const fetchTables = () => {
    try {
      const result = db.getAllSync(
        "SELECT name FROM sqlite_master WHERE type='table';"
      );
      setTables(result);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  // Get table data
  const fetchTableData = tableName => {
    try {
      const result = db.getAllSync(`SELECT * FROM ${tableName}`);
      setRows(result);
      setSelectedTable(tableName);
    } catch (error) {
      console.error('Error fetching table data:', error);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 SQLite Viewer</Text>

      {/* Tables List */}
      <ScrollView horizontal style={styles.tableList}>
        {tables.map((table, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tableButton}
            onPress={() => fetchTableData(table.name)}
          >
            <Text style={styles.tableText}>{table.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Table */}
      {selectedTable && (
        <>
          <Text style={styles.subtitle}>
            Table: {selectedTable}
          </Text>

          <ScrollView horizontal>
            <View>
              {/* Headers */}
              <View style={styles.row}>
                {rows[0] &&
                  Object.keys(rows[0]).map((col, i) => (
                    <Text key={i} style={styles.headerCell}>
                      {col}
                    </Text>
                  ))}
              </View>

              {/* Data Rows */}
              <ScrollView style={{ maxHeight: 400 }}>
                {rows.map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.row}>
                    {Object.values(row).map((value, colIndex) => (
                      <Text key={colIndex} style={styles.cell}>
                        {String(value)}
                      </Text>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </>
      )}

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchTables}>
        <Text style={{ color: '#fff' }}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#111',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#0f0',
    marginVertical: 10,
  },
  tableList: {
    marginBottom: 10,
  },
  tableButton: {
    backgroundColor: '#333',
    padding: 10,
    marginRight: 8,
    borderRadius: 6,
  },
  tableText: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  headerCell: {
    color: '#0f0',
    fontWeight: 'bold',
    padding: 6,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#555',
  },
  cell: {
    color: '#fff',
    padding: 6,
    minWidth: 100,
    borderWidth: 1,
    borderColor: '#333',
  },
  refreshBtn: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    padding: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
});