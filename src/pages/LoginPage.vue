<template>
  <q-page class="login-page flex flex-center">
    <div class="login-glow" aria-hidden="true"></div>

    <q-card class="login-card">
      <q-card-section class="text-center q-pb-sm">
        <img :src="logo" alt="Burger Factory" class="login-logo q-mb-sm" />
        <div class="text-overline text-weight-bold brand-overline">Burger Factory</div>
        <div class="login-title q-mt-xs">{{ isRegisterMode ? 'Criar conta' : 'Entrar' }}</div>
        <div class="login-subtitle q-mt-sm">
          {{
            isRegisterMode
              ? 'Preencha os dados para criar sua conta e continuar.'
              : 'Acesse sua conta para acompanhar pedidos ou continue sem cadastro.'
          }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-input v-if="isRegisterMode" v-model="name" label="Nome" outlined dense class="q-mb-md" />
        <q-input v-model="email" label="E-mail" outlined dense type="email" class="q-mb-md" />
        <q-input
          v-model="password"
          label="Senha"
          outlined
          dense
          :type="showPassword ? 'text' : 'password'"
          :class="isRegisterMode ? 'q-mb-md' : ''"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-input
          v-if="isRegisterMode"
          v-model="confirmPassword"
          label="Confirmar senha"
          outlined
          dense
          :type="showPassword ? 'text' : 'password'"
        />

        <q-banner v-if="errorMessage" inline-actions class="bg-red-1 text-red-9 q-mt-md rounded-borders">
          {{ errorMessage }}
        </q-banner>
      </q-card-section>

      <q-card-actions vertical class="q-pa-md q-pt-none">
        <q-btn
          :label="isRegisterMode ? 'Criar conta' : 'Entrar'"
          color="dark"
          unelevated
          no-caps
          :loading="loading"
          @click="isRegisterMode ? handleRegister() : handleLogin()"
        />
        <q-btn
          :label="isRegisterMode ? 'Ja tenho conta' : 'Nao tenho conta (Registrar-se)'"
          color="dark"
          flat
          no-caps
          :disable="loading"
          @click="toggleMode"
        />
        <q-btn
          v-if="!isRegisterMode"
          label="Entrar sem conta"
          color="orange-8"
          flat
          no-caps
          :disable="loading"
          @click="handleGuest"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logo from 'src/assets/logoburguerfactory.png'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()

const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'yahoo.com',
  'yahoo.com.br',
])

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const isRegisterMode = ref(false)

function isValidEmail(rawEmail) {
  if (!rawEmail || rawEmail.includes(' ')) return false

  const normalized = String(rawEmail).toLowerCase().trim()
  const formatOk = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)
  if (!formatOk) return false

  const domain = normalized.split('@')[1]
  return ALLOWED_EMAIL_DOMAINS.has(domain)
}

function providerMessage() {
  return 'Use um email de provedor permitido: gmail, outlook, hotmail, live, icloud ou yahoo.'
}

async function handleLogin() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Preencha e-mail e senha.'
    return
  }

  if (!isValidEmail(email.value)) {
    errorMessage.value = providerMessage()
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel entrar.'
      return
    }

    localStorage.setItem(
      'bf_session',
      JSON.stringify({
        mode: 'auth',
        token: data.token,
        user: data.user,
      })
    )

    router.push('/lanches')
  } catch {
    errorMessage.value = 'Erro de conexao com servidor.'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  errorMessage.value = ''

  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Preencha nome, e-mail, senha e confirmacao de senha.'
    return
  }

  if (!isValidEmail(email.value)) {
    errorMessage.value = providerMessage()
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas nao coincidem.'
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        email: email.value,
        password: password.value,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel criar conta.'
      return
    }

    localStorage.setItem(
      'bf_session',
      JSON.stringify({
        mode: 'auth',
        token: data.token,
        user: data.user,
      })
    )

    router.push('/lanches')
  } catch {
    errorMessage.value = 'Erro de conexao com servidor.'
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value
  errorMessage.value = ''
  confirmPassword.value = ''
}

function handleGuest() {
  localStorage.setItem(
    'bf_session',
    JSON.stringify({
      mode: 'guest',
      token: null,
      user: null,
    })
  )

  router.push('/lanches')
}
</script>
