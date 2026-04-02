import AppContacts from '@/pages/AppContacts.vue'
import AppDocuments from '@/pages/AppDocuments.vue'
import AppFees from '@/pages/AppFees.vue'
import AppTrainers from '@/pages/AppTrainers.vue'
import AppCompetitionsArchive from '@/pages/competitions/AppCompetitionsArchive.vue'
import AppCompetitionDetail from '@/pages/competitions/AppCompetitionDetail.vue'
import AppCompetitions from '@/pages/competitions/AppCompetitions.vue'
import HomePage from '@/pages/home/AppHome.vue'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    return { top: 0, left: 0 }
  },
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
      path: '/competitions/archive',
      component: AppCompetitionsArchive,
    },
    {
      path: '/competitions/:slug',
      component: AppCompetitionDetail,
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
