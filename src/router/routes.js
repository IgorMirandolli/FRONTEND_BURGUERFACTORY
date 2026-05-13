const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/lanches' },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'lanches', component: () => import('pages/MenuPage.vue') },
      { path: 'checkout', component: () => import('pages/CheckoutPage.vue') },
      { path: 'pedidos', component: () => import('pages/OrdersPage.vue') },
      { path: 'pedidos/:orderId', component: () => import('pages/OrderStatusPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
