<template>
  <q-page class="menu-page q-pa-md q-pa-lg-xl">
    <section class="hero-home q-mb-xl">
      <div class="hero-content">
        <q-badge class="home-badge" color="amber-6" text-color="dark" label="Hamburgueres Artesanais" />
        <h1 class="home-title q-my-md">O SABOR QUE VOCE MONTA DO SEU JEITO.</h1>
        <p class="home-subtitle">Faca login para acompanhar pedidos ou compre rapidamente sem cadastro.</p>

        <div v-if="!isLoggedIn" class="row q-gutter-sm q-mt-md">
          <q-btn color="deep-orange-8" no-caps unelevated label="Fazer Login" @click="goLogin" />
          <q-btn color="deep-orange-8" no-caps outline label="Registrar-se" @click="goRegister" />
        </div>
      </div>

      <div class="hero-highlight">
        <q-carousel
          v-model="heroSlide"
          animated
          infinite
          :autoplay="3500"
          arrows
          navigation
          height="100%"
          class="hero-carousel"
        >
          <q-carousel-slide
            v-for="slide in heroSlides"
            :key="slide.name"
            :name="slide.name"
            :img-src="slide.imageUrl"
            class="hero-carousel-slide"
          />
        </q-carousel>
      </div>
    </section>

    <section id="sobre" class="about-section q-mb-xl">
      <div class="about-kicker">Nossa Essencia</div>
      <h2 class="menu-section-title q-mb-md">SOBRE A BURGER FACTORY</h2>
      <div class="about-grid">
        <div class="about-main">
          <p class="about-text q-mb-md">
            Na Burger Factory, acreditamos que um hamburguer vai muito alem de apenas matar a fome:
            ele precisa ser uma experiencia. Trabalhamos com ingredientes selecionados, carnes
            artesanais, combinacoes marcantes e um preparo pensado em cada detalhe para entregar
            sabor, qualidade e aquela sensacao de satisfacao a cada pedido.
          </p>
          <p class="about-text">
            Hoje atuamos exclusivamente atraves do delivery, levando nossos burgers ate voce com
            praticidade, rapidez e o mesmo cuidado de uma hamburgueria premium.
          </p>
        </div>

        <aside class="about-side">
          <p class="about-side-text">
            Mesmo sendo uma marca em crescimento, nosso objetivo e grande: criar uma experiencia cada
            vez melhor para nossos clientes e, no futuro, expandir a Burger Factory para um espaco
            fisico moderno, aconchegante e cheio de personalidade.
          </p>
          <p class="about-signature">Burger Factory, feito para satisfazer.</p>
        </aside>
      </div>
    </section>

    <section v-if="loading" class="q-py-lg">
      <q-spinner color="orange-8" size="40px" />
    </section>

    <q-banner v-if="errorMessage" inline-actions class="bg-red-1 text-red-9 q-mb-md rounded-borders">
      {{ errorMessage }}
    </q-banner>
    <q-banner v-if="cartMessage" inline-actions class="bg-green-1 text-green-9 q-mb-md rounded-borders">
      {{ cartMessage }}
    </q-banner>

    <section v-if="!loading && !errorMessage" id="menu" class="menu-sections">
      <article v-for="section in menuSections" :key="section.key" class="menu-section-block q-mb-xl">
        <h2 class="menu-section-title q-mb-md">{{ section.title }}</h2>
        <div class="menu-grid">
          <q-card v-for="item in section.items" :key="item.id" class="menu-card" flat bordered>
            <q-img :src="item.imageUrl" :alt="item.name" class="menu-item-image" loading="lazy" fit="cover" />
            <q-card-section class="menu-card-content">
              <div class="menu-item-title q-mb-xs">{{ item.name }}</div>
              <div class="menu-description q-mb-md">{{ item.description }}</div>
              <q-select
                v-if="isNaturalJuice(item)"
                v-model="juiceFlavorByProduct[item.id]"
                :options="juiceFlavorOptions"
                label="Escolha o sabor"
                dense
                outlined
                emit-value
                map-options
                class="q-mb-md"
              />
              <div class="menu-price">R$ {{ formatPrice(item.price) }}</div>
            </q-card-section>
            <q-card-actions align="right">
              <q-btn
                no-caps
                unelevated
                color="deep-orange-8"
                icon="add_shopping_cart"
                label="Adicionar ao carrinho"
                class="add-cart-btn"
                :loading="addingItemId === item.id"
                @click="addToCart(item)"
              />
            </q-card-actions>
          </q-card>
        </div>
      </article>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const router = useRouter()
