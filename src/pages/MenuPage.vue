<template>
  <q-page class="bf-menu-page">
    <div class="bf-shell">
      <section class="bf-hero" id="home">
        <div class="bf-hero-content">
          <div class="bf-hero-badge">
            <q-icon name="star" size="16px" />
            <span>Feito para satisfazer</span>
          </div>

          <h1 class="bf-hero-title">
            Os melhores
            <span>burgers</span>
            da cidade!
          </h1>

          <p class="bf-hero-subtitle">
            Ingredientes selecionados, carnes artesanais
            <br />
            e aquele sabor que so a Burger Factory tem.
          </p>

          <div class="bf-hero-actions">
            <q-btn
              no-caps
              unelevated
              class="bf-hero-btn bf-hero-btn-primary"
              icon="shopping_bag"
              label="Ver cardapio"
              @click="scrollToMenu"
            />
            <q-btn
              no-caps
              outline
              class="bf-hero-btn bf-hero-btn-secondary"
              icon="delivery_dining"
              label="Fazer pedido"
              @click="goCheckout"
            />
          </div>
        </div>

        <div class="bf-hero-media">
          <img :src="heroImageUrl" alt="Burger principal" class="bf-hero-image" />
          <div class="bf-hero-fade" />

          <article class="bf-delivery-card">
            <p class="bf-delivery-title">
              <q-icon name="delivery_dining" size="20px" />
              Entrega rapida
            </p>
            <p class="bf-delivery-subtitle">
              Receba seu pedido
              <br />
              em ate <strong>35 minutos</strong>
            </p>
          </article>
        </div>
      </section>

      <section class="bf-categories" aria-label="Categorias do cardapio">
        <button
          v-for="cat in categoriesBar"
          :key="cat.key"
          type="button"
          class="bf-category-btn"
          :class="{ 'is-active': cat.key === activeCategory }"
          @click="setActiveCategory(cat.key)"
        >
          <span class="bf-category-icon">
            <q-icon :name="cat.icon" size="24px" />
          </span>
          <span class="bf-category-label">{{ cat.label }}</span>
        </button>
      </section>

      <section id="menu" class="bf-menu-block">
        <div class="bf-section-head">
          <h2 class="bf-section-title">{{ activeCategoryLabel }} em destaque</h2>
          <button type="button" class="bf-section-more" @click="scrollToMenu">
            Ver todos
            <q-icon name="chevron_right" size="18px" />
          </button>
        </div>

        <div v-if="loading" class="row justify-center q-py-lg">
          <q-spinner color="orange-8" size="40px" />
        </div>

        <q-banner v-if="errorMessage" inline-actions class="bg-red-1 text-red-9 q-mb-md rounded-borders">
          {{ errorMessage }}
        </q-banner>

        <q-banner v-if="cartMessage" inline-actions class="bg-green-1 text-green-9 q-mb-md rounded-borders">
          {{ cartMessage }}
        </q-banner>

        <div v-if="!loading && !errorMessage" class="bf-featured-grid">
          <article v-for="item in visibleItems" :key="item.id" class="bf-featured-card">
            <div class="bf-featured-image-wrap">
              <img :src="resolveImageUrl(item.imageUrl)" :alt="item.name" class="bf-featured-image" />
            </div>

            <div class="bf-featured-body">
              <h3 class="bf-featured-title">{{ item.name }}</h3>
              <p class="bf-featured-desc">{{ item.description || defaultDescription }}</p>
              <div class="bf-featured-footer">
                <span class="bf-featured-price">R$ {{ formatPrice(item.price) }}</span>
                <q-btn
                  round
                  flat
                  class="bf-add-btn"
                  icon="add"
                  :loading="addingItemId === item.id"
                  @click="addToCart(item)"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      <section id="sobre" class="bf-about-block">
  <h3 class="bf-about-title">Sobre a Burger Factory</h3>
  
  <p class="bf-about-text">
    Na Burger Factory, acreditamos que um hamburguer vai muito alem de apenas matar a fome:
    ele precisa ser uma experiencia. Trabalhamos com ingredientes selecionados, carnes
    artesanais, combinacoes marcantes e um preparo pensado em cada detalhe para entregar
    sabor, qualidade e aquela sensacao de satisfacao a cada pedido.
  </p>
  
  <p class="bf-about-text">
    Hoje atuamos exclusivamente atraves do delivery, levando nossos burgers ate voce com
    praticidade, rapidez e o mesmo cuidado de uma hamburgueria premium.
  </p>
</section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const heroImageUrl =
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1800&q=80'

const router = useRouter()

const menuItems = ref([])
const loading = ref(true)
const errorMessage = ref('')
const cartMessage = ref('')
const addingItemId = ref(null)
const activeCategory = ref('combos')

