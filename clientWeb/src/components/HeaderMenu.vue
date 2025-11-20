<template>
  <header class="main-header">
    <img src="/reachmeBanner.png" alt="ReachMe" class="banner-img" />
    <nav class="navigation-menu">
      <div class="nav-links-wrapper">
        <RouterLink
          v-for="item in menuItems"
          :key="item.name"
          :to="item.path"
          class="nav-link"
        >
          {{ item.label }}
          <span v-if="item.badge && item.badge > 0" class="badge">{{ item.badge }}</span>
        </RouterLink>
        <a href="#" @click.prevent="handleLogout" class="nav-link logout-link">
          Logout
        </a>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAlarmStore } from '@/stores/alarms'
import authService from '@/services/auth'
import pollingService from '@/services/polling'

const router = useRouter()
const alarmStore = useAlarmStore()
const { unreadCount } = storeToRefs(alarmStore)

const menuItems = computed(() => [
  { path: '/controls', label: 'Controls', name: 'Controls' },
  { path: '/alarms', label: 'Alarms', name: 'Alarms', badge: unreadCount.value },
  { path: '/contacts', label: 'Contacts', name: 'Contacts' },
  { path: '/reachme', label: 'Reach Me', name: 'ReachMe' },
  { path: '/about', label: 'About', name: 'About' },
])

async function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    pollingService.stop()
    await authService.logout()
    router.push('/login')
  }
}
</script>

<style scoped>
.main-header {
  background: #1f1f1f;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 2rem;
}


.navigation-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nav-links-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
}

.nav-link {
  color: #e0e0e0;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s, color 0.2s;
  cursor: pointer;
  font-weight: 500;
  position: relative;
  flex: 1 1 40%;
  min-width: 120px;
  max-width: 48%;
  box-sizing: border-box;
}

.nav-link:hover:not(.router-link-active) {
  background: #333;
  color: #fff;
}

.nav-link.router-link-active {
  background: #4a90e2;
  color: #fff;
  cursor: default;
  font-weight: 600;
}

.logout-link {
  color: #ff6b6b;
}

.logout-link:hover {
  background: #ff4444;
  color: #fff;
}

.badge {
  background: #ff4444;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  font-weight: 600;
}


@media (max-width: 768px) {
  .nav-links-wrapper {
    gap: 0.5rem;
    max-width: 100%;
  }
  .nav-link {
    padding: 0.5rem 0.5rem;
    font-size: 0.95rem;
    min-width: 48%;
    max-width: 48%;
  }
}

.banner-img {
  width: 100%;
  max-height: 120px;
  object-fit: contain;
  margin-bottom: 1rem;
  border-radius: 8px;
  background: #1f1f1f;
  padding: 1rem;
}
</style>

<style scoped>
@media (min-width: 769px) {
  .nav-links-wrapper {
    flex-wrap: nowrap;
    gap: 1.5rem;
    max-width: 100%;
  }
  .nav-link {
    min-width: unset;
    max-width: unset;
    flex: unset;
  }
}
</style>
