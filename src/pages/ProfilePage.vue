<template>
  <q-page class="bf-profile-page">
    <div class="bf-profile-shell">
      <input
        ref="avatarFileInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="bf-hidden-file-input"
        @change="handleAvatarSelected"
      />

      <q-banner v-if="errorMessage" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
        {{ errorMessage }}
      </q-banner>

      <q-banner v-if="successMessage" class="bg-green-1 text-green-9 q-mb-md rounded-borders">
        {{ successMessage }}
      </q-banner>

      <q-banner v-if="infoMessage" class="bg-orange-1 text-orange-9 q-mb-md rounded-borders">
        {{ infoMessage }}
      </q-banner>

      <div class="bf-profile-grid">
        <aside class="bf-profile-aside">
          <div class="bf-side-menu-card">
            <button
              v-for="item in sideItems"
              :key="item.key"
              type="button"
              class="bf-side-menu-item"
              :class="{ 'is-active': item.key === 'profile' }"
              @click="handleSideItemClick(item)"
            >
              <q-icon :name="item.icon" size="22px" />
              <span>{{ item.label }}</span>
            </button>

            <div class="bf-side-divider"></div>

            <button type="button" class="bf-side-menu-item" @click="logout">
              <q-icon name="logout" size="22px" />
              <span>Sair</span>
            </button>
          </div>

          <article class="bf-side-promo">
            <h3>Fome de novidade?</h3>
            <p>Experimente nossos combos especiais!</p>
            <div class="bf-side-promo-image" aria-hidden="true"></div>
            <button type="button" class="bf-side-promo-btn" @click="goMenu">Ver cardapio</button>
          </article>
        </aside>

        <section class="bf-profile-main">
          <header class="bf-profile-header">
            <h1>Meu perfil</h1>
            <p>Gerencie suas informacoes pessoais e de conta.</p>
          </header>

          <article class="bf-profile-summary">
            <div class="bf-avatar-wrap">
              <div class="bf-avatar">
                <img
                  v-if="avatarImageUrl"
                  :src="avatarImageUrl"
                  alt="Foto de perfil"
                  class="bf-avatar-image"
                />
                <q-icon v-else name="person_outline" size="74px" />
              </div>
              <button
                type="button"
                class="bf-avatar-action"
                :disabled="uploadingAvatar"
                @click="editPhoto"
              >
                <q-icon name="photo_camera" size="18px" />
              </button>
            </div>

            <div class="bf-user-meta">
              <h2>{{ personalForm.name || 'Seu perfil' }}</h2>
              <p>
                <q-icon name="mail_outline" size="18px" />
                <span>{{ personalForm.email || '-' }}</span>
              </p>
              <p>
                <q-icon name="call" size="18px" />
                <span>{{ formatPhoneForDisplay(personalForm.phone) || '-' }}</span>
              </p>
              <p>
                <q-icon name="event" size="18px" />
                <span>Membro desde {{ memberSinceLabel }}</span>
              </p>
            </div>

            <q-btn
              outline
              no-caps
              color="deep-orange-8"
              class="bf-edit-photo-btn"
              label="Editar foto"
              :loading="uploadingAvatar"
              :disable="uploadingAvatar"
              @click="editPhoto"
            />
          </article>

          <section class="bf-section" id="profile-personal">
            <h2>Informacoes pessoais</h2>
            <article class="bf-form-card">
              <div class="bf-field-group">
                <label>Nome completo</label>
                <div class="bf-native-field">
                  <input
                    v-model="personalForm.name"
                    type="text"
                    autocomplete="name"
                    spellcheck="false"
                    class="bf-native-input"
                  />
                </div>
              </div>

              <div class="bf-two-cols">
                <div class="bf-field-group">
                  <label>E-mail</label>
                  <div class="bf-native-field">
                    <input
                      v-model="personalForm.email"
                      type="email"
                      autocomplete="email"
                      spellcheck="false"
                      class="bf-native-input"
                    />
                  </div>
                </div>

                <div class="bf-field-group">
                  <label>Telefone</label>
                  <div class="bf-native-field">
                    <input
                      :value="personalForm.phone"
                      type="tel"
                      autocomplete="tel"
                      inputmode="numeric"
                      maxlength="15"
                      class="bf-native-input"
                      @input="updatePhone($event?.target?.value || '')"
                    />
                  </div>
                </div>
              </div>

              <div class="bf-field-group">
                <label>Data de nascimento</label>
                <div class="bf-native-field">
                  <q-icon name="event" class="bf-native-icon" />
                  <input
                    v-model="personalForm.birth_date"
                    type="date"
                    class="bf-native-input bf-native-input-date"
                  />
                </div>
              </div>

              <div class="bf-field-group">
                <label>Genero</label>
                <div class="bf-native-field">
                  <select v-model="personalForm.gender" class="bf-native-select">
                    <option value="">Selecione</option>
                    <option v-for="option in genderOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="bf-form-actions">
                <q-btn
                  no-caps
                  unelevated
                  class="bf-primary-btn"
                  label="Salvar alteracoes"
                  :loading="savingProfile"
                  :disable="loadingProfile"
                  @click="saveProfile"
                />
              </div>
            </article>
          </section>

          <section class="bf-section" id="profile-addresses">
            <h2>Enderecos</h2>
            <article class="bf-form-card">
              <div v-if="addresses.length === 0" class="bf-address-empty">
                Nenhum endereco cadastrado ainda.
              </div>

              <div v-else class="bf-address-list">
                <article
                  v-for="address in addresses"
                  :key="address.id"
                  class="bf-address-item"
                  :class="{ 'is-default': address.is_default }"
                >
                  <div class="bf-address-item-head">
                    <strong>{{ address.label || 'Endereco' }}</strong>
                    <span v-if="address.is_default" class="bf-address-default-tag">Padrao</span>
                  </div>
                  <p>
                    {{ address.street }}, {{ address.address_number }}
                    <span v-if="address.complement"> - {{ address.complement }}</span>
                  </p>
                  <p>{{ address.district || 'Sem bairro' }} - {{ address.city }}/{{ address.state }}</p>
                  <p>CEP {{ formatCepForDisplay(address.cep) }}</p>

                  <div class="bf-address-actions">
                    <q-btn
                      flat
                      no-caps
                      color="deep-orange-8"
                      label="Editar"
                      @click="startEditAddress(address)"
                    />
                    <q-btn
                      flat
                      no-caps
                      color="positive"
                      :disable="address.is_default || settingDefaultAddressId === address.id"
                      :loading="settingDefaultAddressId === address.id"
                      label="Definir padrao"
                      @click="setAddressAsDefault(address.id)"
                    />
                    <q-btn
                      flat
                      no-caps
                      color="negative"
                      :loading="removingAddressId === address.id"
                      label="Remover"
                      @click="removeAddress(address.id)"
                    />
                  </div>
                </article>
              </div>

              <div class="bf-address-form-title">
                {{ editingAddressId ? 'Editar endereco' : 'Adicionar novo endereco' }}
              </div>

              <div class="bf-two-cols">
                <div class="bf-field-group">
                  <label>Identificacao</label>
                  <div class="bf-native-field">
                    <input
                      v-model="addressForm.label"
                      type="text"
                      placeholder="Ex.: Casa, Trabalho"
                      class="bf-native-input"
                    />
                  </div>
                </div>

                <div class="bf-field-group">
                  <label>CEP</label>
                  <div class="bf-native-field">
                    <input
                      :value="addressForm.cep"
                      type="text"
                      inputmode="numeric"
                      maxlength="9"
                      placeholder="00000-000"
                      class="bf-native-input"
                      @input="updateAddressCep($event?.target?.value || '')"
                    />
                  </div>
                </div>
              </div>

              <div class="bf-two-cols">
                <div class="bf-field-group">
                  <label>Rua</label>
                  <div class="bf-native-field">
                    <input v-model="addressForm.street" type="text" class="bf-native-input" />
                  </div>
                </div>

                <div class="bf-field-group">
                  <label>Numero</label>
                  <div class="bf-native-field">
                    <input v-model="addressForm.address_number" type="text" class="bf-native-input" />
                  </div>
                </div>
              </div>

              <div class="bf-two-cols">
                <div class="bf-field-group">
                  <label>Complemento</label>
                  <div class="bf-native-field">
                    <input v-model="addressForm.complement" type="text" class="bf-native-input" />
                  </div>
                </div>

                <div class="bf-field-group">
                  <label>Bairro</label>
                  <div class="bf-native-field">
                    <input v-model="addressForm.district" type="text" class="bf-native-input" />
                  </div>
                </div>
              </div>

              <div class="bf-two-cols">
                <div class="bf-field-group">
                  <label>Cidade</label>
                  <div class="bf-native-field">
                    <input v-model="addressForm.city" type="text" class="bf-native-input" />
                  </div>
                </div>

                <div class="bf-field-group">
                  <label>Estado</label>
                  <div class="bf-native-field">
                    <input v-model="addressForm.state" type="text" maxlength="40" class="bf-native-input" />
                  </div>
                </div>
              </div>

              <label class="bf-address-default-check">
                <input v-model="addressForm.is_default" type="checkbox" />
                Definir como endereco padrao
              </label>

              <div class="bf-form-actions bf-address-form-actions">
                <q-btn
                  v-if="editingAddressId"
                  flat
                  no-caps
                  color="grey-8"
                  label="Cancelar"
                  @click="resetAddressForm"
                />
                <q-btn
                  no-caps
                  unelevated
                  class="bf-primary-btn"
                  :loading="savingAddress"
                  :disable="loadingAddresses"
                  :label="editingAddressId ? 'Salvar endereco' : 'Adicionar endereco'"
                  @click="saveAddress"
                />
              </div>
            </article>
          </section>

          <section class="bf-section">
            <h2>Alterar senha</h2>
            <article class="bf-form-card">
              <div class="bf-field-group">
                <label>Senha atual</label>
                <div class="bf-native-field">
                  <input
                    v-model="passwordForm.current_password"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    class="bf-native-input"
                  />
                  <button
                    type="button"
                    class="bf-native-toggle"
                    :aria-label="showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    <q-icon :name="showCurrentPassword ? 'visibility_off' : 'visibility'" />
                  </button>
                </div>
              </div>

              <div class="bf-field-group">
                <label>Nova senha</label>
                <div class="bf-native-field">
                  <input
                    v-model="passwordForm.new_password"
                    :type="showNewPassword ? 'text' : 'password'"
                    autocomplete="new-password"
                    class="bf-native-input"
                  />
                  <button
                    type="button"
                    class="bf-native-toggle"
                    :aria-label="showNewPassword ? 'Ocultar senha' : 'Mostrar senha'"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <q-icon :name="showNewPassword ? 'visibility_off' : 'visibility'" />
                  </button>
                </div>
              </div>

              <div class="bf-field-group">
                <label>Confirmar nova senha</label>
                <div class="bf-native-field">
                  <input
                    v-model="passwordForm.confirm_new_password"
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

              <div class="bf-form-actions">
                <q-btn
                  no-caps
                  outline
                  color="deep-orange-8"
                  class="bf-outline-btn"
                  label="Alterar senha"
                  :loading="changingPassword"
                  :disable="loadingProfile"
                  @click="changePassword"
                />
              </div>
            </article>
          </section>

          <section class="bf-section">
            <h2>Excluir conta</h2>
            <article class="bf-delete-card">
              <div class="bf-delete-info">
                <span class="bf-delete-icon">
                  <q-icon name="delete_outline" size="28px" />
                </span>
                <div>
                  <strong>Excluir minha conta</strong>
                  <p>Esta acao nao pode ser desfeita. Todos os seus dados serao removidos.</p>
                </div>
              </div>

              <q-btn
                no-caps
                outline
                color="negative"
                class="bf-delete-btn"
                label="Excluir conta"
                :loading="deletingAccount"
                :disable="loadingProfile"
                @click="deleteAccount"
              />
            </article>
          </section>

          <footer class="bf-help-strip">
            <q-icon name="shield" size="20px" />
            <span>Precisa de ajuda? Entre em contato com nosso suporte.</span>
          </footer>
        </section>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const router = useRouter()
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'yahoo.com',
  'yahoo.com.br',
])

