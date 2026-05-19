<template>
  <q-layout view="hHh lpr lFf" class="bf-layout">
    <q-header v-if="!isLoginPage" class="bf-header">
      <q-toolbar class="bf-header-bar">
        <button type="button" class="bf-brand" @click="goMenu">
          <img :src="logo" alt="Burger Factory" class="bf-brand-logo" />
          <div class="bf-brand-text">
            <span class="bf-brand-line">BURGER</span>
            <span class="bf-brand-line bf-brand-line-accent">FACTORY</span>
          </div>
        </button>

        <nav class="bf-nav">
          <button type="button" class="bf-nav-link" @click="goMenu">Cardapio</button>
          <button type="button" class="bf-nav-link" @click="goAbout">Sobre</button>
          <button type="button" class="bf-nav-link" @click="goOrders">Pedidos</button>
        </nav>

        <div class="bf-actions">
          <q-btn flat round icon="shopping_cart" class="bf-icon-btn" @click="toggleCart">
            <q-badge v-if="cartCount > 0" class="bf-cart-badge" floating rounded>{{ cartCount }}</q-badge>
          </q-btn>

          <q-btn
            flat
            no-caps
            class="bf-profile-trigger"
            @click.stop="toggleProfileMenu"
          >
            <span id="bf-profile-icon-anchor" class="bf-profile-trigger-icon-wrap">
              <q-icon name="account_circle" class="bf-profile-trigger-icon" />
            </span>
            <span class="bf-profile-trigger-label">{{ profileTriggerLabel }}</span>
            <q-icon name="expand_more" size="20px" class="bf-profile-trigger-caret" />
          </q-btn>

          <q-menu
            v-model="profileMenuOpen"
            target="#bf-profile-icon-anchor"
            anchor="bottom left"
            self="top left"
            :offset="[0, 10]"
            no-parent-event
          >
            <q-list class="bf-profile-menu-list">
              <q-item v-if="isAdmin" clickable v-close-popup class="bf-profile-menu-item" @click="goAdmin">
                <q-item-section avatar>
                  <q-icon name="admin_panel_settings" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Painel admin</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="isLoggedIn" clickable v-close-popup class="bf-profile-menu-item" @click="goProfile">
                <q-item-section avatar>
                  <q-icon name="person_outline" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Meu perfil</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-if="isLoggedIn" clickable v-close-popup class="bf-profile-menu-item" @click="logout">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Sair</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-else clickable v-close-popup class="bf-profile-menu-item" @click="goLogin">
                <q-item-section avatar>
                  <q-icon name="login" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Fazer login</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="!isLoginPage"
      v-model="cartDrawerOpen"
      side="right"
      overlay
      bordered
      :width="360"
    >
      <div class="cart-panel q-pa-md">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold">Seu carrinho</div>
          <q-btn flat round dense icon="close" @click="cartDrawerOpen = false" />
        </div>

        <q-banner v-if="cartError" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
          {{ cartError }}
        </q-banner>

        <div v-if="cartLoading" class="row justify-center q-py-lg">
          <q-spinner color="deep-orange-8" size="34px" />
        </div>

        <div v-else-if="cartItems.length === 0" class="text-grey-7">Seu carrinho esta vazio.</div>

        <q-list v-else separator>
          <q-item v-for="item in cartItems" :key="item.id" class="q-px-none">
            <q-item-section avatar>
              <q-avatar rounded size="54px">
                <img :src="item.imageUrl" :alt="item.name" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ item.name }}</q-item-label>
              <q-item-label caption class="row items-center no-wrap q-gutter-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="remove"
                  :disable="Number(item.quantity) <= 1 || updatingItemId === item.id"
                  @click="updateCartItemQuantity(item, Number(item.quantity) - 1)"
                />
                <span>Qtd: {{ item.quantity }}</span>
                <q-btn
                  flat
                  dense
                  round
                  icon="add"
                  :disable="updatingItemId === item.id"
                  @click="updateCartItemQuantity(item, Number(item.quantity) + 1)"
                />
              </q-item-label>
            </q-item-section>
            <q-item-section side class="items-end">
              <q-item-label class="text-weight-bold">
                R$ {{ formatPrice(item.unit_price * item.quantity) }}
              </q-item-label>
              <q-btn
                flat
                dense
                round
                color="negative"
                icon="delete"
                :loading="removingItemId === item.id"
                @click="removeCartItem(item.id)"
              />
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator class="q-my-md" />

        <div class="row items-center justify-between text-subtitle1 text-weight-bold">
          <span>Total</span>
          <span>R$ {{ formatPrice(cartTotal) }}</span>
        </div>

        <q-btn
          class="q-mt-md full-width checkout-btn"
          color="deep-orange-8"
          no-caps
          unelevated
          label="Finalizar pedido"
          :disable="cartItems.length === 0"
          @click="goCheckout"
        />
      </div>
    </q-drawer>

    <q-page-container class="bf-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from 'src/assets/logoburguerfactory.png'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.path === '/login' || route.path === '/register')
