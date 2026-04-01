import AppCompetitions from '@/pages/AppCompetitions.vue'
import AppContacts from '@/pages/AppContacts.vue'
import AppDocuments from '@/pages/AppDocuments.vue'
import AppFees from '@/pages/AppFees.vue'
import AppTrainers from '@/pages/AppTrainers.vue'
import HomePage from '@/pages/home/AppHome.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomePage,
    },
    {
      path: '/competitions',
      component: AppCompetitions,
    },
    {
      path: '/fees',
      component: AppFees,
    },
    {
      path: '/documents',
      component: AppDocuments,
    },
    {
      path: '/contacts',
      component: AppContacts,
    },
    {
      path: '/trainers',
      component: AppTrainers,
    },
  ],
})

export default router
