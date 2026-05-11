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

          <q-btn flat no-caps class="enter-btn" label="Entrar" @click="goLogin" />
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
              <q-item-label caption>Qtd: {{ item.quantity }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-weight-bold">R$ {{ formatPrice(item.unit_price * item.quantity) }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-separator class="q-my-md" />

        <div class="row items-center justify-between text-subtitle1 text-weight-bold">
          <span>Total</span>
          <span>R$ {{ formatPrice(cartTotal) }}</span>
        </div>
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
const cartDrawerOpen = ref(false)
const cartItems = ref([])
const cartTotal = ref(0)
const cartLoading = ref(false)
const cartError = ref('')
const cartCount = computed(() => cartItems.value.reduce((acc, item) => acc + Number(item.quantity), 0))

function goLogin() {
  router.push('/login')
}

function goMenu() {
  router.push('/lanches#menu')
}

function goAbout() {
  router.push('/lanches#sobre')
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

async function loadCart() {
  cartLoading.value = true
  cartError.value = ''

  try {
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
    cartLoading.value = false
  }
}

function toggleCart() {
  cartDrawerOpen.value = !cartDrawerOpen.value
  if (cartDrawerOpen.value) {
    loadCart()
  }
}

function handleCartUpdated() {
  loadCart()
}

onMounted(() => {
  window.addEventListener('bf-cart-updated', handleCartUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('bf-cart-updated', handleCartUpdated)
})
</script>
