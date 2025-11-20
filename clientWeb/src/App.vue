<template>
  <div id="app">
    <HeaderMenu v-if="showHeader" />
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
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useAlarmStore } from '@/stores/alarms'
import { useRoute } from 'vue-router'
import HeaderMenu from '@/components/HeaderMenu.vue'
import pollingService from '@/services/polling'
import storage from '@/services/storage'
import authService from '@/services/auth'

const route = useRoute()

const alarmStore = useAlarmStore()
const { latestAlarm } = storeToRefs(alarmStore)
const alarmTimeout = ref<number | null>(null)

// Show header on all pages except login
const showHeader = computed(() => {
  return route.path !== '/login'
})

// Start/stop polling based on login status
async function initPolling() {
  const isLoggedIn = await authService.isLoggedIn()
  
  if (isLoggedIn && !pollingService.isPolling) {
    const settings = storage.getPollSettings()
    const intervalSeconds = settings?.intervalSeconds || 30
    pollingService.start(intervalSeconds)
  } else if (!isLoggedIn && pollingService.isPolling) {
    pollingService.stop()
  }
}

// Initialize polling on mount
onMounted(() => {
  initPolling()
  watch(latestAlarm, (val) => {
    if (val) {
      if (alarmTimeout.value) clearTimeout(alarmTimeout.value)
      alarmTimeout.value = setTimeout(() => {
        dismissAlarm()
      }, 120000)
    } else {
      if (alarmTimeout.value) clearTimeout(alarmTimeout.value)
      alarmTimeout.value = null
    }
  }, { immediate: true })
})

// Watch for route changes to handle login/logout
watch(() => route.path, async () => {
  await initPolling()
})

// Stop polling when component unmounts
onUnmounted(() => {
  pollingService.stop()
  if (alarmTimeout.value) clearTimeout(alarmTimeout.value)
})

function dismissAlarm() {
  alarmStore.dismissAlarm()
}
</script>

<style>
/* Alarm Banner Styles */
.alarm-banner {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #ff4444;
  color: #fff;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  z-index: 1000;
  min-width: 280px;
  max-width: 90vw;
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 2rem;
}
.alarm-content {
  flex: 1;
}
.alarm-msg {
  font-size: 1.1rem;
  margin: 0.5rem 0;
}
.alarm-details {
  font-size: 0.95rem;
  color: #ffe0e0;
}
.alarm-time {
  font-size: 0.85rem;
  color: #fff;
  margin-top: 0.5rem;
}
.btn-dismiss {
  background: #fff;
  color: #ff4444;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.btn-dismiss:hover {
  background: #ffe0e0;
  color: #d32f2f;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #121212;
  color: #e0e0e0;
}

#app {
  min-height: 100vh;
}

button {
  font-family: inherit;
  border: none;
  cursor: pointer;
}
</style>

