<template>
  <q-page class="bf-login-page">
    <div class="bf-login-shell">
      <aside class="bf-login-left" aria-hidden="true">
        <div class="bf-left-overlay"></div>
        <div class="bf-left-content">
          <p class="bf-left-kicker">BEM-VINDO A</p>
          <h1 class="bf-left-title">
            BURGER
            <span>FACTORY</span>
          </h1>
          <div class="bf-left-line"></div>
          <p class="bf-left-text">
            Faca login para acompanhar seus pedidos, salvar favoritos e muito mais.
          </p>
        </div>
      </aside>

      <section class="bf-login-right">
        <div class="bf-login-panel">
          <img :src="logo" alt="Burger Factory" class="bf-login-logo" />

          <h2 class="bf-login-title">Entrar na sua conta</h2>
          <p class="bf-login-subtitle">Que bom ter voce de volta!</p>

          <q-form class="bf-login-form" @submit.prevent="handleLogin">
            <div class="bf-field-block">
              <label class="bf-field-label" for="login-email">E-mail</label>
              <div class="bf-native-field">
                <q-icon name="mail" class="bf-native-icon" />
                <input
                  id="login-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  spellcheck="false"
                  class="bf-native-input"
                />
              </div>
            </div>

            <div class="bf-field-block">
              <label class="bf-field-label" for="login-password">Senha</label>
              <div class="bf-native-field">
                <q-icon name="lock" class="bf-native-icon" />
                <input
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  class="bf-native-input"
                />
                <button
                  type="button"
                  class="bf-native-toggle"
                  :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="showPassword = !showPassword"
                >
                  <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" />
                </button>
              </div>
            </div>

            <div class="bf-form-row">
              <q-checkbox v-model="rememberMe" label="Lembrar-me" color="deep-orange-8" />
              <button type="button" class="bf-link-btn" @click="handleForgotPassword">
                Esqueci minha senha
              </button>
            </div>

            <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 rounded-borders q-mb-sm">
              {{ errorMessage }}
            </q-banner>

            <q-banner v-if="infoMessage" class="bg-orange-1 text-orange-9 rounded-borders q-mb-sm">
              {{ infoMessage }}
            </q-banner>

            <q-btn
              type="submit"
              no-caps
              unelevated
              class="bf-submit-btn"
              label="Entrar"
              :loading="loading"
            />
          </q-form>

          <div class="bf-divider">
            <span>ou</span>
          </div>

          <button type="button" class="bf-social-btn" @click="handleSocial('Google')">
            <span class="bf-social-icon google">G</span>
            <span>Continuar com Google</span>
          </button>

          <button type="button" class="bf-social-btn" @click="handleSocial('Facebook')">
            <span class="bf-social-icon facebook">f</span>
            <span>Continuar com Facebook</span>
          </button>

          <div class="bf-create-wrap">
            <p>Ainda nao tem uma conta?</p>
            <button type="button" class="bf-create-btn" @click="handleCreateAccount">
              Criar conta
              <q-icon name="arrow_forward" size="18px" />
            </button>
          </div>

          <p class="bf-safe-note">
            <q-icon name="verified_user" size="18px" />
            Seus dados estao protegidos com a gente.
          </p>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from 'src/assets/logoburguerfactory.png'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const route = useRoute()
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

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

function isValidEmail(rawEmail) {
  if (!rawEmail || rawEmail.includes(' ')) return false

  const normalized = String(rawEmail).toLowerCase().trim()
  const formatOk = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)
  if (!formatOk) return false

  const domain = normalized.split('@')[1]
  return ALLOWED_EMAIL_DOMAINS.has(domain)
}

function providerMessage() {
  return 'Use um email valido: gmail, outlook, hotmail, live, icloud ou yahoo.'
}

function handleForgotPassword() {
  infoMessage.value = 'Recuperacao de senha em breve.'
}

function handleSocial(provider) {
  infoMessage.value = `Login com ${provider} em breve.`
}

function handleCreateAccount() {
  infoMessage.value = ''
  router.push('/register')
}

async function handleLogin() {
  errorMessage.value = ''
  infoMessage.value = ''

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
    const guestSessionId = localStorage.getItem('bf_guest_session_id')

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        ...(guestSessionId ? { session_id: guestSessionId } : {}),
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
      }),
    )

    if (rememberMe.value) {
      localStorage.setItem('bf_remember_email', email.value)
    } else {
      localStorage.removeItem('bf_remember_email')
    }

    const requestedRedirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const userRole = String(data?.user?.role || '').toLowerCase()

    if (requestedRedirect) {
      router.push(requestedRedirect)
      return
    }

    if (userRole === 'admin') {
      router.push('/admin/pedidos')
      return
    }

    router.push('/lanches')
  } catch {
    errorMessage.value = 'Erro de conexao com servidor.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const rememberedEmail = localStorage.getItem('bf_remember_email')
  if (rememberedEmail) {
    email.value = rememberedEmail
    rememberMe.value = true
  }
})
</script>

<style scoped>
.bf-login-page {
  min-height: 100vh;
  background: #fffdf8;
}

.bf-login-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 40%) 1fr;
}

.bf-login-left {
  position: relative;
  background-image:
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.86) 0%,
      rgba(0, 0, 0, 0.72) 65%,
      rgba(0, 0, 0, 0.82) 100%
    ),
    url('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1100&q=80');
  background-size: cover;
  background-position: center;
  border-top-right-radius: 46px;
  border-bottom-right-radius: 46px;
  overflow: hidden;
}