const loadingProfile = ref(false)
const savingProfile = ref(false)
const changingPassword = ref(false)
const deletingAccount = ref(false)
const uploadingAvatar = ref(false)
const loadingAddresses = ref(false)
const savingAddress = ref(false)
const removingAddressId = ref(null)
const settingDefaultAddressId = ref(null)
const editingAddressId = ref(null)

const errorMessage = ref('')
const successMessage = ref('')
const infoMessage = ref('')

const profileUser = ref(null)
const avatarFileInput = ref(null)
const avatarPreviewUrl = ref('')
const addresses = ref([])
const personalForm = ref({
  name: '',
  email: '',
  phone: '',
  birth_date: '',
  gender: '',
})

const addressForm = ref({
  label: '',
  cep: '',
  street: '',
  address_number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
  is_default: false,
})

const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_new_password: '',
})

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const sideItems = [
  { key: 'profile', label: 'Meu perfil', icon: 'person_outline' },
  { key: 'orders', label: 'Meus pedidos', icon: 'assignment' },
  { key: 'address', label: 'Enderecos', icon: 'place' },
  { key: 'payment', label: 'Formas de pagamento', icon: 'credit_card' },
  { key: 'favorites', label: 'Favoritos', icon: 'favorite_border' },
  { key: 'notifications', label: 'Notificacoes', icon: 'notifications_none' },
  { key: 'security', label: 'Seguranca', icon: 'shield' },
]

