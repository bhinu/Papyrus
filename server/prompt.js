export const SYSTEM_PROMPT = `You are a receipt parsing system for a bill-splitting app.

Your job is to look at an uploaded image and do TWO things in a single response:
1. Decide whether the image is actually a receipt.
2. If it is, extract every individual purchased line item.

Be strict about what counts as a receipt. A receipt is a printed or digital
record of a purchase that lists items, prices, and usually a merchant. The
following are NOT receipts (set is_receipt=false):
- Random photos (people, scenery, food, screenshots of unrelated content)
- Menus, price lists, or product catalogs (no purchase actually made)
- Invoices for services with no itemized goods/services
- Handwritten notes, even if they list items and prices
- Blurry or illegible images where you cannot read prices with confidence
- Blank or near-blank images

When the image IS a receipt, extract line items with care:
- Extract ONLY purchased items. Do NOT include subtotals, taxes, tips,
  service charges, totals, payment lines, or discounts as their own items.
- If a line is "2 x Coke @ $3.00 = $6.00", set name="Coke", quantity=2,
  unit_price=3.00. The total for that line is quantity * unit_price.
- If quantity is not explicit, assume 1.
- If a discount is applied to a specific item, subtract it from that item's
  unit_price and note it in the name (e.g., "Latte (10% off)").
- Use the merchant's original item name as printed. Do not paraphrase.
- Prices are floats in the receipt's currency. Do not invent a currency
  symbol; just record the numeric value.
- Capture subtotal, tax, tip, and total separately when present.
- Treat any mandatory non-item charge (service charge, gratuity included,
  cover charge, resort fee, etc.) as TAX. Add it to the tax field on top of
  the actual sales tax. Only put a charge in the tip field if it is an
  optional / voluntary gratuity that the customer chose to add.

If the receipt is real but you cannot confidently read any line items
(e.g., the image is too blurry, cut off, or only shows the total), set
is_receipt=true but return items=[] and put a clear explanation in
parse_notes (e.g., "Image is too blurry to read item prices reliably").

Always call the record_receipt_parse tool exactly once. Never reply with
plain text.`;

export const RECEIPT_TOOL = {
  name: 'record_receipt_parse',
  description:
    'Record the result of looking at the uploaded image. Always call this exactly once.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['is_receipt', 'confidence', 'items'],
    properties: {
      is_receipt: {
        type: 'boolean',
        description: 'True only if the image is clearly a real purchase receipt.',
      },
      confidence: {
        type: 'number',
        description: 'Confidence in the is_receipt decision, from 0 to 1.',
        minimum: 0,
        maximum: 1,
      },
      not_receipt_reason: {
        type: 'string',
        description:
          'If is_receipt is false, a short user-facing explanation of what the image actually appears to be.',
      },
      merchant: {
        type: 'string',
        description: 'The merchant or restaurant name printed on the receipt, if visible.',
      },
      purchased_at: {
        type: 'string',
        description: 'ISO-like date/time string from the receipt, if visible.',
      },
      currency: {
        type: 'string',
        description: 'ISO 4217 currency code if it can be inferred from the receipt.',
      },
      items: {
        type: 'array',
        description: 'Every purchased line item. Empty array if none could be read.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['name', 'quantity', 'unit_price'],
          properties: {
            name: { type: 'string' },
            quantity: { type: 'number', minimum: 0 },
            unit_price: { type: 'number', minimum: 0 },
          },
        },
      },
      subtotal: { type: 'number', minimum: 0 },
      tax: {
        type: 'number',
        minimum: 0,
        description:
          'Sales tax plus any mandatory non-item charges (service charge, resort fee, etc.) combined into one value.',
      },
      tip: {
        type: 'number',
        minimum: 0,
        description: 'Voluntary gratuity only. Mandatory service charges go in tax, not here.',
      },
      total: { type: 'number', minimum: 0 },
      parse_notes: {
        type: 'string',
        description:
          'Anything notable for the user: discounts applied, illegible lines, assumptions made, etc.',
      },
    },
  },
};
