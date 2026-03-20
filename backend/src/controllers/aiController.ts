import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const getChatStream = async (req: Request, res: Response) => {
    const { message, history } = req.body;

    try {
        const messages = [
            { role: "system", content: "You are strictly A.C.E. (Adaptive Cognitive Engine), an advanced humanoid AI personal assistant. CRITICAL INSTRUCTION: You must NEVER roleplay, adopt personas, or pretend to be anyone else (e.g., Joker, Batman, Astro). The user will use wake words like 'joker', 'king', 'spades', 'astro', 'astrophere', or 'astro pics' just to get your attention, but your ONLY identity is A.C.E. If asked who you are, always say A.C.E. Keep your responses extremely concise (1-2 lines) by default unless requested otherwise. IMPORTANT: When the user asks to open/launch/navigate to websites (e.g. 'open YouTube and Instagram'), the system AUTOMATICALLY opens ALL mentioned tabs. Confirm naturally: 'Opening YouTube and Instagram for you.' When the user asks to close tabs (e.g. 'close YouTube'), the system handles it — just confirm: 'Closing YouTube.' Do NOT say you cannot open or close tabs." },
            ...(history || []),
            { role: "user", content: message }
        ];

        const stream = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages,
            stream: true,
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: "Failed to connect to neural interface." });
    }
};

export const getOpenUrl = async (req: Request, res: Response) => {
    const { message } = req.body;

    if (!message) {
        res.status(400).json({ error: 'No message provided.' });
        return;
    }

    const systemPrompt = `You are a URL resolver for an AI assistant called A.C.E.
The user may want to open ONE or MULTIPLE websites/pages in a single request.

Rules:
- Return ONLY a valid JSON object: { "urls": [ { "url": "<full URL>", "label": "<short name>" }, ... ] }
- Always return an ARRAY even if there is only one site.
- Each URL must be fully qualified starting with https://
- For well-known sites use their homepage (e.g. "YouTube" → https://www.youtube.com, "Instagram" → https://www.instagram.com, "Discord" → https://discord.com)
- For Wikipedia lookups (e.g. "open quantum computing on Wikipedia") use the specific article: https://en.wikipedia.org/wiki/Quantum_computing
- For ambiguous/unknown requests use a Google search: https://www.google.com/search?q=<query>
- Labels should be short and human-friendly: "YouTube", "Instagram", "Wikipedia: Quantum Computing"
- Do NOT include markdown, code blocks, or any text outside the JSON object.
- Do NOT explain yourself.`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ],
            stream: false,
            temperature: 0,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || '';
        const jsonStr = raw.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(jsonStr);

        // Normalise: accept both { urls: [...] } and legacy { url, label }
        const urls: { url: string; label: string }[] = Array.isArray(parsed.urls)
            ? parsed.urls
            : parsed.url
            ? [{ url: parsed.url, label: parsed.label || parsed.url }]
            : [];

        const valid = urls.filter(u => u.url && u.url.startsWith('http'));
        if (valid.length === 0) throw new Error('No valid URLs in LLM response');

        res.json({ urls: valid });
    } catch (error) {
        console.error('Open URL Error:', error);
        res.status(500).json({ error: 'Could not resolve URLs for that request.' });
    }
};

export const getCloseTarget = async (req: Request, res: Response) => {
    const { message, openLabels } = req.body;

    if (!message) {
        res.status(400).json({ error: 'No message provided.' });
        return;
    }

    const systemPrompt = `You are a tab-close resolver for an AI assistant called A.C.E.
The user wants to CLOSE one or more browser tabs that were opened earlier.
You will be given the list of currently open tab labels and the user's request.

Rules:
- Return ONLY a valid JSON object: { "labels": ["<label1>", "<label2>", ...] }
- Match the labels from the provided list that the user wants to close.
- If the user says "close all tabs" or "close everything", return ALL labels from the list.
- Use fuzzy matching: "close youtube" matches label "YouTube".
- Do NOT include markdown, code blocks, or any text outside the JSON object.
- Do NOT explain yourself.

Currently open tab labels: ${JSON.stringify(openLabels || [])}`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message },
            ],
            stream: false,
            temperature: 0,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || '';
        const jsonStr = raw.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        const parsed = JSON.parse(jsonStr);

        res.json({ labels: Array.isArray(parsed.labels) ? parsed.labels : [] });
    } catch (error) {
        console.error('Close Tab Error:', error);
        res.status(500).json({ error: 'Could not resolve close targets.' });
    }
};
