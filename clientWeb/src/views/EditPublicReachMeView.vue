<template>
  <div class="edit-public-reachme-container">
    <h1>Edit Public Reach Mes</h1>

    <div v-if="loading" class="loading">Loading...</div>

    <table v-if="!loading && reachMes.length > 0" class="reachme-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>URL Code</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="reachMe in reachMes" :key="reachMe.id">
          <td>{{ reachMe.id }}</td>
          <td>{{ reachMe.url_code }}</td>
          <td>{{ reachMe.is_active ? 'Active' : 'Inactive' }}</td>
          <td>
            <button
              v-if="!reachMe.is_active"
              @click="editReachMe(reachMe.id, true)"
              class="btn-primary"
            >
              Activate
            </button>
            <button
              v-if="reachMe.is_active"
              @click="editReachMe(reachMe.id, false)"
              class="btn-secondary"
            >
              Deactivate
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="!loading && reachMes.length === 0" class="no-data">No Public Reach Mes found.</p>

    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <button @click="goBack" class="btn-secondary">Back</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/config/axios';

const router = useRouter();
const reachMes = ref([]);
const loading = ref(true);
const successMessage = ref('');
const errorMessage = ref('');

async function fetchReachMes() {
  try {
    const response = await api.get('/public-reachme/list');
    if (response.status === 200 && response.data.success) {
      reachMes.value = response.data.reachMes;
    } else {
      throw new Error(response.data.message || 'Failed to fetch Public Reach Mes');
    }
  } catch (error) {
    errorMessage.value = error.message || 'An error occurred';
  } finally {
    loading.value = false;
  }
}

async function editReachMe(id, isActive) {
  try {
    const response = await api.patch('/public-reachme/edit', { id, isActive });
    if (response.status === 200 && response.data.success) {
      successMessage.value = response.data.message;
      errorMessage.value = '';
      fetchReachMes(); // Refresh the list
    } else {
      throw new Error(response.data.message || 'Failed to update Public Reach Me');
    }
  } catch (error) {
    successMessage.value = '';
    errorMessage.value = error.message || 'An error occurred';
  }
}

function goBack() {
  router.back();
}

onMounted(() => {
  fetchReachMes();
});
</script>

<style scoped>
.edit-public-reachme-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.loading {
  text-align: center;
  font-size: 1.2rem;
  color: #888;
}

.reachme-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.reachme-table th,
.reachme-table td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
}

.reachme-table th {
  background-color: #f4f4f4;
}

.no-data {
  text-align: center;
  color: #888;
  font-size: 1.2rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #4a90e2;
  color: white;
}

.btn-secondary {
  background-color: #444;
  color: white;
}

.success-message {
  color: green;
  margin-top: 1rem;
}

.error-message {
  color: red;
  margin-top: 1rem;
}
</style>