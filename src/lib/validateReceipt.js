export function validateReceiptMath(result) {
  const items = result?.items || []
  const tax = Number(result?.tax) || 0
  const tip = Number(result?.tip) || 0
  const total = Number(result?.total) || 0

  if (items.length === 0) {
    return { skipped: true, reason: 'no_items' }
  }
  if (total <= 0) {
    return { skipped: true, reason: 'no_total' }
  }

  const itemsSum = items.reduce(
    (s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0,
  )
  const expected = itemsSum + tax + tip
  const diff = Math.abs(total - expected)
  // 1% of total, but never less than 5 cents. Handles both small and large bills.
  const tolerance = Math.max(0.05, total * 0.01)
  const ok = diff <= tolerance

  return {
    skipped: false,
    ok,
    diff,
    tolerance,
    expected,
    actual: total,
    itemsSum,
    tax,
    tip,
  }
}
