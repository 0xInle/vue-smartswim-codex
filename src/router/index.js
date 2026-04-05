import { createRouter, createWebHistory } from 'vue-router'

const HomePage = () => import('@/pages/home/AppHome.vue')
const AppCompetitions = () => import('@/pages/competitions/AppCompetitions.vue')
const AppCompetitionsArchive = () => import('@/pages/competitions/AppCompetitionsArchive.vue')
const AppCompetitionDetail = () => import('@/pages/competitions/AppCompetitionDetail.vue')
const AppFees = () => import('@/pages/fees/AppFees.vue')
const AppFeeDetail = () => import('@/pages/fees/AppFeeDetail.vue')
const AppDocuments = () => import('@/pages/documents/AppDocuments.vue')
const AppContacts = () => import('@/pages/contacts/AppContacts.vue')
const AppTrainers = () => import('@/pages/trainers/AppTrainers.vue')
const AppAccount = () => import('@/pages/account/AppAccount.vue')

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
      path: '/fees/:slug',
      component: AppFeeDetail,
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
    {
      path: '/account',
      component: AppAccount,
    },
  ],
})

export default router
