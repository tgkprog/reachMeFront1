<template>
  <div class="about-container">
    <img src="/reachmeBanner.png" alt="ReachMe" class="banner-img" />

    <div class="header">
      <h1>About</h1>
      <button @click="goBack" class="btn-secondary">Back to Controls</button>
    </div>
    
    <div class="content" v-html="htmlContent"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import config from '@/config'

const router = useRouter()
const htmlContent = ref('')

onMounted(async () => {
  try {
    const response = await axios.get(`${config.api.baseUrl}/about.html`)
    htmlContent.value = response.data
  } catch (error) {
    console.error('Failed to load about content:', error)
    htmlContent.value = '<p>Failed to load about page.</p>'
  }
})

function goBack() {
  router.push('/controls')
}
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

.content {
  background: #1f1f1f;
  padding: 2rem;
  border-radius: 8px;
  color: #ddd;
  line-height: 1.6;
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
