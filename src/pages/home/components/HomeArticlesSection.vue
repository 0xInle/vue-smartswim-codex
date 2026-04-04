<template>
  <section class="articles">
    <div class="article__content article__content--01 flex">
      <img :src="articleImageOne" alt="Изображение" loading="lazy" decoding="async" />
      <div
        :ref="(element) => setArticleTextRef(element, 0)"
        class="article__text"
        :class="{ 'article__text--visible': visibleItems[0] }"
      >
        <span class="article__eyebrow">Подготовка</span>
        <h3 class="article__heading">Как стать чемпионом?</h3>
        <div class="article__descr">
          Секрет успеха в спорте — регулярная практика и правильная подготовка. <br />
          Важно развивать технику, выносливость и уверенность в себе. Каждая тренировка строится на
          постепенном улучшении навыков. <br />
          Понимание своих сильных и слабых сторон помогает достигать целей. <br />
          Баланс между физической нагрузкой и отдыхом — ключ к прогрессу.
        </div>
      </div>
    </div>

    <div class="article__content article__content--02 flex">
      <div
        :ref="(element) => setArticleTextRef(element, 1)"
        class="article__text"
        :class="{ 'article__text--visible': visibleItems[1] }"
      >
        <span class="article__eyebrow">Техника</span>
        <h3 class="article__heading">Правила идеального старта</h3>
        <div class="article__descr">
          Правильный старт помогает максимально использовать силы и технику. Важно удерживать
          концентрацию и следовать установленной позиции. Лёгкая разминка и контроль дыхания
          подготавливают тело к нагрузке. Каждое движение должно быть чётким и скоординированным.
          Постепенная практика закрепляет навыки и уменьшает ошибки.
        </div>
      </div>
      <img :src="articleImageTwo" alt="Изображение" loading="lazy" decoding="async" />
    </div>

    <div class="article__content article__content--03 flex">
      <img :src="articleImageThree" alt="Изображение" loading="lazy" decoding="async" />
      <div
        :ref="(element) => setArticleTextRef(element, 2)"
        class="article__text"
        :class="{ 'article__text--visible': visibleItems[2] }"
      >
        <span class="article__eyebrow">Практика</span>
        <h3 class="article__heading">В чем польза соревнований?</h3>
        <div class="article__descr">
          Соревнования развивают мотивацию и помогают оценить свои возможности. Они дают опыт работы
          в стрессовых и конкурентных условиях. Участие помогает выявить сильные стороны и зоны для
          роста. Практика соревновательного процесса повышает дисциплину. Наблюдение за другими
          спортсменами расширяет понимание техники.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { publicAsset } from '@/utils/publicAsset'

const articleTextRefs = ref([])
const visibleItems = ref([false, false, false])
const articleImageOne = publicAsset('/images/01-img.webp')
const articleImageTwo = publicAsset('/images/02-img.webp')
const articleImageThree = publicAsset('/images/03-img.webp')

let observer

const setArticleTextRef = (element, index) => {
  articleTextRefs.value[index] = element
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return
        }

        const index = articleTextRefs.value.indexOf(entry.target)

        if (index !== -1) {
          visibleItems.value[index] = true
          observer.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.25,
      rootMargin: '0px 0px -10% 0px',
    },
  )

  articleTextRefs.value.forEach((element) => {
    if (element) {
      observer.observe(element)
    }
  })
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<style scoped>
.articles {
  position: relative;
  margin-bottom: 50px;
  padding: 36px 0;
  z-index: 0;
}

.articles::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 100vw;
  transform: translateX(-50%);
  background: linear-gradient(
    90deg,
    var(--very-light-blue) 0%,
    var(--very-light-blue) 50%,
    var(--white) 50%,
    var(--white) 100%
  );
  z-index: -1;
}

.article__content {
  gap: 100px;
  align-items: center;
}

.article__content + .article__content {
  margin-top: 48px;
}

.article__eyebrow,
.article__heading,
.article__descr {
  opacity: 0;
  transform: translateY(40px);
}

.article__eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  margin-bottom: 16px;
  padding: 8px 12px;
  border: 1px solid color-mix(in srgb, var(--cyan) 18%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--white) 58%, transparent);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--cyan) 80%, var(--black));
  transition:
    opacity 0.45s ease,
    transform 0.45s ease;
}

.article__heading {
  transition:
    opacity 0.55s ease,
    transform 0.55s ease;
}

.article__descr {
  transition:
    opacity 0.7s ease 0.18s,
    transform 0.7s ease 0.18s;
}

.article__text {
  position: relative;
  width: min(100%, 520px);
  padding: 34px 32px 30px;
  border: 1px solid color-mix(in srgb, var(--cyan) 22%, transparent);
  border-radius: 10px;
  box-shadow:
    0 18px 48px color-mix(in srgb, var(--black) 8%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--white) 0%, transparent);
  overflow: hidden;
}

.article__text--visible .article__eyebrow,
.article__text--visible .article__heading,
.article__text--visible .article__descr {
  opacity: 1;
  transform: translateY(0);
}

.article__heading {
  margin: 0 0 20px;
  font-size: 36px;
  line-height: 1.05;
  font-weight: 900;
}

.article__descr {
  position: relative;
  z-index: 1;
  max-width: 440px;
  font-size: 16px;
  line-height: 1.85;
  color: color-mix(in srgb, var(--black) 82%, var(--white));
}

.article__content img {
  width: 35%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 18px 38px color-mix(in srgb, var(--black) 12%, transparent);
}

@media (max-width: 768px) {
  .articles {
    padding: 24px 0;
    margin-bottom: 20px;
  }

  .articles::before {
    background: var(--very-light-blue);
  }

  .article__content {
    flex-direction: column;
    gap: 24px;
  }

  .article__content img {
    order: 1;
  }

  .article__text {
    order: 2;
  }

  .article__text {
    width: 100%;
    padding: 28px 22px 24px;
    border-radius: 10px;
  }

  .article__heading {
    font-size: 30px;
  }

  .article__content img {
    width: 100%;
  }
}
</style>
