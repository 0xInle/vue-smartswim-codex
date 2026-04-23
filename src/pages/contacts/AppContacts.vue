<template>
  <section class="contacts">
    <div class="container">
      <ContactsHeroSection :contact-cards="contactCards" :image-src="contactsImage" />
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { contactCards } from '@/pages/contacts/contactsData'
import { publicAsset } from '@/utils/publicAsset'
import ContactsHeroSection from './components/ContactsHeroSection.vue'

const contactsImage = publicAsset('/images/18-img.webp')
</script>
