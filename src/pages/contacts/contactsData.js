import { formatRussianPhone, toRussianPhoneHref } from '@/utils/phone'

export const contactCards = [
  {
    title: 'Контакты',
    value: 'Владыкина Василиса Владимировна',
    description: 'Индивидуальный предприниматель',
    accent: 'ИП',
  },
  {
    title: 'ИНН',
    value: '550407139308',
    accent: 'ИНН',
  },
  {
    title: 'Юридический адрес',
    value: '111674, г. Москва, ул. Льва Яшина, д. 7, кв. 197',
    accent: 'ADR',
  },
  {
    title: 'Телефон',
    value: formatRussianPhone('+7 (916) 729-07-73'),
    href: toRussianPhoneHref('+7 (916) 729-07-73'),
    accent: 'TEL',
  },
  {
    title: 'Email для обращений',
    value: 'cupsmartswim@yandex.ru',
    href: 'mailto:cupsmartswim@yandex.ru',
    accent: '@',
  },
]
