<template>
  <div class="reachme-container">
    <img src="/reachmeBanner.png" alt="ReachMe" class="banner-img" />

    <h1>Reach Me</h1>
    
    <div class="placeholder">
      <p>Reach Me management coming soon...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Placeholder for reach me view
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

.placeholder {
  background: #1f1f1f;
  padding: 3rem;
  border-radius: 8px;
  text-align: center;
  color: #888;
  font-size: 1.2rem;
}
</style>
