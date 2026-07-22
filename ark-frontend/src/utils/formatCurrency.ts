export function formatAED(amount: string | number): string {
  return `AED ${Number(amount).toLocaleString('en-AE')}`
}
