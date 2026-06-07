# Papyrus

A receipt-splitting web app. Upload a photo of a receipt, get parsed line items
back via the Anthropic Vision API, edit anything that came out wrong, then
split it across people.

## Stack

- React + Vite + Tailwind v4 + shadcn/ui
- React Router, Framer Motion
- Express backend for the Anthropic API call (key stays on the server)

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

`npm run dev` boots both:
- Vite client on `http://localhost:5173`
- API server on `http://localhost:3001`

The client proxies `/api/*` to the server, so the frontend code just calls
`/api/parse-receipt` and never sees the API key.

## Environment

Variables read by the server (`server/index.js`):

| Variable | Required | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | — |
| `ANTHROPIC_MODEL` | no | `claude-sonnet-4-5` |
| `PORT` | no | `3001` |

## Receipt parsing pipeline

1. **Upload page** (`src/pages/UploadPage.jsx`) — drag-drop or click, validates
   MIME type and 10 MB size limit on the client.
2. **Receipt context** (`src/context/ReceiptContext.jsx`) — holds the file,
   preview URL, loading and error state, and the parsed result so it can flow
   to the next page without prop drilling.
3. **API** (`POST /api/parse-receipt`) — multipart upload, calls Anthropic
   Messages API with the image + a `record_receipt_parse` tool. The model is
   forced to call that tool, which gives us a strict JSON schema response
   instead of free-form text we'd have to parse.
4. **Parse result page** (`src/pages/ParseResultPage.jsx`) — three states:
   - `is_receipt === false` → friendly "this doesn't look like a receipt"
     screen with the model's reason.
   - `items: []` but `is_receipt === true` → "we couldn't read items, add them
     manually" screen.
   - Items present → editable list (name, quantity, unit price) with running
     totals and a Continue button.

The prompt itself lives in `server/prompt.js`. It does both the
"is this a receipt?" classification and the line-item extraction in one
tool call — simpler, cheaper, lower latency than two calls.

## Error handling

Client surfaces:
- `unsupported_type`, `file_too_large` — client-side validation before upload.
- `server_misconfigured` — backend doesn't have an API key.
- `network_error` — couldn't reach the server at all.
- `anthropic_error` — Anthropic returned a non-2xx (rate limited, overload, etc).
- `model_no_tool_call` — model returned text instead of a tool call (rare,
  usually means the image was empty/unusable).
- Receipt classified as not-a-receipt — shown as a dedicated page state, not
  an error toast.