const defaultDescription = 'Ingredientes selecionados e preparo no ponto certo.'

const categoriesBar = [
  { key: 'combos', id: 1, label: 'Combos', icon: 'fastfood' },
  { key: 'hamburgueres', id: 2, label: 'Hamburgueres', icon: 'lunch_dining' },
  { key: 'fritas', id: 3, label: 'Fritas', icon: 'restaurant_menu' },
  { key: 'bebidas', id: 4, label: 'Bebidas', icon: 'local_drink' },
  { key: 'sobremesas', id: 5, label: 'Sobremesas', icon: 'icecream' },
]

const activeCategoryLabel = computed(() => {
  const selected = categoriesBar.find((category) => category.key === activeCategory.value)
  return selected?.label || 'Combos'
})

const visibleItems = computed(() => {
  const selectedCategory = categoriesBar.find((category) => category.key === activeCategory.value)

  return menuItems.value.filter((item) => {
    const itemCategoryId = Number(item.categoryId ?? item.category_id ?? 0)
    const itemCategorySlug = String(item.category || '').toLowerCase()

    const matchesById = Number.isInteger(selectedCategory?.id) && itemCategoryId === selectedCategory.id
    const matchesBySlug = itemCategorySlug === activeCategory.value

    return matchesById || matchesBySlug
  })
})

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return '/menu/combo-smash.webp'
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2).replace('.', ',')
}

function goCheckout() {
  router.push('/checkout')
}

