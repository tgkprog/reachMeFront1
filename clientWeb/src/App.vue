<template>
  <div id="app">
    <HeaderMenu v-if="showHeader" />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import HeaderMenu from '@/components/HeaderMenu.vue'

const route = useRoute()

// Show header on all pages except login
const showHeader = computed(() => {
  return route.path !== '/login'
})
</script>

<style>
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

