<template>
  <div class="alarms-container">
    <h1>Alarm History</h1>
    <div v-if="notificationPermission !== 'granted'" class="notification-banner">
      <p>⚠️ Notifications are blocked. You won't receive real-time alerts.</p>
      <button @click="requestNotificationPermission" class="btn-primary">
        Enable Notifications
      </button>
    </div>
    
    <div v-if="alarms.length === 0" class="empty">
      No alarms in history
    </div>
    
    <div v-else class="alarms-list">
      <div v-for="alarm in alarms" :key="alarm.id" class="alarm-card">
        <div class="alarm-header">
          <h3>{{ alarm.title }}</h3>
          <span class="alarm-time">{{ formatAge(alarm.create_date) }}</span>
        </div>
        <p class="alarm-message">{{ alarm.msg }}</p>
        
        <button @click="alarm.expanded = !alarm.expanded" class="btn-expand" title="Toggle Details">
          ⋮⋮⋮⋮⋮
        </button>

        <div class="alarm-details" v-if="alarm.expanded">
          <p><strong>Date:</strong> {{ parseDate(alarm.create_date).toLocaleString(undefined, { timeZoneName: 'short' }) }}</p>
          <p v-if="alarm.name"><strong>From:</strong> {{ alarm.name }}</p>
          <p v-if="alarm.relationship"><strong>Relationship:</strong> {{ alarm.relationship }}</p>
          <p v-if="alarm.email"><strong>Email:</strong> {{ alarm.email }}</p>
          <p v-if="alarm.phone"><strong>Phone:</strong> {{ alarm.phone }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import storage from '@/services/storage'
import { useAlarmStore } from '@/stores/alarms'

const alarmStore = useAlarmStore()

const alarms = ref<any[]>([])
const notificationPermission = ref(Notification.permission)

onMounted(() => {
  loadAlarms()
  alarmStore.clearUnread()
})

function parseDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  // Always use standard Date constructor which handles UTC (Z) and timezone offsets correctly
  return new Date(dateStr)
}

function loadAlarms() {
  const history = storage.getAlarmHistory().map(a => ({ ...a, expanded: false }))
  // Sort by create_date descending (newest first)
  alarms.value = history.sort((a, b) => {
    return parseDate(b.create_date).getTime() - parseDate(a.create_date).getTime()
  })
}

function formatAge(dateString: string): string {
  const date = parseDate(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    notificationPermission.value = permission
  }
}
</script>

<style scoped>
.alarms-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.banner-img {
  width: 100%;
  max-height: 120px;
  object-fit: contain;
  margin-bottom: 2rem;
  border-radius: 8px;
  background: #1f1f1f;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h1 {
  font-size: 2rem;
  color: #fff;
}

.notification-banner {
  background: #ff9800;
  color: #000;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.notification-banner p {
  margin: 0;
  font-weight: 600;
}

.empty {
  text-align: center;
  color: #888;
  padding: 3rem;
  font-size: 1.2rem;
}

.alarms-list {
  display: grid;
  gap: 1rem;
}

.alarm-card {
  background: #1f1f1f;
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #4a90e2;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.alarm-header h3 {
  margin: 0;
  color: #fff;
  font-size: 1.25rem;
}

.alarm-time {
  color: #888;
  font-size: 0.9rem;
}

.alarm-message {
  color: #ddd;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.btn-expand {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 0.5rem 0;
  font-size: 1.2rem;
  text-decoration: none;
  margin-bottom: 0.5rem;
  width: 100%;
  text-align: center;
  letter-spacing: 3px;
}

.btn-expand:hover {
  color: #bbb;
}

.alarm-details {
  padding-top: 1rem;
  border-top: 1px solid #333;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.alarm-details p {
  margin: 0.5rem 0;
  color: #aaa;
  font-size: 0.9rem;
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
</style>
