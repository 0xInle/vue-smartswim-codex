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
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/competitions',
      component: AppCompetitions,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/competitions/archive',
      component: AppCompetitionsArchive,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/competitions/:slug',
      component: AppCompetitionDetail,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/fees',
      component: AppFees,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/fees/:slug',
      component: AppFeeDetail,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/documents',
      component: AppDocuments,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/contacts',
      component: AppContacts,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/trainers',
      component: AppTrainers,
      meta: {
        showFloatingHeader: true,
      },
    },
    {
      path: '/account',
      component: AppAccount,
      meta: {
        showFloatingHeader: false,
      },
    },
  ],
})

export default router
