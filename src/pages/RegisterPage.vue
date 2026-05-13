<template>
  <q-page class="bf-register-page">
    <div class="bf-register-shell">
      <aside class="bf-register-left" aria-hidden="true">
        <div class="bf-left-overlay"></div>
        <div class="bf-left-content">
          <p class="bf-left-kicker">BEM-VINDO A</p>
          <h1 class="bf-left-title">
            BURGER
            <span>FACTORY</span>
          </h1>
          <div class="bf-left-line"></div>
          <p class="bf-left-text">
            Crie sua conta e aproveite
            uma experiencia completa:
          </p>
          <ul class="bf-left-list">
            <li>Acompanhe seus pedidos</li>
            <li>Salve seus favoritos</li>
            <li>Receba ofertas exclusivas</li>
          </ul>
        </div>
      </aside>

      <section class="bf-register-right">
        <div class="bf-register-panel">
          <img :src="logo" alt="Burger Factory" class="bf-register-logo" />

          <h2 class="bf-register-title">Criar sua conta</h2>
          <p class="bf-register-subtitle">E rapido e facil!</p>

          <q-form class="bf-register-form" @submit.prevent="handleRegister">
            <div class="bf-row-two">
              <div class="bf-field-block">
                <label class="bf-field-label" for="register-name">Nome completo</label>
                <div class="bf-native-field">
                  <q-icon name="person" class="bf-native-icon" />
                  <input
                    id="register-name"
                    v-model="name"
                    type="text"
                    autocomplete="name"
                    spellcheck="false"
                    class="bf-native-input"
                  />
                </div>
              </div>

              <div class="bf-field-block">
                <label class="bf-field-label" for="register-phone">Telefone</label>
                <div class="bf-native-field">
                  <q-icon name="call" class="bf-native-icon" />
                  <input
                    id="register-phone"
                    v-model="phone"
                    type="tel"
                    autocomplete="tel"
                    inputmode="numeric"
                    @input="handlePhoneInput"
                    class="bf-native-input"
                  />
                </div>
              </div>
            </div>

            <div class="bf-field-block">
              <label class="bf-field-label" for="register-email">E-mail</label>
              <div class="bf-native-field">
                <q-icon name="mail" class="bf-native-icon" />
                <input
                  id="register-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  spellcheck="false"
                  class="bf-native-input"
                />
              </div>
            </div>

            <div class="bf-field-block">
              <label class="bf-field-label" for="register-password">Senha</label>
              <div class="bf-native-field">
                <q-icon name="lock" class="bf-native-icon" />
                <input
                  id="register-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="new-password"
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
            <p class="bf-hint">Minimo de 6 caracteres</p>

            <div class="bf-field-block">
              <label class="bf-field-label" for="register-confirm-password">Confirmar senha</label>
              <div class="bf-native-field">
                <q-icon name="lock" class="bf-native-icon" />
                <input
                  id="register-confirm-password"
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  class="bf-native-input"
                />
                <button
                  type="button"
                  class="bf-native-toggle"
                  :aria-label="showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <q-icon :name="showConfirmPassword ? 'visibility_off' : 'visibility'" />
                </button>
              </div>
            </div>

            <q-checkbox
              v-model="acceptedTerms"
              color="deep-orange-8"
              class="bf-terms"
            >
              <span>
                Eu concordo com os
                <button type="button" class="bf-link-btn" @click="showTermsInfo">Termos de uso</button>
                e
                <button type="button" class="bf-link-btn" @click="showPrivacyInfo">Politica de privacidade</button>
              </span>
            </q-checkbox>

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
              label="Criar conta"
              :loading="loading"
            />
          </q-form>

          <div class="bf-divider">
            <span>ou</span>
          </div>

          <button type="button" class="bf-social-btn" @click="handleSocial('Google')">
            <span class="bf-social-icon google">G</span>
            <span>Cadastrar com Google</span>
          </button>

          <button type="button" class="bf-social-btn" @click="handleSocial('Facebook')">
            <span class="bf-social-icon facebook">f</span>
            <span>Cadastrar com Facebook</span>
          </button>

          <div class="bf-login-wrap">
            <p>Ja tem uma conta?</p>
            <button type="button" class="bf-login-btn" @click="goLogin">
              Fazer login
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
const phone = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const acceptedTerms = ref(true)
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

function showTermsInfo() {
  infoMessage.value = 'Termos de uso em breve.'
}