const menuItems = ref([])
const loading = ref(true)
const errorMessage = ref('')
const cartMessage = ref('')
const heroSlide = ref('hamburguer')
const addingItemId = ref(null)
const juiceFlavorByProduct = ref({})
const juiceFlavorOptions = [
  { label: 'Laranja', value: 'laranja' },
  { label: 'Manga', value: 'manga' },
  { label: 'Morango', value: 'morango' },
  { label: 'Maracuja', value: 'maracuja' },
]

const heroSlides = [
  {
    name: 'hamburguer',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'fritas',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1000&q=80',
  },
  {
    name: 'bebida',
    imageUrl: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?auto=format&fit=crop&w=1000&q=80',
  },
]

const sectionOrder = [
  { key: 'combos', title: 'COMBOS' },
  { key: 'hamburgueres', title: 'HAMBURGUERES' },
  { key: 'fritas', title: 'FRITAS' },
  { key: 'bebidas', title: 'BEBIDAS' },
]

const menuSections = computed(() => {
  return sectionOrder.map((section) => ({
    ...section,
    items: menuItems.value.filter((item) => item.category === section.key),
  }))
})

const isLoggedIn = computed(() => {
  const session = JSON.parse(localStorage.getItem('bf_session') || '{}')
  return session.mode === 'auth' && Boolean(session.token)
})

function formatPrice(value) {
  return Number(value).toFixed(2).replace('.', ',')
}

function goLogin() {
  router.push('/login')
}

function goRegister() {
  router.push('/login')
}

function isNaturalJuice(item) {
  return String(item?.name || '').toLowerCase().includes('suco natural')
}

function getOrCreateGuestSessionId() {
  const existing = localStorage.getItem('bf_guest_session_id');
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  localStorage.setItem('bf_guest_session_id', generated);
  return generated;
}

async function addToCart(item) {
  cartMessage.value = '';
  addingItemId.value = item.id;

  try {
    const session = JSON.parse(localStorage.getItem('bf_session') || '{}');
    const token = session.token || null;
    const isAuth = session.mode === 'auth' && token;
    const sessionId = getOrCreateGuestSessionId();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (isAuth) {
      headers.Authorization = `Bearer ${token}`;
    }

    const body = {
      product_id: item.id,
      quantity: 1,
    };

    if (isNaturalJuice(item)) {
      const selectedFlavor = juiceFlavorByProduct.value[item.id] || juiceFlavorOptions[0].value
      juiceFlavorByProduct.value[item.id] = selectedFlavor
      body.notes = `Sabor: ${selectedFlavor}`
    }

    if (!isAuth) {
      body.session_id = sessionId;
    }

    const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      cartMessage.value = data.message || 'Nao foi possivel adicionar ao carrinho.';
      return;
    }

    cartMessage.value = 'Item adicionado ao carrinho com sucesso.';
    window.dispatchEvent(new Event('bf-cart-updated'));
  } catch {
    cartMessage.value = 'Erro de conexao ao adicionar no carrinho.';
  } finally {
    addingItemId.value = null;
  }
}

async function loadMenu() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/menu`)
    const data = await response.json()

    if (!response.ok) {
      errorMessage.value = data.message || 'Nao foi possivel carregar o cardapio.'
      return
    }

    menuItems.value = data.items || []
  } catch {
    errorMessage.value = 'Erro de conexao com servidor.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMenu()
})
</script>



