import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: () => import('../views/Landing.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/dashboard',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard/overview',
    children: [
      {
        path: 'overview',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'consents',
        name: 'Consents',
        component: () => import('../views/Consents.vue')
      },
      {
        path: 'crm',
        name: 'Patients',
        component: () => import('../views/Patients.vue')
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('../views/Inventory.vue')
      },
      {
        path: 'mhrs-sync',
        name: 'MhrsSync',
        component: () => import('../views/MhrsSync.vue')
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Optional route guard for auth demonstration
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('onamlarim_token')
  
  if (to.path.startsWith('/dashboard') && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard/overview')
  } else {
    next()
  }
})

export default router