function scrollToMenu() {
  const element = document.getElementById('menu')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function setActiveCategory(categoryKey) {
  activeCategory.value = categoryKey
  scrollToMenu()
}

function getOrCreateGuestSessionId() {
  const existing = localStorage.getItem('bf_guest_session_id')
  if (existing) return existing

  const generated = crypto.randomUUID()
  localStorage.setItem('bf_guest_session_id', generated)
  return generated
}

async function addToCart(item) {
  cartMessage.value = ''
  addingItemId.value = item.id

  try {
    const session = JSON.parse(localStorage.getItem('bf_session') || '{}')
    const token = session.token || null
    const isAuth = session.mode === 'auth' && token
    const sessionId = getOrCreateGuestSessionId()

    const headers = { 'Content-Type': 'application/json' }
    if (isAuth) headers.Authorization = `Bearer ${token}`

    const body = {
      product_id: item.id,
      quantity: 1,
    }

    if (!isAuth) body.session_id = sessionId

    const response = await fetch(`${API_BASE_URL}/api/cart/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const data = await response.json()

    if (!response.ok) {
      cartMessage.value = data.message || 'Nao foi possivel adicionar ao carrinho.'
      return
    }

    cartMessage.value = 'Item adicionado ao carrinho com sucesso.'
    window.dispatchEvent(new Event('bf-cart-updated'))
  } catch {
    cartMessage.value = 'Erro de conexao ao adicionar no carrinho.'
  } finally {
    addingItemId.value = null
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

<style scoped>
.bf-menu-page {
  background: var(--bf-page-bg);
  padding: 0 0 40px;
}

.bf-shell {
  max-width: 1640px;
  margin: 0 auto;
  padding: 0 16px;
}

.bf-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(420px, 44%) 1fr;
  min-height: 500px;
  background: var(--bf-page-bg);
  overflow: hidden;
}

.bf-hero-content {
  padding: 84px 22px 54px 22px;
  background: #ffffff;
  border-left: 1px solid #eee2d2;
}

.bf-hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 999px;
  background: #f8eddd;
  color: #73411e;
  font-size: 1rem;
  font-weight: 700;
}

.bf-hero-title {
  margin: 24px 0 18px;
  max-width: 560px;
  font-size: clamp(3.2rem, 5vw, 5rem);
  line-height: 0.97;
  letter-spacing: -0.02em;
  color: #2b1a11;
  font-weight: 800;
}

.bf-hero-title span {
  color: #ef7b20;
}

.bf-hero-subtitle {
  margin: 0;
  color: #5f554d;
  font-size: 1.15rem;
  line-height: 1.5;
}

.bf-hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 28px;
}

.bf-hero-btn {
  height: 56px;
  min-width: 194px;
  border-radius: 12px;
  font-size: 1.04rem;
  font-weight: 700;
}

.bf-hero-btn-primary {
  background: #ef7b20;
  color: #ffffff;
}

.bf-hero-btn-secondary {
  border: 1px solid #ef7b20;
  color: #ef7b20;
}

.bf-hero-media {
  position: relative;
  min-height: 100%;
}

.bf-hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bf-hero-fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0.62) 15%, rgba(255, 255, 255, 0) 36%);
  pointer-events: none;
}

.bf-delivery-card {
  position: absolute;
  right: 20px;
  bottom: 20px;
  min-width: 250px;
  background: rgba(14, 10, 7, 0.9);
  border: 1px solid rgba(238, 155, 57, 0.34);
  border-radius: 14px;
  padding: 14px 18px;
  color: #ffffff;
}

.bf-delivery-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #ffd7a8;
  font-size: 1.78rem;
  font-family: 'Anton', sans-serif;
  letter-spacing: 0.01em;
}

.bf-delivery-subtitle {
  margin: 8px 0 0;
  line-height: 1.45;
  color: #f7e8d1;
  font-size: 1rem;
}

.bf-delivery-subtitle strong {
  color: #ffa038;
}

.bf-categories {
  margin-top: -16px;
  background: #ffffff;
  border: 1px solid #f0e2d4;
  border-radius: 14px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  overflow: hidden;
}

.bf-category-btn {
  position: relative;
  border: 0;
  border-right: 1px solid #f6ece1;
  background: transparent;
  min-height: 136px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 10px;
  cursor: pointer;
}

.bf-category-btn:last-child {
  border-right: 0;
}

.bf-category-icon {
  width: 68px;
  height: 68px;
  border-radius: 999px;
  border: 1px solid #f1dfca;
  color: #c6823f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fffdfa;
}

.bf-category-label {
  font-size: 1rem;
  color: #2a2019;
  font-weight: 500;
}

.bf-category-btn.is-active .bf-category-icon {
  border-color: #ef7b20;
  color: #ef7b20;
  background: #fff2e1;
}

.bf-category-btn.is-active .bf-category-label {
  color: #2a1a11;
  font-weight: 700;
}

.bf-category-btn.is-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 8px;
  transform: translateX(-50%);
  width: 58px;
  height: 3px;
  border-radius: 999px;
  background: #ef7b20;
}

.bf-menu-block {
  margin-top: 34px;
}

.bf-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.bf-section-title {
  margin: 0;
  color: #231812;
  font-size: 2.35rem;
  font-weight: 700;
}

.bf-section-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: #ef7b20;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}

.bf-featured-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}

.bf-featured-card {
  border: 1px solid #f0e2d3;
  border-radius: 16px;
  background: #ffffff;
  display: grid;
  grid-template-columns: 210px 1fr;
  overflow: hidden;
}

.bf-featured-image-wrap {
  position: relative;
  padding: 10px;
}

.bf-featured-image {
  width: 100%;
  height: 174px;
  border-radius: 12px;
  object-fit: cover;
}

.bf-featured-badge {
  position: absolute;
  top: 18px;
  right: 18px;
  border-radius: 10px;
  background: #ef7b20;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 4px 10px;
}

.bf-featured-body {
  padding: 20px 14px 16px 8px;
}

.bf-featured-title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.1;
  color: #281b15;
}

.bf-featured-desc {
  margin: 8px 0 14px;
  color: #665a50;
  font-size: 1rem;
  line-height: 1.45;
}

.bf-featured-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bf-featured-price {
  color: #ef7b20;
  font-size: 2.1rem;
  line-height: 1;
  font-weight: 700;
}

.bf-add-btn {
  width: 44px;
  height: 44px;
  border: 1px solid #efc79e;
  color: #ef7b20;
  background: #ffffff;
}

.bf-about-block {
  margin-top: 26px;
  padding: 20px;
  border: 1px solid #f0e3d6;
  border-radius: 14px;
  background: #fffdfa;
}

.bf-about-title {
  margin: 0;
  font-size: 1.35rem;
  color: #2a1a11;
}

.bf-about-text {
  margin: 8px 0 0;
  color: #66574b;
}

@media (max-width: 1200px) {
  .bf-featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .bf-shell {
    padding: 0 12px;
  }

  .bf-hero {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .bf-hero-content {
    padding: 26px 12px 14px;
  }

  .bf-hero-title {
    font-size: clamp(2.3rem, 11vw, 3.4rem);
  }

  .bf-hero-actions {
    flex-wrap: wrap;
  }

  .bf-hero-btn {
    width: 100%;
    min-width: 0;
  }

  .bf-hero-media {
    min-height: 280px;
  }

  .bf-delivery-card {
    right: 12px;
    bottom: 12px;
  }

  .bf-categories {
    margin-top: 10px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bf-category-btn {
    border-right: 0;
    border-bottom: 1px solid #f6ece1;
  }

  .bf-featured-grid {
    grid-template-columns: 1fr;
  }

  .bf-featured-card {
    grid-template-columns: 1fr;
  }

  .bf-featured-image {
    height: 180px;
  }

  .bf-section-title {
    font-size: 1.85rem;
  }
}
</style>