const genderOptions = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Prefiro nao informar', value: 'nao_informar' },
  { label: 'Outro', value: 'outro' },
]

const memberSinceLabel = computed(() => {
  const value = profileUser.value?.created_at
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
})

const avatarImageUrl = computed(() => {
  if (avatarPreviewUrl.value) return avatarPreviewUrl.value
  return resolveAvatarUrl(profileUser.value?.avatar_url)
})

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
  infoMessage.value = ''
}

function getSession() {
  return JSON.parse(localStorage.getItem('bf_session') || '{}')
}

function getAuthHeaders() {
  const session = getSession()
  const token = session.token || null
  const isAuth = session.mode === 'auth' && Boolean(token)

  if (!isAuth) return null
  return { Authorization: `Bearer ${token}` }
}

function syncSessionUser(user) {
  const session = getSession()
  localStorage.setItem(
    'bf_session',
    JSON.stringify({
      ...session,
      user: {
        ...(session.user || {}),
        ...user,
      },
    })
  )

  window.dispatchEvent(new Event('bf-cart-updated'))
}

function isValidEmail(rawEmail) {
  if (!rawEmail || rawEmail.includes(' ')) return false

  const normalized = String(rawEmail).toLowerCase().trim()
  const formatOk = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)
  if (!formatOk) return false

  const domain = normalized.split('@')[1]
  return ALLOWED_EMAIL_DOMAINS.has(domain)
}

