export const BRAND_NAME = 'Vadim'
export const BRAND_TAGLINE = 'Избранные работы и визуальные проекты'
export const MAX_IMAGES = 10

export function imageUrl(filename) {
  return `/uploads/${filename}`
}

export function photoLabel(count) {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return `${count} фото`
  if (n1 === 1) return `${count} фото`
  if (n1 >= 2 && n1 <= 4) return `${count} фото`
  return `${count} фото`
}
