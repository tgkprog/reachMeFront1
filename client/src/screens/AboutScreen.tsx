import React, {useEffect, useState} from 'react';
import {View, ScrollView, StyleSheet, Button} from 'react-native';
import {WebView} from 'react-native-webview';

interface Props {
  navigation: any;
}

const AboutScreen: React.FC<Props> = ({navigation}) => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    loadAboutContent();
  }, []);

  const loadAboutContent = () => {
    // Load from src/resources/about.html
    // For now, using inline content with year replacement
    const currentYear = new Date().getFullYear();
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          p { line-height: 1.6; }
        </style>
      </head>
      <body>
        <h1>About ReachMe</h1>
        <p>ReachMe is a critical notification system that ensures important alerts reach you, even when your device is on Do Not Disturb mode.</p>
        <h2>Features</h2>
        <ul>
          <li>DND bypass for critical alarms</li>
          <li>Overlay notifications</li>
          <li>Customizable polling intervals</li>
          <li>Sleep and mute controls</li>
        </ul>
        <h2>Permissions</h2>
        <p>ReachMe requires several permissions to function properly:</p>
        <ul>
          <li><strong>Overlay:</strong> Display floating alerts</li>
          <li><strong>DND Access:</strong> Play alarms even in Do Not Disturb mode</li>
          <li><strong>Exact Alarms:</strong> Trigger notifications at precise times</li>
          <li><strong>Battery Optimization:</strong> Keep service running in background</li>
        </ul>
        <p>© ${currentYear} ReachMe. All rights reserved.</p>
      </body>
      </html>
    `;

    setHtmlContent(content);
  };

  return (
    <View style={styles.container}>
      <WebView source={{html: htmlContent}} style={styles.webview} />
      <Button title="Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default AboutScreen;