function showPrivacyInfo() {
  infoMessage.value = 'Politica de privacidade em breve.'
}

function handleSocial(provider) {
  infoMessage.value = `Cadastro com ${provider} em breve.`
}

function goLogin() {
  router.push('/login')
}

function handlePhoneInput(event) {
  const digitsOnly = String(event?.target?.value || '')
    .replace(/\D/g, '')
    .slice(0, 11)

  if (digitsOnly.length <= 2) {
    phone.value = digitsOnly
    return
  }

  const ddd = digitsOnly.slice(0, 2)
  const rest = digitsOnly.slice(2)

  if (rest.length <= 4) {
    phone.value = `(${ddd}) ${rest}`
    return
  }

  if (rest.length <= 8) {
    phone.value = `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`
    return
  }

  phone.value = `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`
}

async function handleRegister() {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!name.value || !phone.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Preencha todos os campos obrigatorios.'
    return
  }

  if (!isValidEmail(email.value)) {
    errorMessage.value = providerMessage()
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'A senha precisa ter no minimo 6 caracteres.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'As senhas nao coincidem.'
    return
  }

  if (!acceptedTerms.value) {
    errorMessage.value = 'Voce precisa aceitar os termos para continuar.'
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value,
        fone: phone.value,
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
</script>

<style scoped>
.bf-register-page {
  min-height: 100vh;
  background: #fffdf8;
}

.bf-register-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(360px, 40%) 1fr;
}

.bf-register-left {
  position: relative;
  background-image:
    linear-gradient(180deg, rgba(0, 0, 0, 0.86) 0%, rgba(0, 0, 0, 0.72) 65%, rgba(0, 0, 0, 0.82) 100%),
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
  max-width: 350px;
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
  font-size: 1.2rem;
  line-height: 1.45;
}

.bf-left-list {
  list-style: none;
  padding: 0;
  margin: 14px 0 0;
  display: grid;
  gap: 8px;
}

.bf-left-list li {
  color: #f1ece6;
  font-size: 1.06rem;
  position: relative;
  padding-left: 30px;
}

.bf-left-list li::before {
  content: '\2713';
  position: absolute;
  left: 0;
  top: 0;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(243, 122, 30, 0.95);
  color: #ffffff;
  font-size: 0.85rem;
  line-height: 20px;
  text-align: center;
}

.bf-register-right {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 38px 36px 28px;
}

.bf-register-panel {
  width: min(100%, 690px);
}

.bf-register-logo {
  width: 188px;
  height: auto;
  display: block;
  margin: 0 auto 12px;
}

.bf-register-title {
  margin: 0;
  text-align: center;
  color: #2b1b13;
  font-size: clamp(2rem, 3vw, 2.7rem);
}

.bf-register-subtitle {
  margin: 8px 0 0;
  text-align: center;
  color: #74685e;
  font-size: 1.18rem;
}

.bf-register-form {
  margin-top: 20px;
}

.bf-row-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bf-field {
  margin-bottom: 0;
}

.bf-native-field {
  display: flex;
  align-items: center;
  min-height: 60px;
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
  margin-bottom: 12px;
}

.bf-field-label {
  display: inline-block;
  margin-bottom: 8px;
  color: #2b1b13;
  font-size: 1.02rem;
  font-weight: 600;
}

.bf-field :deep(.q-field__control) {
  min-height: 60px;
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

.bf-hint {
  margin: -4px 0 12px;
  color: #74685e;
  font-size: 0.96rem;
}

.bf-terms {
  margin-bottom: 12px;
  color: #5f5147;
}

.bf-link-btn {
  border: 0;
  background: transparent;
  color: #ef761f;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  padding: 0;
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
  margin: 22px 0 16px;
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

.bf-login-wrap {
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

.bf-login-wrap p {
  margin: 0;
  font-size: 1.05rem;
}

.bf-login-btn {
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
  margin: 30px 0 0;
  color: #72665d;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.98rem;
}

@media (max-width: 1180px) {
  .bf-register-shell {
    grid-template-columns: 1fr;
  }

  .bf-register-left {
    min-height: 320px;
    border-radius: 0;
  }

  .bf-left-content {
    left: 24px;
    top: 56px;
    max-width: 460px;
  }

  .bf-register-right {
    padding-top: 26px;
  }
}

@media (max-width: 740px) {
  .bf-register-right {
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

  .bf-row-two {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>


