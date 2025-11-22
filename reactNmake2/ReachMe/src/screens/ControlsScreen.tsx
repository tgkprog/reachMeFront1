import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Alert,
  StyleSheet,
  Button,
  Platform,
} from 'react-native';
import { StorageService } from '../services/StorageService';
import NativeBridge from '../native/NativeBridge';

const ControlsScreen: React.FC<any> = ({ navigation }) => {
  const [sleepDays, setSleepDays] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [muteDays, setMuteDays] = useState(0);
  const [muteHours, setMuteHours] = useState(0);
  const [muteMinutes, setMuteMinutes] = useState(0);
  const [pollMinutes, setPollMinutes] = useState(0);
  const [pollSeconds, setPollSeconds] = useState(30);

  useEffect(() => {
    loadSettingsAndEnsurePolling();
    startForegroundService();
  }, []);

  const loadSettingsAndEnsurePolling = async () => {
    const settings = await StorageService.getPollSettings();
    if (settings) {
      setPollMinutes(settings.minutes);
      setPollSeconds(settings.seconds);
    }
  };

  const startForegroundService = async () => {
    if (Platform.OS === 'android') {
      await NativeBridge.startForegroundService();
    }
  };

  const handleSleep = async () => {
    const durationMs =
      (sleepDays * 24 * 60 * 60 + sleepHours * 60 * 60 + sleepMinutes * 60) *
      1000;
    const sleepUntil = Date.now() + durationMs;
    await StorageService.setSleepUntil(sleepUntil);
    Alert.alert(
      'Success',
      `Sleeping for ${sleepDays}d ${sleepHours}h ${sleepMinutes}m`,
    );
  };

  const handleMute = async () => {
    const durationMs =
      (muteDays * 24 * 60 * 60 + muteHours * 60 * 60 + muteMinutes * 60) * 1000;
    const muteUntil = Date.now() + durationMs;
    await StorageService.setMuteUntil(muteUntil);
    Alert.alert(
      'Success',
      `Muted for ${muteDays}d ${muteHours}h ${muteMinutes}m`,
    );
  };

  const handlePollUpdate = async () => {
    Alert.alert(
      'Not implemented',
      'Poll interval update not wired in this snapshot',
    );
  };

  const checkPermissions = async () => {
    // For Android, real permission checks will be implemented in native bridge
    Alert.alert(
      'Permissions',
      'Permission checks are handled by native code in the next iteration',
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          await StorageService.clearAuth();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});

export default ControlsScreen;
