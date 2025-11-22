import React from 'react';
import { View, ScrollView, StyleSheet, Button } from 'react-native';
import { WebView } from 'react-native-webview';

const AboutScreen: React.FC<any> = ({ navigation }) => {
  const currentYear = new Date().getFullYear();
  const content = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:Arial,sans-serif;padding:20px}h1{color:#333}p{line-height:1.6}</style></head><body><h1>About ReachMe</h1><p>ReachMe is a critical notification system that ensures important alerts reach you.</p><p>© ${currentYear} ReachMe. All rights reserved.</p></body></html>`;
  return (
    <View style={styles.container}>
      <WebView source={{ html: content }} style={styles.webview} />
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});

export default AboutScreen;
