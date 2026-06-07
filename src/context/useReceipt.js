import { useContext } from 'react'
import { ReceiptContext } from './receipt-context.js'

export function useReceipt() {
  const ctx = useContext(ReceiptContext)
  if (!ctx) throw new Error('useReceipt must be used inside <ReceiptProvider>')
  return ctx
}