const sessionData = ref({ mode: 'guest', token: null, user: null })
const cartDrawerOpen = ref(false)
const cartItems = ref([])
const cartTotal = ref(0)
const cartLoading = ref(false)
const cartError = ref('')
const removingItemId = ref(null)
const updatingItemId = ref(null)
const profileMenuOpen = ref(false)

const cartCount = computed(() => cartItems.value.reduce((acc, item) => acc + Number(item.quantity), 0))
const isLoggedIn = computed(() => sessionData.value.mode === 'auth' && Boolean(sessionData.value.token))
const isAdmin = computed(
  () => isLoggedIn.value && String(sessionData.value?.user?.role || '').toLowerCase() === 'admin'
)
const profileTriggerLabel = computed(() => {
  const name = sessionData.value?.user?.name
  if (!name) return 'Entrar'

  const firstName = String(name).trim().split(/\s+/)[0]
  return `Ola, ${firstName}`
})

function loadSessionData() {
  sessionData.value = JSON.parse(
    localStorage.getItem('bf_session') || '{"mode":"guest","token":null,"user":null}'
  )
}

function goMenu() {
  router.push({ path: '/lanches', hash: '#menu' })
}

function goAbout() {
  router.push({ path: '/lanches', hash: '#sobre' })
}

function goOrders() {
  router.push('/pedidos')
}

function goLogin() {
  profileMenuOpen.value = false
  router.push('/login')
}

function goProfile() {
  profileMenuOpen.value = false
  router.push('/perfil')
}

function goAdmin() {
  profileMenuOpen.value = false
  router.push('/admin/pedidos')
}

function toggleProfileMenu() {
  profileMenuOpen.value = !profileMenuOpen.value
}

function goCheckout() {
  cartDrawerOpen.value = false
  router.push('/checkout')
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

function getOrCreateGuestSessionId() {
  const existing = localStorage.getItem('bf_guest_session_id')
  if (existing) return existing

  const generated = crypto.randomUUID()
  localStorage.setItem('bf_guest_session_id', generated)
  return generated
}

function getCartRequestContext() {
  const session = JSON.parse(localStorage.getItem('bf_session') || '{}')
  const token = session.token || null
  const isAuth = session.mode === 'auth' && token
  const sessionId = getOrCreateGuestSessionId()

  const headers = {}
  let url = `${API_BASE_URL}/api/cart`

  if (isAuth) {
    headers.Authorization = `Bearer ${token}`
  } else {
    url += `?session_id=${encodeURIComponent(sessionId)}`
  }

  return { headers, url, sessionId, isAuth }
}

async function loadCart(options = {}) {
  const { silent = false } = options

  if (!silent) {
    cartLoading.value = true
  }
  cartError.value = ''

  try {
    const { headers, url } = getCartRequestContext()
    const response = await fetch(url, { headers })
    const data = await response.json()

    if (!response.ok) {
      cartError.value = data.message || 'Nao foi possivel carregar carrinho.'
      return
    }

    cartItems.value = data.items || []
    cartTotal.value = Number(data.total || 0)
  } catch {
    cartError.value = 'Erro de conexao ao carregar carrinho.'
  } finally {
    if (!silent) {
      cartLoading.value = false
    }
  }
}

async function removeCartItem(itemId) {
  removingItemId.value = itemId
  cartError.value = ''

  try {
    const { headers, sessionId, isAuth } = getCartRequestContext()
    let url = `${API_BASE_URL}/api/cart/items/${itemId}`

    if (!isAuth) {
      url += `?session_id=${encodeURIComponent(sessionId)}`
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    })
    const data = await response.json()

    if (!response.ok) {
      cartError.value = data.message || 'Nao foi possivel remover item.'
      return
    }

    await loadCart({ silent: true })
    window.dispatchEvent(new Event('bf-cart-updated'))
  } catch {
    cartError.value = 'Erro de conexao ao remover item.'
  } finally {
    removingItemId.value = null
  }
}

async function updateCartItemQuantity(item, nextQuantity) {
  if (nextQuantity < 1) return

  updatingItemId.value = item.id
  cartError.value = ''

  try {
    const { headers, sessionId, isAuth } = getCartRequestContext()
    let url = `${API_BASE_URL}/api/cart/items/${item.id}`

    if (!isAuth) {
      url += `?session_id=${encodeURIComponent(sessionId)}`
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity: nextQuantity }),
    })
    const data = await response.json()

    if (!response.ok) {
      cartError.value = data.message || 'Nao foi possivel atualizar quantidade.'
      return
    }

    await loadCart({ silent: true })
    window.dispatchEvent(new Event('bf-cart-updated'))
  } catch {
    cartError.value = 'Erro de conexao ao atualizar quantidade.'
  } finally {
    updatingItemId.value = null
  }
}

function toggleCart() {
  cartDrawerOpen.value = !cartDrawerOpen.value

  if (cartDrawerOpen.value) {
    loadCart()
  }
}

function handleCartUpdated() {
  loadSessionData()

  if (cartDrawerOpen.value) {
    loadCart({ silent: true })
  } else {
    loadCart()
  }
}

