// Converts a date to a nuemeric id, counting days from 1/1/2024
export const dateToId = (date) => {
  const start = new Date('2024-01-01')
  const diff = date - start
  const oneDay = 24 * 60 * 60 * 1000
  return Math.floor(diff / oneDay)
}

export const idToDate = (id) => {
  const start = new Date('2024-01-01')
  const oneDay = 24 * 60 * 60 * 1000
  return new Date(start.getTime() + id * oneDay)
}
