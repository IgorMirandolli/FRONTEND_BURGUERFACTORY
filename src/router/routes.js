const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/lanches' },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'register', component: () => import('pages/RegisterPage.vue') },
      { path: 'lanches', component: () => import('pages/MenuPage.vue') },
      { path: 'checkout', component: () => import('pages/CheckoutPage.vue') },
      { path: 'pedidos', component: () => import('pages/OrdersPage.vue') },
      { path: 'pedidos/:orderId', component: () => import('pages/OrderStatusPage.vue') },
      { path: 'perfil', component: () => import('pages/ProfilePage.vue') },
      { path: 'admin', redirect: '/admin/pedidos', meta: { requiresAdmin: true } },
      {
        path: 'admin/produtos',
        component: () => import('pages/AdminProductsPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'admin/relatorios',
        component: () => import('pages/AdminReportsPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: 'admin/pedidos',
        component: () => import('pages/AdminOrdersPage.vue'),
        meta: { requiresAdmin: true },
      },
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