function formatPhoneForDisplay(rawValue) {
  const digits = String(rawValue || '')
    .replace(/\D/g, '')
    .slice(0, 11)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return digits

  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)

  if (rest.length <= 4) return `(${ddd}) ${rest}`
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`
}

function updatePhone(value) {
  personalForm.value.phone = formatPhoneForDisplay(value)
}

function normalizeCepDigits(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .slice(0, 8)
}

function formatCepForDisplay(value) {
  const digits = normalizeCepDigits(value)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

function updateAddressCep(value) {
  addressForm.value.cep = formatCepForDisplay(value)
}

function createEmptyAddressForm() {
  return {
    label: '',
    cep: '',
    street: '',
    address_number: '',
    complement: '',
    district: '',
    city: '',
    state: '',
    is_default: false,
  }
}

function resetAddressForm() {
  editingAddressId.value = null
  addressForm.value = createEmptyAddressForm()
}

function startEditAddress(address) {
  editingAddressId.value = address.id
  addressForm.value = {
    label: address.label || '',
    cep: formatCepForDisplay(address.cep || ''),
    street: address.street || '',
    address_number: address.address_number || '',
    complement: address.complement || '',
    district: address.district || '',
    city: address.city || '',
    state: address.state || '',
    is_default: Boolean(address.is_default),
  }
}

function normalizeBirthDateForInput(rawValue) {
  if (!rawValue) return ''

  const raw = String(rawValue).trim()
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/)
  if (match) return match[1]

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function resolveAvatarUrl(rawValue) {
  const value = String(rawValue || '').trim()
  if (!value) return ''

  if (value.startsWith('data:')) return value
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  if (value.startsWith('/uploads/')) return `${API_BASE_URL}${value}`
  if (value.startsWith('/')) return value

  return `${API_BASE_URL}/${value}`
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'))
    reader.readAsDataURL(file)
  })
}

function goMenu() {
  router.push('/lanches')
}

function editPhoto() {
  clearMessages()
  avatarFileInput.value?.click()
}

async function handleAvatarSelected(event) {
  const file = event?.target?.files?.[0]
  event.target.value = ''
  if (!file) return

  clearMessages()

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    errorMessage.value = 'Formato invalido. Use JPG, PNG ou WEBP.'
    return
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    errorMessage.value = 'A imagem deve ter no maximo 5MB.'
    return
  }

  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  uploadingAvatar.value = true

  try {
    const avatarBase64 = await fileToDataUrl(file)
    avatarPreviewUrl.value = avatarBase64

    const response = await fetch(`${API_BASE_URL}/api/profile/avatar`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_base64: avatarBase64,
      }),
    })

    const data = await response.json()
    if (!response.ok || !data?.user) {
      avatarPreviewUrl.value = ''

      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel atualizar foto de perfil.'
      return
    }

    profileUser.value = data.user
    syncSessionUser(data.user)
    avatarPreviewUrl.value = ''
    successMessage.value = data.message || 'Foto de perfil atualizada com sucesso.'
  } catch {
    avatarPreviewUrl.value = ''
    errorMessage.value = 'Erro de conexao ao atualizar foto de perfil.'
  } finally {
    uploadingAvatar.value = false
  }
}

async function loadAddresses() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  loadingAddresses.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/addresses`, { headers })
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel carregar enderecos.'
      return
    }

    addresses.value = data.items || []
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar enderecos.'
  } finally {
    loadingAddresses.value = false
  }
}

