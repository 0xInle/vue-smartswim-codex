import { publicAsset } from '@/utils/publicAsset'

export const archiveSeasons = [
  {
    year: '2025',
    dates: [
      '26 января 2025',
      '16 февраля 2025',
      '16 марта 2025',
      '20 апреля 2025',
      '18 мая 2025',
      '28 сентября 2025',
      '19 октября 2025',
      '23 ноября 2025',
      '14 декабря 2025',
    ],
  },
  {
    year: '2024',
    dates: [
      '27 января 2024',
      '17 февраля 2024',
      '6 апреля 2024',
      '20 апреля 2024',
      '18 мая 2024',
      '28 сентября 2024',
      '19 октября 2024',
      '16 ноября 2024',
      '14 декабря 2024',
    ],
  },
  {
    year: '2023',
    dates: [
      '28 января 2023',
      '18 февраля 2023',
      '18 марта 2023',
      '22 апреля 2023',
      '20 мая 2023',
      '14 октября 2023',
      '18 ноября 2023',
      '16 декабря 2023',
    ],
  },
  {
    year: '2022',
    dates: [
      '26 февраля 2022',
      '16 марта 2022',
      '16 апреля 2022',
      '21 мая 2022',
      '15 октября 2022',
      '19 ноября 2022',
      '10 декабря 2022',
    ],
  },
]

export const archiveGalleryImages = [
  { src: publicAsset('/images/07-img.webp'), alt: 'Архив соревнований Smart Swim 2025' },
  { src: publicAsset('/images/08-img.webp'), alt: 'Архив соревнований Smart Swim 2024' },
  { src: publicAsset('/images/09-img.webp'), alt: 'Архив соревнований Smart Swim 2023' },
  { src: publicAsset('/images/10-img.webp'), alt: 'Архив соревнований Smart Swim 2022' },
  { src: publicAsset('/images/11-img.webp'), alt: 'Момент с прошедших стартов Smart Swim' },
  { src: publicAsset('/images/12-img.webp'), alt: 'Пловцы на архивных соревнованиях Smart Swim' },
  { src: publicAsset('/images/13-img.webp'), alt: 'Награждение на соревнованиях Smart Swim' },
  { src: publicAsset('/images/14-img.webp'), alt: 'Эмоции участников Smart Swim' },
  { src: publicAsset('/images/15-img.webp'), alt: 'Финишный момент соревнований Smart Swim' },
]

export const archiveGridStyle = {
  '--archive-grid-image': `url(${publicAsset('/images/06-img.webp')})`,
}
