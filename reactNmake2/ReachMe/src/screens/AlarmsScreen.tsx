import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Platform,
} from 'react-native';
import { StorageService } from '../services/StorageService';

const formatAge = (ts: number) => {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
};

const AlarmsScreen: React.FC<any> = ({ navigation }) => {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const history = await StorageService.getAlarmHistory();
    setAlarms(history.sort((a, b) => b.ts - a.ts));
    if (Platform.OS === 'web' && 'Notification' in window) {
      setNotificationsBlocked(
        (window as any).Notification.permission !== 'granted',
      );
    }
  };

  const requestPermission = async () => {
    if (
      Platform.OS === 'web' &&
      'Notification' in window &&
      (window as any).Notification.permission === 'default'
    ) {
      await (window as any).Notification.requestPermission();
      load();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Alarms History</Text>
      <Text style={styles.meta}>
        Stored max 100, auto-removed after 2 days.
      </Text>
      {notificationsBlocked && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Browser notifications not granted. Alarms will appear here only.
          </Text>
          {Platform.OS === 'web' &&
            (window as any).Notification.permission === 'default' && (
              <Button
                title="Enable Notifications"
                onPress={requestPermission}
              />
            )}
        </View>
      )}
      {alarms.length === 0 && (
        <Text style={styles.empty}>No alarms received yet.</Text>
      )}
      {alarms.map(a => (
        <View key={a.id + a.ts} style={styles.item}>
          <View style={styles.row}>
            <Text style={styles.title}>{a.title || 'Alarm'}</Text>
            <Text style={styles.age}>{formatAge(a.ts)}</Text>
          </View>
          <Text style={styles.msg}>{a.msg || '(no message)'}</Text>
          <Text style={styles.id}>ID: {a.id}</Text>
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  meta: { fontSize: 12, color: '#666', marginBottom: 12, textAlign: 'center' },
  banner: {
    backgroundColor: '#ffe9d5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  bannerText: { fontSize: 13, marginBottom: 8, color: '#663300' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  item: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 16, fontWeight: '500' },
  age: { fontSize: 12, color: '#555' },
  msg: { fontSize: 14, marginBottom: 6 },
  id: { fontSize: 10, color: '#888' },
});

export default AlarmsScreen;
