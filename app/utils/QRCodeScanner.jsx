/* eslint-disable prettier/prettier */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QRCodeScanner({ onScan }) {
  const [scanned, setScanned] = useState(false);
  const [scannedValue, setScannedValue] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = ({ data }) => {
    setScanned(true);
    setScannedValue(data);
    if (onScan) onScan(data);
  };

  const resetScan = () => {
    setScanned(false);
    setScannedValue(null);
  };

  if (!permission?.granted) return <Text style={styles.permissionText}>Camera permission required</Text>;

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.guideBox} />
        <Text style={styles.instructionText}>Align QR code inside the frame</Text>
        {scanned && (
          <View pointerEvents="auto">
            <TouchableOpacity style={styles.rescanButton} onPress={resetScan}>
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  permissionText: {
    color: 'white',
    textAlign: 'center',
    marginTop: '50%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  guideBox: {
    width: 250,
    height: 250,
    borderColor: '#e7e7e7',
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  rescanButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});