function logout() {
  profileMenuOpen.value = false
  localStorage.removeItem('bf_session')
  loadSessionData()
  cartItems.value = []
  cartTotal.value = 0
  router.push('/login')
}

onMounted(() => {
  loadSessionData()
  window.addEventListener('bf-cart-updated', handleCartUpdated)

  if (!isLoginPage.value) {
    loadCart({ silent: true })
  }
})

watch(
  () => route.fullPath,
  () => {
    loadSessionData()
    profileMenuOpen.value = false

    if (!isLoginPage.value) {
      loadCart({ silent: true })
    }
  }
)

onBeforeUnmount(() => {
  window.removeEventListener('bf-cart-updated', handleCartUpdated)
})
</script>

<style scoped>
.bf-layout {
  background: var(--bf-page-bg);
}

.bf-header {
  background: #fffdf8;
  border-bottom: 1px solid #f0e5d8;
}

.bf-header-bar {
  max-width: 1640px;
  margin: 0 auto;
  height: 90px;
  padding: 0 16px;
  display: grid !important;
  grid-template-columns: 300px 1fr 180px;
  align-items: center;
  gap: 12px;
}

.bf-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.bf-brand-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.bf-brand-text {
  line-height: 0.9;
  text-align: left;
}

.bf-brand-line {
  display: block;
  font-family: 'Anton', sans-serif;
  font-size: 2rem;
  letter-spacing: 0.03em;
  color: #1f1611;
}

.bf-brand-line-accent {
  color: #ea7a21;
  letter-spacing: 0.16em;
}

.bf-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 52px;
}

.bf-nav-link {
  border: 0;
  background: transparent;
  color: #201712;
  font-size: 1.09rem;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 0;
}

.bf-nav-link:hover {
  color: #e9741f;
}

.bf-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.bf-icon-btn {
  color: #211812;
  height: 48px;
  min-height: 48px;
}

.bf-icon-btn :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bf-icon-btn :deep(.q-btn__content .q-icon) {
  font-size: 30px;
}

.bf-profile-trigger {
  color: #211812;
  border: 1px solid transparent;
  border-radius: 999px;
  padding-inline: 6px;
  min-height: 48px;
  height: 48px;
  white-space: nowrap;
}

.bf-profile-trigger :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.bf-profile-trigger-icon {
  font-size: 30px;
}

.bf-profile-trigger-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bf-profile-trigger-label {
  font-size: 1.07rem;
  font-weight: 600;
  line-height: 1;
}

.bf-profile-trigger-caret {
  color: #514137;
  line-height: 1;
}

.bf-profile-menu-list {
  min-width: 270px;
  padding: 6px 0;
}

.bf-profile-menu-item {
  min-height: 52px;
}

.bf-profile-menu-item :deep(.q-item__section--avatar) {
  min-width: 38px;
  color: #3a2920;
}

.bf-profile-menu-item :deep(.q-item__label) {
  font-size: 1.04rem;
  font-weight: 600;
}

.bf-cart-badge {
  min-width: 21px;
  height: 21px;
  padding: 0 6px;
  background: #f07a20;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 21px;
  right: -4px;
  top: -2px;
}

.checkout-btn {
  border-radius: 12px;
}

.bf-page-container {
  background: var(--bf-page-bg);
}

@media (max-width: 1024px) {
  .bf-header-bar {
    display: flex !important;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    min-height: 0;
    height: auto;
    padding: 8px 10px 10px;
  }

  .bf-brand {
    order: 1;
    gap: 8px;
    min-width: 0;
  }

  .bf-brand-logo {
    width: 40px;
    height: 40px;
  }

  .bf-brand-line {
    font-size: 1.42rem;
  }

  .bf-nav {
    order: 3;
    width: 100%;
    justify-content: flex-start;
    gap: 14px;
    overflow-x: auto;
    padding: 2px 0 4px;
  }

  .bf-nav-link {
    font-size: 0.95rem;
    padding: 6px 0;
  }

  .bf-actions {
    order: 2;
    margin-left: auto;
    gap: 6px;
  }

  .bf-icon-btn {
    min-height: 40px;
    height: 40px;
    width: 40px;
    border: 1px solid #e8dbcb;
    border-radius: 11px;
    background: #fff;
  }

  .bf-icon-btn :deep(.q-btn__content .q-icon) {
    font-size: 23px;
  }

  .bf-profile-trigger {
    min-height: 40px;
    height: 40px;
    width: 40px;
    border-radius: 11px;
    border-color: #e8dbcb;
    background: #fff;
    padding-inline: 0;
    justify-content: center;
  }

  .bf-profile-trigger-icon {
    font-size: 23px;
  }

  .bf-profile-trigger-label {
    display: none;
  }

  .bf-profile-trigger-caret {
    display: none;
  }
}

@media (max-width: 520px) {
  .bf-brand-line {
    font-size: 1.24rem;
  }

  .bf-brand-line-accent {
    letter-spacing: 0.1em;
  }

  .bf-nav {
    gap: 10px;
  }

  .bf-nav-link {
    font-size: 0.9rem;
  }
}
</style>
