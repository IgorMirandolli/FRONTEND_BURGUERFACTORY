import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior(to) {
      if (to.hash) {
        return {
          el: to.hash,
          top: 90,
          behavior: 'smooth',
        }
      }

      return { left: 0, top: 0 }
    },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach((to) => {
    if (!to.meta?.requiresAdmin) return true
    if (process.env.SERVER) return true

    const session = JSON.parse(localStorage.getItem('bf_session') || '{}')
    const isAuth = session.mode === 'auth' && Boolean(session.token)
    const role = String(session?.user?.role || '').toLowerCase()

    if (!isAuth) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if (role !== 'admin') {
      return { path: '/lanches' }
    }

    return true
  })

  return Router
})
