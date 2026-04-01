<template>
  <footer class="footer">
    <div class="footer__top flex">
      <div class="footer__column footer__column--company">
        <div class="footer__text footer__brand">SmartSwim</div>
        <div class="footer__text">111674, г. Москва</div>
        <div class="footer__text">ул. Льва Яшина 7-197</div>
      </div>
      <div class="footer__column footer__column--contacts">
        <div class="footer__title">Контакты</div>
      </div>
      <div class="footer__column footer__column--links flex">
        <a class="footer__link link-reset" href="mailto:cupsmartswim@yandex.ru">
          cupsmartswim@yandex.ru
        </a>
        <a class="footer__link link-reset" href="tel:+79167290773"> +7 916 729 07 73 </a>
      </div>
    </div>
    <div class="footer__bottom flex">
      <div class="footer__copyright">© 2026 SmartSwim. Все права защищены.</div>
      <div class="footer__legal">ИНН 550407139308</div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: relative;
  z-index: 1;
  font-family: Oswald;
  text-transform: uppercase;
  font-weight: 300;
  font-size: 15px;
  padding: 3px 0 30px;
  border-top: 1px solid color-mix(in srgb, var(--cyan) 22%, var(--white));
}

.footer::before {
  content: '';
  position: absolute;
  inset: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100vw;
  background: linear-gradient(
    -90deg,
    var(--very-light-blue) 0%,
    var(--very-light-blue) 50%,
    var(--white) 50%,
    var(--white) 100%
  );
  z-index: -1;
}

.footer__top {
  padding: 20px 0;
  justify-content: space-between;
  border-bottom: 1px solid color-mix(in srgb, var(--cyan) 22%, var(--white));
}

.footer__column {
  width: 165px;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
}
.footer__column--company {
}
.footer__text {
}
.footer__brand {
}
.footer__column--contacts {
  display: flex;
  align-items: center;
}
.footer__title {
  text-decoration: underline;
}
.footer__column--links {
}
.footer__link {
  font-size: 15px;
}
.link-reset {
}
.footer__bottom {
  padding: 20px 0;
  justify-content: space-between;
}
.footer__copyright {
}
.footer__legal {
}
</style>
