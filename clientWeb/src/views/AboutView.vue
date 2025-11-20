<template>
  <div class="about-container">
    <h1>About</h1>
    <div class="content" v-html="htmlContent"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/config/axios'

const htmlContent = ref('')

onMounted(async () => {
  try {
    const response = await api.get('/about.html')
    htmlContent.value = response.data
  } catch (error) {
    console.error('Failed to load about content:', error)
    htmlContent.value = '<p>Failed to load about page.</p>'
  }
})
</script>

<style scoped>
.about-container {
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

h1 {
  font-size: 2rem;
  color: #fff;
  margin-bottom: 2rem;
}

.content {
  background: #1f1f1f;
  padding: 2rem;
  border-radius: 8px;
  color: #ddd;
  line-height: 1.6;
}
</style>
