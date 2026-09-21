export function yen(n: number): string {
  return `${new Intl.NumberFormat('ja-JP').format(Math.round(n))}円`
}

export function manYen(n: number): string {
  const man = n / 10_000
  const text =
    Number.isInteger(man) || man >= 100 ? String(Math.round(man)) : man.toFixed(1)
  return `${text}万円`
}

export function km(n: number): string {
  return `${new Intl.NumberFormat('ja-JP').format(n)}km`
}

export function auctionDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  const week = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}（${week}）`
}

export function yearMonth(year: number, month: number): string {
  return `${year}年${month}月`
}