.bf-left-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 15% 30%, rgba(244, 117, 27, 0.16) 0%, rgba(0, 0, 0, 0) 42%);
}

.bf-left-content {
  position: absolute;
  left: 72px;
  top: 190px;
  z-index: 1;
  max-width: 340px;
}

.bf-left-kicker {
  margin: 0;
  color: #f28b2b;
  letter-spacing: 0.12em;
  font-size: 1.1rem;
  font-weight: 700;
}

.bf-left-title {
  margin: 18px 0 0;
  color: #ffffff;
  font-size: clamp(3.1rem, 5vw, 5.2rem);
  line-height: 0.95;
  font-weight: 800;
}

.bf-left-title span {
  display: block;
  color: #f37a1e;
}

.bf-left-line {
  width: 78px;
  height: 3px;
  border-radius: 999px;
  background: #f37a1e;
  margin: 24px 0;
}

.bf-left-text {
  margin: 0;
  color: #f1ece6;
  font-size: 1.24rem;
  line-height: 1.45;
}

.bf-login-right {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 54px 36px 28px;
}

.bf-login-panel {
  width: min(100%, 660px);
}

.bf-login-logo {
  width: 188px;
  height: auto;
  display: block;
  margin: 0 auto 16px;
}

.bf-login-title {
  margin: 0;
  text-align: center;
  color: #2b1b13;
  font-size: clamp(2.05rem, 3vw, 2.7rem);
  line-height: 1.1;
}

.bf-login-subtitle {
  margin: 8px 0 0;
  text-align: center;
  color: #74685e;
  font-size: 1.18rem;
}

.bf-login-form {
  margin-top: 24px;
}

.bf-field {
  margin-bottom: 0;
}

.bf-native-field {
  display: flex;
  align-items: center;
  min-height: 62px;
  border: 1px solid #d8c9b8;
  border-radius: 12px;
  background: #ffffff;
  padding: 0 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.bf-native-field:focus-within {
  border-color: #d6461c;
  box-shadow: 0 0 0 1px #d6461c inset;
}

.bf-native-icon {
  color: #7d746d;
  font-size: 20px;
  margin-right: 8px;
}

.bf-native-input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #2b1b13;
  font-size: 1rem;
  line-height: 1.2;
}

.bf-native-toggle {
  border: 0;
  background: transparent;
  color: #7d746d;
  padding: 0;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.bf-field-block {
  margin-bottom: 16px;
}

.bf-field-label {
  display: inline-block;
  margin-bottom: 8px;
  color: #2b1b13;
  font-size: 1.02rem;
  font-weight: 600;
}

.bf-field :deep(.q-field__control) {
  min-height: 62px;
  border-radius: 12px;
  box-shadow: none !important;
}

.bf-field :deep(.q-field__label) {
  display: none !important;
}

.bf-field :deep(.q-field__control-container) {
  padding-top: 0 !important;
}

.bf-field :deep(.q-field__native),
.bf-field :deep(.q-field__input) {
  padding-top: 0 !important;
  align-self: center;
}

.bf-field :deep(.q-field__shadow) {
  display: none !important;
}

.bf-form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0 16px;
}

.bf-link-btn {
  border: 0;
  background: transparent;
  color: #ef761f;
  font-weight: 700;
  font-size: 0.98rem;
  cursor: pointer;
}

.bf-submit-btn {
  width: 100%;
  height: 62px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f07a1f 0%, #f46900 100%);
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 700;
}

.bf-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0 18px;
  color: #857a71;
}

.bf-divider::before,
.bf-divider::after {
  content: '';
  height: 1px;
  flex: 1;
  background: #e6d9cb;
}

.bf-divider span {
  font-weight: 600;
}

.bf-social-btn {
  width: 100%;
  min-height: 58px;
  border: 1px solid #eadccd;
  border-radius: 12px;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1.06rem;
  color: #2e2018;
  cursor: pointer;
}

.bf-social-btn + .bf-social-btn {
  margin-top: 12px;
}

.bf-social-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.05rem;
}

.bf-social-icon.google {
  color: #db4437;
}

.bf-social-icon.facebook {
  color: #1877f2;
}

.bf-create-wrap {
  margin-top: 28px;
  border: 1px solid #f0e2d3;
  border-radius: 14px;
  min-height: 118px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #4f3e31;
}

.bf-create-wrap p {
  margin: 0;
  font-size: 1.05rem;
}

.bf-create-btn {
  border: 0;
  background: transparent;
  color: #ef761f;
  font-weight: 700;
  font-size: 1.12rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.bf-safe-note {
  margin: 32px 0 0;
  color: #72665d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.98rem;
}

@media (max-width: 1180px) {
  .bf-login-shell {
    grid-template-columns: 1fr;
  }

  .bf-login-left {
    min-height: 320px;
    border-radius: 0;
  }

  .bf-left-content {
    left: 24px;
    top: 56px;
    max-width: 430px;
  }

  .bf-login-right {
    padding-top: 26px;
  }
}

@media (max-width: 740px) {
  .bf-login-right {
    padding: 22px 12px 28px;
  }

  .bf-left-content {
    left: 16px;
    top: 34px;
  }

  .bf-left-title {
    font-size: clamp(2.3rem, 10vw, 3.2rem);
  }

  .bf-left-text {
    font-size: 1.04rem;
  }

  .bf-form-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
