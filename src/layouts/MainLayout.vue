<template>
  <q-layout view="lHh lpr lFf" class="site-layout">
    <q-header v-if="!isLoginPage" class="topbar">
      <q-toolbar class="topbar-inner">
        <div class="brand-wrap row items-center no-wrap">
          <img :src="logo" alt="Burger Factory" class="brand-logo" />
          <q-toolbar-title class="text-weight-bold brand-title">BURGUERFACTORY</q-toolbar-title>
        </div>

        <nav class="nav-links row items-center no-wrap">
          <a href="/lanches#menu" class="nav-link" @click.prevent="goMenu">Cardapio</a>
          <a href="/lanches#sobre" class="nav-link" @click.prevent="goAbout">Sobre</a>

          <q-btn flat round icon="shopping_cart" class="cart-btn" @click="toggleCart">
            <q-badge v-if="cartCount > 0" color="deep-orange-8" floating>{{ cartCount }}</q-badge>
          </q-btn>

          <q-btn
            v-if="!isLoggedIn"
            flat
            round
            icon="account_circle"
            class="profile-btn"
            @click="goLogin"
          />

          <q-btn v-else flat round icon="account_circle" class="profile-btn">
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 220px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ userLabel }}</q-item-label>
                    <q-item-label caption>{{ userEmail }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section avatar>
                    <q-icon name="logout" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Sair</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </nav>
      </q-toolbar>
    </q-header>

    <q-drawer v-if="!isLoginPage" v-model="cartDrawerOpen" side="right" overlay bordered :width="360">
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
              <q-item-label class="text-weight-bold">R$ {{ formatPrice(item.unit_price * item.quantity) }}</q-item-label>
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

        <q-btn class="q-mt-md full-width checkout-btn" color="deep-orange-8" no-caps unelevated label="Finalizar pedido" :disable="cartItems.length === 0" @click="goCheckout" />
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import logo from 'src/assets/logoburguerfactory.png'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const route = useRoute()
const router = useRouter()

const isLoginPage = computed(() => route.path === '/login')
const sessionData = ref({ mode: 'guest', token: null, user: null })
const cartDrawerOpen = ref(false)
const cartItems = ref([])
const cartTotal = ref(0)
const cartLoading = ref(false)
const cartError = ref('')
const removingItemId = ref(null)
const updatingItemId = ref(null)
const cartCount = computed(() => cartItems.value.reduce((acc, item) => acc + Number(item.quantity), 0))
const isLoggedIn = computed(() => sessionData.value.mode === 'auth' && Boolean(sessionData.value.token))
const userLabel = computed(() => {
  const name = sessionData.value?.user?.name
  return name ? `Ola, ${name}` : 'Logado'
})
const userEmail = computed(() => sessionData.value?.user?.email || '')

function loadSessionData() {
  sessionData.value = JSON.parse(localStorage.getItem('bf_session') || '{"mode":"guest","token":null,"user":null}')
}

function goLogin() {
  router.push('/login')
}

function goMenu() {
  router.push('/lanches#menu')
}

function goAbout() {
  router.push('/lanches#sobre')
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
  loadCart()
}

function logout() {
  localStorage.removeItem('bf_session')
  loadSessionData()
  cartItems.value = []
  cartTotal.value = 0
  router.push('/login')
}

onMounted(() => {
  loadSessionData()
  window.addEventListener('bf-cart-updated', handleCartUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('bf-cart-updated', handleCartUpdated)
})
</script>