async function saveAddress() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  const normalizedCep = normalizeCepDigits(addressForm.value.cep)
  if (!normalizedCep || normalizedCep.length < 8) {
    errorMessage.value = 'Informe um CEP valido com 8 digitos.'
    return
  }

  if (!addressForm.value.street || !addressForm.value.address_number || !addressForm.value.city || !addressForm.value.state) {
    errorMessage.value = 'Preencha rua, numero, cidade e estado.'
    return
  }

  savingAddress.value = true
  clearMessages()

  const payload = {
    label: addressForm.value.label || null,
    cep: normalizedCep,
    street: addressForm.value.street,
    address_number: addressForm.value.address_number,
    complement: addressForm.value.complement || null,
    district: addressForm.value.district || null,
    city: addressForm.value.city,
    state: addressForm.value.state,
    is_default: Boolean(addressForm.value.is_default),
  }

  try {
    const isEditing = Boolean(editingAddressId.value)
    const url = isEditing
      ? `${API_BASE_URL}/api/profile/addresses/${editingAddressId.value}`
      : `${API_BASE_URL}/api/profile/addresses`
    const method = isEditing ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (!response.ok) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel salvar endereco.'
      return
    }

    successMessage.value = data.message || 'Endereco salvo com sucesso.'
    resetAddressForm()
    await loadAddresses()
  } catch {
    errorMessage.value = 'Erro de conexao ao salvar endereco.'
  } finally {
    savingAddress.value = false
  }
}

async function setAddressAsDefault(addressId) {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  settingDefaultAddressId.value = addressId
  clearMessages()

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/addresses/${addressId}/default`, {
      method: 'PUT',
      headers,
    })
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel definir endereco padrao.'
      return
    }

    successMessage.value = data.message || 'Endereco padrao atualizado.'
    await loadAddresses()
  } catch {
    errorMessage.value = 'Erro de conexao ao definir endereco padrao.'
  } finally {
    settingDefaultAddressId.value = null
  }
}

async function removeAddress(addressId) {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  const confirmed = window.confirm('Deseja remover este endereco?')
  if (!confirmed) return

  removingAddressId.value = addressId
  clearMessages()

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/addresses/${addressId}`, {
      method: 'DELETE',
      headers,
    })
    const data = await response.json()

    if (!response.ok) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel remover endereco.'
      return
    }

    if (editingAddressId.value === addressId) {
      resetAddressForm()
    }

    successMessage.value = data.message || 'Endereco removido com sucesso.'
    await loadAddresses()
  } catch {
    errorMessage.value = 'Erro de conexao ao remover endereco.'
  } finally {
    removingAddressId.value = null
  }
}

