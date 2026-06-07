import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT, RECEIPT_TOOL } from './prompt.js';

const PORT = Number(process.env.PORT) || 3001;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const app = express();
app.use(cors());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post('/api/parse-receipt', upload.single('receipt'), async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'server_misconfigured',
      message:
        'ANTHROPIC_API_KEY is not set on the server. Add it to .env and restart.',
    });
  }
  if (!req.file) {
    return res.status(400).json({
      error: 'missing_file',
      message: 'No file uploaded. Use multipart/form-data with field "receipt".',
    });
  }
  if (!ALLOWED_MIME.has(req.file.mimetype)) {
    return res.status(400).json({
      error: 'unsupported_type',
      message: `Unsupported file type: ${req.file.mimetype}. Use JPG, PNG, WEBP, or GIF.`,
    });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [RECEIPT_TOOL],
      tool_choice: { type: 'tool', name: RECEIPT_TOOL.name },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: req.file.mimetype,
                data: req.file.buffer.toString('base64'),
              },
            },
            {
              type: 'text',
              text: 'Here is the uploaded image. Decide if it is a receipt and extract line items.',
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find(
      (block) => block.type === 'tool_use' && block.name === RECEIPT_TOOL.name,
    );

    if (!toolUse) {
      return res.status(502).json({
        error: 'model_no_tool_call',
        message: 'The model did not return structured output. Try a clearer photo.',
      });
    }

    return res.json({ result: toolUse.input, model: MODEL });
  } catch (err) {
    return res.status(mapAnthropicStatus(err)).json({
      error: 'anthropic_error',
      message: err?.message || 'Unknown error talking to Anthropic.',
      type: err?.error?.type,
    });
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'file_too_large',
      message: `File exceeds ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} MB limit.`,
    });
  }
  return res.status(500).json({
    error: 'server_error',
    message: err?.message || 'Unexpected server error.',
  });
});

function mapAnthropicStatus(err) {
  const status = err?.status;
  if (status === 429) return 429;
  if (status === 401 || status === 403) return 502;
  if (status >= 500 && status < 600) return 502;
  return 500;
}

app.listen(PORT, () => {
  console.log(`[papyrus] api listening on http://localhost:${PORT}`);
});
