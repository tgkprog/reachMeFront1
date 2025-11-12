import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Button, Alert, ScrollView, Platform} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {StorageService} from '../services/StorageService';
import {PollService} from '../services/PollService';
import {AuthService} from '../services/AuthService';
import {NativeBridge} from '../native/NativeBridge';

interface Props {
  navigation: any;
}

const ControlsScreen: React.FC<Props> = ({navigation}) => {
  const [sleepDays, setSleepDays] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [muteDays, setMuteDays] = useState(0);
  const [muteHours, setMuteHours] = useState(0);
  const [muteMinutes, setMuteMinutes] = useState(0);
  const [pollMinutes, setPollMinutes] = useState(0);
  const [pollSeconds, setPollSeconds] = useState(30);

  const authService = new AuthService();
  let pollService: PollService;

  useEffect(() => {
    loadSettings();
    startForegroundService();
  }, []);

  const loadSettings = async () => {
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
      (sleepDays * 24 * 60 * 60 + sleepHours * 60 * 60 + sleepMinutes * 60) * 1000;
    const sleepUntil = Date.now() + durationMs;
    await StorageService.setSleepUntil(sleepUntil);
    Alert.alert('Success', `Sleeping for ${sleepDays}d ${sleepHours}h ${sleepMinutes}m`);
  };

  const handleMute = async () => {
    const durationMs =
      (muteDays * 24 * 60 * 60 + muteHours * 60 * 60 + muteMinutes * 60) * 1000;
    const muteUntil = Date.now() + durationMs;
    await StorageService.setMuteUntil(muteUntil);
    Alert.alert('Success', `Muted for ${muteDays}d ${muteHours}h ${muteMinutes}m`);
  };

  const handlePollUpdate = async () => {
    await StorageService.savePollSettings(pollMinutes, pollSeconds);
    Alert.alert('Success', `Poll interval updated to ${pollMinutes}m ${pollSeconds}s`);
  };

  const checkPermissions = async () => {
    const perms = await NativeBridge.checkPermissions();
    const missing = [];

    if (!perms.overlay) {
      missing.push('Overlay');
      await NativeBridge.requestOverlayPermission();
    }
    if (!perms.dnd) {
      missing.push('DND Access');
      await NativeBridge.requestDNDPermission();
    }
    if (!perms.exactAlarm) {
      missing.push('Exact Alarms');
      await NativeBridge.requestExactAlarmPermission();
    }
    if (!perms.batteryOptimization) {
      missing.push('Battery Optimization');
      await NativeBridge.requestBatteryOptimization();
    }

    if (missing.length === 0) {
      Alert.alert('Permissions', 'All permissions granted!');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel'},
      {
        text: 'Logout',
        onPress: async () => {
          await authService.logout(false);
          await NativeBridge.stopForegroundService();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>ReachMe Controls</Text>

      {/* Sleep Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep (no polling)</Text>
        <View style={styles.row}>
          <Picker
            selectedValue={sleepDays}
            onValueChange={setSleepDays}
            style={styles.picker}>
            {[...Array(8)].map((_, i) => (
              <Picker.Item key={i} label={`${i}d`} value={i} />
            ))}
          </Picker>
          <Picker
            selectedValue={sleepHours}
            onValueChange={setSleepHours}
            style={styles.picker}>
            {[...Array(24)].map((_, i) => (
              <Picker.Item key={i} label={`${i}h`} value={i} />
            ))}
          </Picker>
          <Picker
            selectedValue={sleepMinutes}
            onValueChange={setSleepMinutes}
            style={styles.picker}>
            {[...Array(60)].map((_, i) => (
              <Picker.Item key={i} label={`${i}m`} value={i} />
            ))}
          </Picker>
        </View>
        <Button title="Set Sleep" onPress={handleSleep} />
      </View>

      {/* Mute Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mute (poll but silent)</Text>
        <View style={styles.row}>
          <Picker selectedValue={muteDays} onValueChange={setMuteDays} style={styles.picker}>
            {[...Array(8)].map((_, i) => (
              <Picker.Item key={i} label={`${i}d`} value={i} />
            ))}
          </Picker>
          <Picker
            selectedValue={muteHours}
            onValueChange={setMuteHours}
            style={styles.picker}>
            {[...Array(24)].map((_, i) => (
              <Picker.Item key={i} label={`${i}h`} value={i} />
            ))}
          </Picker>
          <Picker
            selectedValue={muteMinutes}
            onValueChange={setMuteMinutes}
            style={styles.picker}>
            {[...Array(60)].map((_, i) => (
              <Picker.Item key={i} label={`${i}m`} value={i} />
            ))}
          </Picker>
        </View>
        <Button title="Set Mute" onPress={handleMute} />
      </View>

      {/* Poll Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Poll Interval</Text>
        <View style={styles.row}>
          <Picker
            selectedValue={pollMinutes}
            onValueChange={setPollMinutes}
            style={styles.picker}>
            <Picker.Item label="0m" value={0} />
            <Picker.Item label="1m" value={1} />
            <Picker.Item label="2m" value={2} />
          </Picker>
          <Picker
            selectedValue={pollSeconds}
            onValueChange={setPollSeconds}
            style={styles.picker}>
            <Picker.Item label="10s" value={10} />
            <Picker.Item label="20s" value={20} />
            <Picker.Item label="30s" value={30} />
            <Picker.Item label="40s" value={40} />
            <Picker.Item label="50s" value={50} />
          </Picker>
        </View>
        <Button title="Update Poll Interval" onPress={handlePollUpdate} />
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Button title="About" onPress={() => navigation.navigate('About')} />
        <View style={{marginVertical: 5}} />
        <Button title="Check All Permissions" onPress={checkPermissions} />
        <View style={{marginVertical: 5}} />
        <Button title="Logout" onPress={handleLogout} color="red" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  picker: {
    flex: 1,
    height: 50,
  },
});

export default ControlsScreen;