function handleSideItemClick(item) {
  if (item.key === 'profile') return

  if (item.key === 'orders') {
    router.push('/pedidos')
    return
  }

  if (item.key === 'address') {
    document.getElementById('profile-addresses')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }

  clearMessages()
  infoMessage.value = `A secao "${item.label}" sera liberada em breve.`
}

function logout() {
  localStorage.removeItem('bf_session')
  window.dispatchEvent(new Event('bf-cart-updated'))
  router.push('/login')
}

async function loadProfile() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  loadingProfile.value = true
  clearMessages()

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, { headers })
    const data = await response.json()

    if (!response.ok || !data?.user) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel carregar perfil.'
      return
    }

    profileUser.value = data.user
    avatarPreviewUrl.value = ''
    personalForm.value.name = data.user.name || ''
    personalForm.value.email = data.user.email || ''
    personalForm.value.birth_date = normalizeBirthDateForInput(data.user.birth_date)
    personalForm.value.gender = data.user.gender || ''
    updatePhone(data.user.fone || '')

    syncSessionUser(data.user)
  } catch {
    errorMessage.value = 'Erro de conexao ao carregar perfil.'
  } finally {
    loadingProfile.value = false
  }
}

async function saveProfile() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  clearMessages()

  if (!personalForm.value.name || !personalForm.value.email) {
    errorMessage.value = 'Preencha nome e e-mail.'
    return
  }

  if (!isValidEmail(personalForm.value.email)) {
    errorMessage.value = 'Use um email valido: gmail, outlook, hotmail, live, icloud ou yahoo.'
    return
  }

  savingProfile.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: personalForm.value.name,
        email: personalForm.value.email,
        fone: personalForm.value.phone,
        birth_date: personalForm.value.birth_date || null,
        gender: personalForm.value.gender || null,
      }),
    })

    const data = await response.json()
    if (!response.ok || !data?.user) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel salvar perfil.'
      return
    }

    profileUser.value = data.user
    avatarPreviewUrl.value = ''
    personalForm.value.name = data.user.name || ''
    personalForm.value.email = data.user.email || ''
    personalForm.value.birth_date = normalizeBirthDateForInput(data.user.birth_date)
    personalForm.value.gender = data.user.gender || ''
    updatePhone(data.user.fone || '')

    syncSessionUser(data.user)
    successMessage.value = data.message || 'Perfil atualizado com sucesso.'
  } catch {
    errorMessage.value = 'Erro de conexao ao salvar perfil.'
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  clearMessages()

  if (
    !passwordForm.value.current_password ||
    !passwordForm.value.new_password ||
    !passwordForm.value.confirm_new_password
  ) {
    errorMessage.value = 'Preencha todos os campos de senha.'
    return
  }

  if (passwordForm.value.new_password.length < 6) {
    errorMessage.value = 'A nova senha precisa ter no minimo 6 caracteres.'
    return
  }

  if (passwordForm.value.new_password !== passwordForm.value.confirm_new_password) {
    errorMessage.value = 'A confirmacao da nova senha nao confere.'
    return
  }

  changingPassword.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile/password`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordForm.value),
    })

    const data = await response.json()
    if (!response.ok) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel alterar senha.'
      return
    }

    passwordForm.value.current_password = ''
    passwordForm.value.new_password = ''
    passwordForm.value.confirm_new_password = ''
    successMessage.value = data.message || 'Senha alterada com sucesso.'
  } catch {
    errorMessage.value = 'Erro de conexao ao alterar senha.'
  } finally {
    changingPassword.value = false
  }
}

async function deleteAccount() {
  const headers = getAuthHeaders()
  if (!headers) {
    router.push('/login')
    return
  }

  clearMessages()

  const confirmed = window.confirm('Deseja realmente excluir sua conta? Esta acao nao pode ser desfeita.')
  if (!confirmed) return

  deletingAccount.value = true

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'DELETE',
      headers,
    })

    const data = await response.json()
    if (!response.ok) {
      if (response.status === 401) {
        logout()
        return
      }

      errorMessage.value = data.message || 'Nao foi possivel excluir conta.'
      return
    }

    localStorage.removeItem('bf_session')
    window.dispatchEvent(new Event('bf-cart-updated'))
    router.push('/login')
  } catch {
    errorMessage.value = 'Erro de conexao ao excluir conta.'
  } finally {
    deletingAccount.value = false
  }
}

onMounted(() => {
  resetAddressForm()
  loadProfile()
  loadAddresses()
})
</script>

<style scoped>
.bf-profile-page {
  background: var(--bf-page-bg);
  padding: 26px 0 40px;
}

.bf-profile-shell {
  max-width: 1540px;
  margin: 0 auto;
  padding: 0 16px;
}

.bf-hidden-file-input {
  display: none;
}

.bf-profile-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.bf-profile-aside {
  display: grid;
  gap: 16px;
  position: sticky;
  top: 110px;
}

.bf-side-menu-card {
  border: 1px solid #f0e2d3;
  border-radius: 14px;
  background: #ffffff;
  padding: 12px 10px;
}

.bf-side-menu-item {
  width: 100%;
  min-height: 54px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #261810;
  display: grid;
  grid-template-columns: 24px 1fr;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  text-align: left;
  font-size: 1.17rem;
  font-weight: 600;
  cursor: pointer;
}

.bf-side-menu-item:hover {
  background: #fff4e6;
}

.bf-side-menu-item.is-active {
  background: #fff4e6;
  color: #ef7b20;
}

.bf-side-divider {
  margin: 10px 6px;
  border-top: 1px solid #f0e2d3;
}

.bf-side-promo {
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(180deg, #25150d 0%, #1a120d 100%);
  border: 1px solid #3a271b;
  padding: 16px;
}

.bf-side-promo h3 {
  margin: 0;
  color: #ff8a24;
  font-size: 1.78rem;
  line-height: 1.05;
}

.bf-side-promo p {
  margin: 8px 0 0;
  color: #f8e4d1;
  font-size: 1.08rem;
  line-height: 1.4;
}

.bf-side-promo-image {
  width: 100%;
  height: 170px;
  margin-top: 14px;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(24, 15, 10, 0) 0%, rgba(24, 15, 10, 0.6) 100%),
    url('/menu/combo-classic.webp');
  background-size: cover;
  background-position: center;
}

.bf-side-promo-btn {
  width: 100%;
  margin-top: 14px;
  min-height: 52px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(90deg, #ef7b20 0%, #f46900 100%);
  color: #ffffff;
  font-size: 1.18rem;
  font-weight: 700;
  cursor: pointer;
}

.bf-profile-main {
  display: grid;
  gap: 20px;
}

.bf-profile-header h1 {
  margin: 0;
  color: #1f130f;
  font-size: 3.2rem;
  line-height: 0.95;
}

.bf-profile-header p {
  margin: 10px 0 0;
  color: #66594d;
  font-size: 1.22rem;
}

.bf-profile-summary {
  border: 1px solid #f0e2d3;
  border-radius: 14px;
  background: #ffffff;
  padding: 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
}

.bf-avatar-wrap {
  position: relative;
}

.bf-avatar {
  width: 144px;
  height: 144px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 20%, #2f1b12 0%, #150d09 70%);
  color: #f7ede4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bf-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  object-fit: cover;
}

.bf-avatar-action {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: #ef7b20;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.bf-avatar-action:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.bf-user-meta h2 {
  margin: 0;
  color: #23150f;
  font-size: 2.65rem;
  line-height: 1;
}

.bf-user-meta p {
  margin: 10px 0 0;
  color: #4f4137;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.12rem;
}

.bf-edit-photo-btn {
  min-height: 54px;
  border-radius: 10px;
  padding-inline: 24px;
  font-size: 1.08rem;
  font-weight: 700;
}

.bf-section h2 {
  margin: 0;
  color: #1f130f;
  font-size: 2.34rem;
  line-height: 1;
}

.bf-form-card {
  margin-top: 10px;
  border: 1px solid #f0e2d3;
  border-radius: 14px;
  background: #ffffff;
  padding: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 14px;
}

.bf-field-group {
  display: grid;
  gap: 7px;
  align-items: start;
}

.bf-field-group label {
  display: block;
  margin: 0;
  color: #2d1f17;
  font-size: 1.02rem;
  font-weight: 700;
}

.bf-two-cols {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bf-native-field {
  width: 100%;
  display: flex;
  align-items: center;
  min-height: 54px;
  border: 1px solid #d8c9b8;
  border-radius: 10px;
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

.bf-native-input,
.bf-native-select {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: #2b1b13;
  font-size: 1.08rem;
  line-height: 1.2;
}

.bf-native-input::placeholder {
  color: #90857b;
}

.bf-native-input-date {
  color: #2b1b13;
}

.bf-native-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  cursor: pointer;
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

.bf-form-actions {
  display: flex;
  justify-content: flex-end;
}

.bf-address-empty {
  border: 1px dashed #e5d4bf;
  border-radius: 10px;
  padding: 14px;
  color: #6a5a4e;
  font-size: 1.02rem;
}

.bf-address-list {
  display: grid;
  gap: 10px;
}

.bf-address-item {
  border: 1px solid #ead8c3;
  border-radius: 10px;
  background: #fffdf9;
  padding: 12px;
}

.bf-address-item.is-default {
  border-color: #efb06f;
  box-shadow: 0 0 0 1px rgba(239, 123, 32, 0.14) inset;
}

.bf-address-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bf-address-item-head strong {
  color: #2d1f17;
  font-size: 1.05rem;
}

.bf-address-default-tag {
  border-radius: 999px;
  background: #ffe8cf;
  color: #c56314;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 3px 8px;
}

.bf-address-item p {
  margin: 6px 0 0;
  color: #5f5247;
  font-size: 0.98rem;
  line-height: 1.35;
}

.bf-address-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.bf-address-form-title {
  margin-top: 2px;
  color: #2a1d16;
  font-size: 1.12rem;
  font-weight: 700;
}

.bf-address-default-check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #4f4035;
  font-size: 0.98rem;
}

.bf-address-form-actions {
  gap: 8px;
}

.bf-primary-btn {
  min-height: 54px;
  border-radius: 10px;
  padding-inline: 26px;
  background: linear-gradient(90deg, #ef7b20 0%, #f46900 100%);
  color: #ffffff;
  font-size: 1.08rem;
  font-weight: 700;
}

.bf-outline-btn {
  min-height: 54px;
  border-radius: 10px;
  padding-inline: 24px;
  font-size: 1.08rem;
  font-weight: 700;
}

.bf-delete-card {
  margin-top: 10px;
  border: 1px solid #f5c7bf;
  border-radius: 14px;
  background: #fff8f7;
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
}

.bf-delete-info {
  display: grid;
  grid-template-columns: 60px 1fr;
  gap: 12px;
  align-items: center;
}

.bf-delete-icon {
  width: 60px;
  height: 60px;
  border-radius: 999px;
  background: #ffe2dd;
  color: #d4371d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bf-delete-info strong {
  display: block;
  color: #cf2f1a;
  font-size: 1.66rem;
  line-height: 1.05;
}

.bf-delete-info p {
  margin: 7px 0 0;
  color: #5e453d;
  font-size: 1.08rem;
  line-height: 1.4;
}

.bf-delete-btn {
  min-height: 52px;
  border-radius: 10px;
  padding-inline: 24px;
  font-size: 1.06rem;
  font-weight: 700;
}

.bf-help-strip {
  border: 1px solid #f0e2d3;
  border-radius: 12px;
  background: #fffcf8;
  min-height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #5c4d43;
  font-size: 1.06rem;
}

@media (max-width: 1280px) {
  .bf-profile-grid {
    grid-template-columns: 1fr;
  }

  .bf-profile-aside {
    position: static;
  }
}

@media (max-width: 980px) {
  .bf-profile-summary {
    grid-template-columns: 1fr;
    justify-items: flex-start;
  }

  .bf-two-cols {
    grid-template-columns: 1fr;
  }

  .bf-delete-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 680px) {
  .bf-profile-shell {
    padding: 0 12px;
  }

  .bf-profile-header h1 {
    font-size: 2.4rem;
  }

  .bf-section h2 {
    font-size: 1.95rem;
  }

  .bf-user-meta h2 {
    font-size: 2rem;
  }
}
</style>
