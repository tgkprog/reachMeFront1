<template>
  <div class="controls-container">
    <!-- Alarm Banner -->
    <div v-if="latestAlarm" class="alarm-banner">
      <div class="alarm-content">
        <h3>🚨 {{ latestAlarm.title }}</h3>
        <p class="alarm-msg">{{ latestAlarm.msg }}</p>
        <div class="alarm-details">
          <span v-if="latestAlarm.name">From: {{ latestAlarm.name }}</span>
          <span v-if="latestAlarm.relationship">({{ latestAlarm.relationship }})</span>
        </div>
        <div class="alarm-time">
          {{ new Date(latestAlarm.create_date).toLocaleString(undefined, { timeZoneName: 'short' }) }}
        </div>
      </div>
      <button @click="dismissAlarm" class="btn-dismiss">Dismiss</button>
    </div>

    <h1>ReachMe Controls</h1>
    
    <div class="user-info" v-if="user">
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p v-if="user.name"><strong>Name:</strong> {{ user.name }}</p>
    </div>
    
    <div class="controls">
      <div class="control-section">
        <h2>Polling</h2>
        <div class="control-row">
          <label>Interval (seconds):</label>
          <input
            v-model.number="pollInterval"
            type="number"
            min="10"
            max="300"
            class="input-small"
          />
          <button @click="updatePollInterval" class="btn-primary">Update</button>
        </div>
        <p class="status">
          Status: <span :class="{ active: isPolling }">{{ isPolling ? 'Active' : 'Inactive' }}</span>
        </p>
      </div>
      
      <div class="control-section">
        <h2>Notifications</h2>
        <p class="status">
          Permission: <span :class="{ active: notificationPermission === 'granted' }">
            {{ notificationPermission }}
          </span>
        </p>
        <button
          v-if="notificationPermission !== 'granted'"
          @click="requestNotificationPermission"
          class="btn-primary"
        >
          Enable Notifications
        </button>
      </div>
      
      <div class="control-section">
        <h2>Device ID</h2>
        <p class="device-id">{{ deviceId }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import pollingService from '@/services/polling'
import storage from '@/services/storage'
import { useAlarmStore } from '@/stores/alarms'

const alarmStore = useAlarmStore()
const { latestAlarm } = storeToRefs(alarmStore)

const user = ref(storage.getUser())
const deviceId = ref(storage.getDeviceId())
const pollInterval = ref(60)
const isPolling = computed(() => pollingService.isPolling)
const notificationPermission = ref(Notification.permission)

onMounted(() => {
  // Load saved poll interval
  const settings = storage.getPollSettings()
  if (settings && settings.intervalSeconds) {
    pollInterval.value = settings.intervalSeconds
  }
  
  // Request notification permission if needed
  if (notificationPermission.value === 'default') {
    requestNotificationPermission()
  }
})

function dismissAlarm() {
  alarmStore.dismissAlarm()
}

function updatePollInterval() {
  if (pollInterval.value < 10 || pollInterval.value > 300) {
    alert('Interval must be between 10 and 300 seconds')
    return
  }
  
  storage.savePollSettings({
    intervalSeconds: pollInterval.value,
    enabled: true,
  })
  
  pollingService.updateInterval(pollInterval.value)
}

async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    notificationPermission.value = permission
  }
}
</script>

<style scoped>
.controls-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.alarm-banner {
  background: #ff4444;
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.alarm-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.alarm-msg {
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.alarm-details {
  font-size: 0.9rem;
  opacity: 0.9;
}

.alarm-time {
  font-size: 0.8rem;
  margin-top: 0.5rem;
  opacity: 0.8;
}

.btn-dismiss {
  background: white;
  color: #ff4444;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.1s;
}

.btn-dismiss:hover {
  transform: scale(1.05);
}

h1 {
  font-size: 2rem;
  color: #fff;
  margin-bottom: 2rem;
}

.user-info {
  background: #1f1f1f;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.user-info p {
  margin: 0.5rem 0;
  color: #ddd;
}

.controls {
  display: grid;
  gap: 1.5rem;
}

.control-section {
  background: #1f1f1f;
  padding: 1.5rem;
  border-radius: 8px;
}

.control-section h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #fff;
  font-size: 1.5rem;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.control-row label {
  color: #ddd;
}

.input-small {
  padding: 0.5rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  width: 100px;
}

.status {
  color: #888;
  margin-top: 1rem;
}

.status span {
  font-weight: bold;
  color: #ff6b6b;
}

.status span.active {
  color: #51cf66;
}

.device-id {
  font-family: monospace;
  background: #2a2a2a;
  padding: 0.75rem;
  border-radius: 6px;
  color: #4a90e2;
  word-break: break-all;
}

.btn-primary {
  padding: 0.5rem 1rem;
  background: #4a90e2;
  color: white;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #357abd;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  background: #444;
  color: white;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #555;
}

.btn-danger {
  padding: 0.5rem 1rem;
  background: #ff4444;
  color: white;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-danger:hover {
  background: #cc0000;
}
</style>
