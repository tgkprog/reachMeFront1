<template>
  <div class="login-container">
    <div class="login-card">
      <img src="/reachmeBanner.png" alt="ReachMe" class="banner-img" />
      <h1>ReachMe</h1>
      
      <div v-if="error" class="error">{{ error }}</div>
      
      <div v-if="!passwordMode" class="google-login">
        <div id="g_id_onload"
             :data-client_id="googleClientId"
             data-callback="handleGoogleCredential"
             data-auto_prompt="false">
        </div>
        <div class="g_id_signin"
             data-type="standard"
             data-size="large"
             data-theme="filled_blue"
             data-text="sign_in_with"
             data-shape="rectangular"
             data-logo_alignment="left">
        </div>
        
        <div class="divider">OR</div>
        
        <button @click="passwordMode = true" class="switch-btn">
          Sign in with Email
        </button>
      </div>
      
      <div v-else class="password-login">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          class="input"
          @keyup.enter="handlePasswordLogin"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="input"
          @keyup.enter="handlePasswordLogin"
        />
        
        <button @click="handlePasswordLogin" :disabled="loading" class="btn-primary">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
        
        <button @click="passwordMode = false" class="switch-btn">
          Back to Google Sign In
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import authService from '@/services/auth'
import config from '@/config'

const router = useRouter()

const passwordMode = ref(false)
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const googleClientId = config.oauth.google.clientId

// Load Google Sign-In script
onMounted(() => {
  if (!googleClientId) {
    error.value = 'Google Client ID not configured'
    passwordMode.value = true
    return
  }
  
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.async = true
  script.defer = true
  document.head.appendChild(script)
  
  // Setup global callback for Google
  ;(window as any).handleGoogleCredential = handleGoogleCredential
  
  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

async function handleGoogleCredential(response: any) {
  if (!authService.canAttemptLogin()) {
    error.value = 'Please wait 3 minutes before trying again'
    return
  }
  
  loading.value = true
  error.value = ''
  authService.recordLoginAttempt()
  
  try {
    await authService.googleLogin(response.credential)
    router.push('/controls')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Google login failed'
  } finally {
    loading.value = false
  }
}

async function handlePasswordLogin() {
  if (!email.value || !password.value) {
    error.value = 'Please enter email and password'
    return
  }
  
  if (!authService.canAttemptLogin()) {
    error.value = 'Please wait 3 minutes before trying again'
    return
  }
  
  loading.value = true
  error.value = ''
  authService.recordLoginAttempt()
  
  try {
    await authService.passwordLogin(email.value, password.value)
    router.push('/controls')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.login-card {
  background: #1f1f1f;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
}

.banner-img {
  width: 100%;
  max-height: 100px;
  object-fit: contain;
  margin-bottom: 1rem;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #fff;
  font-size: 2rem;
}

.error {
  background: #ff4444;
  color: white;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
}

.google-login,
.password-login {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.divider {
  text-align: center;
  color: #888;
  margin: 1rem 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #444;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.input {
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: #4a90e2;
}

.btn-primary {
  padding: 0.75rem;
  background: #4a90e2;
  color: white;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #357abd;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-btn {
  padding: 0.5rem;
  background: transparent;
  color: #4a90e2;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.switch-btn:hover {
  border-color: #4a90e2;
  background: rgba(74, 144, 226, 0.1);
}
</style>
