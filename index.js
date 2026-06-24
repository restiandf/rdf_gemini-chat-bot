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

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const GEMINI_MODEL = 'gemini-2.5-flash'; 

app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/generate-text', async (req, res) => {
    const { prompt } = req.body;

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
            res.status(429).json({ message: 'Kuota harian AI telah habis. Silakan coba lagi besok atau upgrade paket Anda.' });
        } else if (e.status === 503 || e.message?.includes('high demand') || e.message?.includes('UNAVAILABLE')) {
            res.status(503).json({ message: 'Maaf, layanan AI sedang sibuk. Silakan coba lagi dalam beberapa detik.' });
        } else {
            res.status(500).json({ message: e.message || 'Terjadi kesalahan pada server.' });
        }
    }
});

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
    const { prompt } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: "File gambar tidak ditemukan." });
    }

    const base64Image = req.file.buffer.toString("base64");

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { text: prompt, type: "text" },
                { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
            ],
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
            res.status(429).json({ message: 'Kuota harian AI telah habis. Silakan coba lagi besok atau upgrade paket Anda.' });
        } else if (e.status === 503 || e.message?.includes('high demand') || e.message?.includes('UNAVAILABLE')) {
            res.status(503).json({ message: 'Maaf, layanan AI sedang sibuk. Silakan coba lagi dalam beberapa detik.' });
        } else {
            res.status(500).json({ message: e.message || 'Terjadi kesalahan pada server.' });
        }
    }
});


app.post('/generate-from-document', upload.single('document'), async (req, res) => {
    const { prompt } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "File dokumen tidak ditemukan." });
    }

    const base64Document = req.file.buffer.toString("base64");

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { 
                    text: prompt ?? "Tolong buat ringkasan dari dokumen berikut.", 
                    type: "text" 
                },
                { inlineData: { data: base64Document, mimeType: req.file.mimetype } }
            ],
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
            res.status(429).json({ message: 'Kuota harian AI telah habis. Silakan coba lagi besok atau upgrade paket Anda.' });
        } else if (e.status === 503 || e.message?.includes('high demand') || e.message?.includes('UNAVAILABLE')) {
            res.status(503).json({ message: 'Maaf, layanan AI sedang sibuk. Silakan coba lagi dalam beberapa detik.' });
        } else {
            res.status(500).json({ message: e.message || 'Terjadi kesalahan pada server.' });
        }
    }
});


app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
    const { prompt } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "File audio tidak ditemukan." });
    }

    const base64Audio = req.file.buffer.toString("base64");

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [
                { 
                    text: prompt ?? "Tolong buatkan transkrip dari rekaman berikut.", 
                    type: "text" 
                },
                { inlineData: { data: base64Audio, mimeType: req.file.mimetype } }
            ],
        });

        res.status(200).json({ result: response.text });
    } catch (e) {
        console.log(e);
        if (e.status === 429 || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED')) {
            res.status(429).json({ message: 'Kuota harian AI telah habis. Silakan coba lagi besok atau upgrade paket Anda.' });
        } else if (e.status === 503 || e.message?.includes('high demand') || e.message?.includes('UNAVAILABLE')) {
            res.status(503).json({ message: 'Maaf, layanan AI sedang sibuk. Silakan coba lagi dalam beberapa detik.' });
        } else {
            res.status(500).json({ message: e.message || 'Terjadi kesalahan pada server.' });
        }
    }
});

// Jalankan Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});