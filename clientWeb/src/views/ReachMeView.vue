<template>
  <div class="reachme-container">
    <h1>Reach Me</h1>
    <div class="options-grid">
      <div class="option-card" @click="navigateTo('/reachme/add-public')">
        <div class="option-icon">📝</div>
        <h2>Add Public Reach Me</h2>
        <p>Create a new public reach me URL</p>
      </div>

      <div class="option-card" @click="navigateTo('/reachme/view-public')">
        <div class="option-icon">📋</div>
        <h2>View Public Reach Mes</h2>
        <p>Manage your existing public reach me URLs</p>
      </div>

      <div class="option-card disabled">
        <div class="option-icon">➕</div>
        <h2>Add a Reach Me</h2>
        <p class="coming-soon">Coming soon...</p>
      </div>

      <div class="option-card disabled">
        <div class="option-icon">🔍</div>
        <h2>Search for a Reach Me</h2>
        <p class="coming-soon">Coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.reachme-container {
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

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.option-card {
  background: #1f1f1f;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.option-card:not(.disabled):hover {
  background: #2a2a2a;
  border-color: #4a90e2;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.option-card.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.option-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.option-card h2 {
  color: #fff;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.option-card p {
  color: #aaa;
  font-size: 0.9rem;
  margin: 0;
}

.option-card p.coming-soon {
  color: #888;
  font-style: italic;
}

@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
}
</style>
