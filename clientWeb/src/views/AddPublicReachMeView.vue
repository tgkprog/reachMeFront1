<template>
  <div class="add-public-reachme-container">
    <h1>Add Public Reach Me</h1>

    <form v-if="!createdReachMe" @submit.prevent="submitForm" class="form">
      <div class="form-group">
        <label for="deactivateAt">Deactivate At (optional)</label>
        <input
          type="datetime-local"
          id="deactivateAt"
          v-model="form.deactivateAt"
          class="form-control"
        />
      </div>

      <button type="submit" class="btn-primary">Create</button>
    </form>

    <!-- Success Response Display -->
    <div v-if="createdReachMe" class="success-card">
      <div class="success-header">
        <span class="success-icon">✓</span>
        <h2>Public Reach Me Created Successfully!</h2>
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <label>URL Code:</label>
          <span class="info-value">{{ createdReachMe.urlCode }}</span>
        </div>
        
        <div class="info-item">
          <label>Status:</label>
          <span class="info-value status-active">{{ createdReachMe.isActive ? 'Active' : 'Inactive' }}</span>
        </div>
        
        <div class="info-item">
          <label>Created At:</label>
          <span class="info-value">{{ formatDate(createdReachMe.createdAt) }}</span>
        </div>
        
        <div v-if="createdReachMe.deactivateAt" class="info-item">
          <label>Deactivate At:</label>
          <span class="info-value">{{ formatDate(createdReachMe.deactivateAt) }}</span>
        </div>
      </div>

      <div class="url-section">
        <label>Full URL:</label>
        <div class="url-display">
          <input 
            type="text" 
            :value="createdReachMe.fullUrl" 
            readonly 
            class="url-input"
          />
          <button @click="copyUrl" class="btn-copy">
            {{ copied ? '✓ Copied!' : '📋 Copy URL' }}
          </button>
        </div>
      </div>

      <button @click="createAnother" class="btn-primary">Create Another</button>
    </div>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <button @click="goBack" class="btn-secondary">Back</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/config/axios';

const router = useRouter();
const form = ref({
  deactivateAt: null,
});
const createdReachMe = ref(null);
const errorMessage = ref('');
const copied = ref(false);

async function submitForm() {
  try {
    const response = await api.post('/public-reachme/create', {
      deactivateAt: form.value.deactivateAt || null,
    });

    if (response.status === 200 && response.data.success) {
      createdReachMe.value = response.data;
      errorMessage.value = '';
    } else {
      throw new Error(response.data.message || 'Failed to create Public Reach Me');
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'An error occurred';
  }
}

async function copyUrl() {
  if (!createdReachMe.value) return;
  
  try {
    await navigator.clipboard.writeText(createdReachMe.value.fullUrl);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    errorMessage.value = 'Failed to copy URL to clipboard';
  }
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
}

function createAnother() {
  createdReachMe.value = null;
  form.value.deactivateAt = null;
  copied.value = false;
  errorMessage.value = '';
}

function goBack() {
  router.back();
}
</script>

<style scoped>
.add-public-reachme-container {
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #fff;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ccc;
}

input.form-control {
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  font-size: 1rem;
}

input.form-control:focus {
  outline: none;
  border-color: #4a90e2;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #4a90e2;
  color: white;
}

.btn-primary:hover {
  background-color: #357abd;
}

.btn-secondary {
  background-color: #444;
  color: white;
  margin-top: 1rem;
}

.btn-secondary:hover {
  background-color: #555;
}

.success-card {
  background: linear-gradient(135deg, #1a3a1a 0%, #2a4a2a 100%);
  border: 2px solid #4caf50;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
}

.success-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #4caf50;
}

.success-icon {
  width: 48px;
  height: 48px;
  background: #4caf50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.success-header h2 {
  font-size: 1.5rem;
  color: #4caf50;
  margin: 0;
}

.info-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.875rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.125rem;
  color: #fff;
  font-weight: 500;
}

.status-active {
  color: #4caf50;
}

.url-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #4caf50;
}

.url-section > label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.url-display {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.url-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #4caf50;
  border-radius: 6px;
  background: #1a2a1a;
  color: #4caf50;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
}

.url-input:focus {
  outline: none;
  border-color: #66bb6a;
  background: #1f2f1f;
}

.btn-copy {
  background: #4caf50;
  color: white;
  padding: 0.75rem 1.5rem;
  white-space: nowrap;
  transition: all 0.2s;
}

.btn-copy:hover {
  background: #66bb6a;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.error-message {
  color: #f44336;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #3a1a1a;
  border-radius: 6px;
  border-left: 4px solid #f44336;
}
</style>
