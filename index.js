import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash';
const FREE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b'
];

const upload = multer({ storage: multer.memoryStorage() });

function resolveModel(model) {
  return model && FREE_MODELS.includes(model) ? model : GEMINI_MODEL;
}

function handleGeminiError(res, e) {
  console.log(e);
  if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
    res.status(429).json({ message: 'Kuota harian AI telah habis. Silakan coba lagi besok atau upgrade paket Anda.' });
  } else if (e.status === 503 || e.message?.includes('high demand') || e.message?.includes('UNAVAILABLE')) {
    res.status(503).json({ message: 'Maaf, layanan AI sedang sibuk. Silakan coba lagi dalam beberapa detik.' });
  } else {
    res.status(500).json({ message: e.message || 'Terjadi kesalahan pada server.' });
  }
}

async function generateAndRespond(res, model, contents) {
  try {
    const response = await ai.models.generateContent({ model, contents });
    res.status(200).json({ result: response.text });
  } catch (e) {
    handleGeminiError(res, e);
  }
}

function fileToInlineData(file) {
  return { inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } };
}

app.post('/generate-text', async (req, res) => {
  const { prompt, model } = req.body;
  await generateAndRespond(res, resolveModel(model), prompt);
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  const { prompt, model } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: 'File gambar tidak ditemukan.' });
  }
  await generateAndRespond(res, resolveModel(model), [
    { text: prompt, type: 'text' },
    fileToInlineData(req.file)
  ]);
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  const { prompt, model } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: 'File dokumen tidak ditemukan.' });
  }
  await generateAndRespond(res, resolveModel(model), [
    { text: prompt ?? 'Tolong buat ringkasan dari dokumen berikut.', type: 'text' },
    fileToInlineData(req.file)
  ]);
});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  const { prompt, model } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: 'File audio tidak ditemukan.' });
  }
  await generateAndRespond(res, resolveModel(model), [
    { text: prompt ?? 'Tolong buatkan transkrip dari rekaman berikut.', type: 'text' },
    fileToInlineData(req.file)
  ]);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
