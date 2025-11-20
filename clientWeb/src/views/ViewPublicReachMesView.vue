<template>
  <div class="view-public-reachme-container">
    <h1>View Public Reach Mes</h1>

    <div v-if="loading" class="loading">Loading...</div>

    <!-- Edit Form -->
    <div v-if="editingReachMe" class="edit-form-card">
      <h2>Edit Public Reach Me</h2>
      
      <div class="form-group">
        <label>URL Code:</label>
        <span class="readonly-value">{{ editingReachMe.urlCode }}</span>
      </div>

      <div class="form-group">
        <label>Full URL:</label>
        <span class="readonly-value">{{ editingReachMe.fullUrl }}</span>
      </div>

      <div class="form-group">
        <label for="isActive">Status:</label>
        <select v-model="editForm.isActive" id="isActive" class="form-control">
          <option :value="true">Active</option>
          <option :value="false">Inactive</option>
        </select>
      </div>

      <div class="form-group">
        <label for="deactivateAt">Deactivate At (optional):</label>
        <input
          type="datetime-local"
          id="deactivateAt"
          v-model="editForm.deactivateAt"
          class="form-control"
        />
        <button 
          v-if="editForm.deactivateAt" 
          @click="clearDeactivateAt" 
          class="btn-clear"
          type="button"
        >
          Clear
        </button>
      </div>

      <div class="form-group">
        <label>Created At:</label>
        <span class="readonly-value">{{ formatDate(editingReachMe.createdAt) }}</span>
      </div>

      <div class="form-actions">
        <button @click="saveEdit" class="btn-primary">Save Changes</button>
        <button @click="cancelEdit" class="btn-secondary">Cancel</button>
      </div>
    </div>

    <!-- List Table -->
    <table v-if="!loading && !editingReachMe && reachMes && reachMes.length > 0" class="reachme-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>URL Code</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="reachMe in reachMes" :key="reachMe.id">
          <td>{{ reachMe.id }}</td>
          <td>{{ reachMe.urlCode }}</td>
          <td>
            <span :class="reachMe.isActive ? 'status-active' : 'status-inactive'">
              {{ reachMe.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>
          <td>{{ formatDate(reachMe.createdAt) }}</td>
          <td class="actions">
            <button
              @click="startEdit(reachMe)"
              class="btn-icon"
              title="Edit"
            >
              ✏️
            </button>
            <button
              @click="copyUrl(reachMe.urlCode)"
              class="btn-icon"
              title="Copy URL"
            >
              📋
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="!loading && !editingReachMe && (!reachMes || reachMes.length === 0)" class="no-data">No Public Reach Mes found.</p>

    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <button v-if="!editingReachMe" @click="goBack" class="btn-secondary">Back</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/config/axios';
import config from '@/config';

const router = useRouter();
const reachMes = ref<any[]>([]);
const loading = ref(true);
const successMessage = ref('');
const errorMessage = ref('');
const editingReachMe = ref<any>(null);
const editForm = ref({
  isActive: true,
  deactivateAt: null as string | null
});

async function fetchReachMes() {
  try {
    console.log('Fetching public reach mes...');
    const response = await api.get('/public-reachme/list');
    console.log('API Response:', response);
    console.log('Response data:', response.data);
    
    if (response.status === 200 && response.data.success) {
      console.log('ReachMes from API:', response.data.urls);
      reachMes.value = response.data.urls || [];
      console.log('ReachMes ref value:', reachMes.value);
    } else {
      throw new Error(response.data.message || 'Failed to fetch Public Reach Mes');
    }
  } catch (error: any) {
    console.error('Fetch error:', error);
    errorMessage.value = error.message || 'An error occurred';
    reachMes.value = []; // Ensure it's always an array
  } finally {
    loading.value = false;
    console.log('Loading set to false, reachMes length:', reachMes.value?.length || 0);
  }
}

function startEdit(reachMe: any) {
  editingReachMe.value = reachMe;
  editForm.value = {
    isActive: reachMe.isActive,
    deactivateAt: reachMe.deactivateAt ? new Date(reachMe.deactivateAt).toISOString().slice(0, 16) : null
  };
  successMessage.value = '';
  errorMessage.value = '';
}

function cancelEdit() {
  editingReachMe.value = null;
  editForm.value = {
    isActive: true,
    deactivateAt: null
  };
  successMessage.value = '';
  errorMessage.value = '';
}

function clearDeactivateAt() {
  editForm.value.deactivateAt = null;
}

async function saveEdit() {
  if (!editingReachMe.value) return;
  
  try {
    const response = await api.patch('/public-reachme/edit', {
      id: editingReachMe.value.id,
      isActive: editForm.value.isActive,
      deactivateAt: editForm.value.deactivateAt || null
    });
    
    if (response.status === 200 && response.data.success) {
      successMessage.value = response.data.message || 'Public Reach Me updated successfully';
      errorMessage.value = '';
      editingReachMe.value = null;
      fetchReachMes(); // Refresh the list
    } else {
      throw new Error(response.data.message || 'Failed to update Public Reach Me');
    }
  } catch (error: any) {
    successMessage.value = '';
    errorMessage.value = error.message || 'An error occurred';
  }
}

async function copyUrl(urlCode: string) {
  const fullUrl = `${config.api.baseUrl}/r/${urlCode}/?mode=web`;
  try {
    await navigator.clipboard.writeText(fullUrl);
    successMessage.value = `URL copied to clipboard: ${fullUrl}`;
    errorMessage.value = '';
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (error) {
    errorMessage.value = 'Failed to copy URL to clipboard';
    successMessage.value = '';
  }
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString();
}

function goBack() {
  router.push('/reachme');
}

onMounted(() => {
  fetchReachMes();
});
</script>

<style scoped>
.view-public-reachme-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #fff;
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
  background: #1f1f1f;
  border-radius: 8px;
  overflow: hidden;
}

.reachme-table th,
.reachme-table td {
  border: 1px solid #333;
  padding: 0.75rem;
  text-align: left;
}

.reachme-table th {
  background-color: #2a2a2a;
  color: #fff;
  font-weight: 600;
}

.reachme-table td {
  color: #ccc;
}

.reachme-table tbody tr:hover {
  background-color: #2a2a2a;
}

.status-active {
  color: #4caf50;
  font-weight: 600;
}

.status-inactive {
  color: #f44336;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  padding: 0.4rem 0.6rem;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  background-color: #2a2a2a;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: #3a3a3a;
  border-color: #555;
}

.no-data {
  text-align: center;
  color: #888;
  font-size: 1.2rem;
  padding: 2rem;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-secondary {
  background-color: #444;
  color: white;
}

.btn-secondary:hover {
  background-color: #555;
}

.success-message {
  color: #4caf50;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #1a3a1a;
  border-radius: 4px;
  border-left: 4px solid #4caf50;
}

.error-message {
  color: #f44336;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #3a1a1a;
  border-radius: 4px;
  border-left: 4px solid #f44336;
}

.edit-form-card {
  background: #1f1f1f;
  border: 2px solid #4a90e2;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 1.5rem;
}

.edit-form-card h2 {
  color: #4a90e2;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #888;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.readonly-value {
  display: block;
  padding: 0.75rem;
  background: #2a2a2a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-family: 'Courier New', monospace;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  font-size: 1rem;
}

.form-control:focus {
  outline: none;
  border-color: #4a90e2;
}

.btn-clear {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-clear:hover {
  background: #d32f2f;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.form-actions .btn-primary,
.form-actions .btn-secondary {
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
}
</style>
