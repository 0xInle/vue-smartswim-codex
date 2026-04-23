<template>
  <section class="documents">
    <div class="container">
      <DocumentsLibrarySection :documents="documents" />
      <DocumentsImageBreak :src="documentsImage" />
      <DocumentsFaqSection :sections="faqSections" />
      <DocumentsFooterImage
        :src="documentsFooterImage"
        alt="Пловец Smart Swim в воде во время тренировки"
      />
    </div>

    <HomeFooterSection />
  </section>
</template>

<script setup>
import HomeFooterSection from '@/pages/home/components/HomeFooterSection.vue'
import { documents, faqSections } from '@/pages/documents/documentsData'
import { publicAsset } from '@/utils/publicAsset'
import DocumentsFaqSection from './components/DocumentsFaqSection.vue'
import DocumentsFooterImage from './components/DocumentsFooterImage.vue'
import DocumentsImageBreak from './components/DocumentsImageBreak.vue'
import DocumentsLibrarySection from './components/DocumentsLibrarySection.vue'

const documentsImage = publicAsset('/images/17-img.webp')
const documentsFooterImage = publicAsset('/images/20-img.webp')
</script>
