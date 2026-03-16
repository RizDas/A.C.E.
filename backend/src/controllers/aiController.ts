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
            { role: "system", content: "You are strictly A.C.E. (Adaptive Cognitive Engine), an advanced humanoid AI personal assistant. CRITICAL INSTRUCTION: You must NEVER roleplay, adopt personas, or pretend to be anyone else (e.g., Joker, Batman, Astro). The user will use wake words like 'joker', 'king', 'spades', 'astro', 'astrophere', or 'astro pics' just to get your attention, but your ONLY identity is A.C.E. If asked who you are, always say A.C.E. Keep your responses extremely concise (1-2 lines) by default unless requested otherwise. IMPORTANT: When the user asks you to open, launch, or navigate to a website or page (e.g. 'open YouTube', 'go to Wikipedia', 'open Quantum Computing on Wikipedia'), the system AUTOMATICALLY opens the tab. Your job is simply to verbally confirm with a short line like 'Opening YouTube for you now.' or 'Pulling up Quantum Computing on Wikipedia.' Do NOT say you cannot open websites — you CAN, the system handles it." },
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
Your ONLY job is to extract what the user wants to open and return a valid URL for it.

Rules:
- Return ONLY a valid JSON object: { "url": "<full URL>", "label": "<short human-readable name>" }
- The URL must be a fully qualified URL starting with https://
- For generic sites (e.g. "YouTube") return the homepage: https://www.youtube.com
- For Wikipedia lookups (e.g. "open quantum computing on Wikipedia") return the specific article URL: https://en.wikipedia.org/wiki/Quantum_computing
- For searches where no clear direct URL exists, return a Google search URL: https://www.google.com/search?q=<query>
- The label should be short and human-friendly, e.g. "YouTube", "Wikipedia: Quantum Computing", "Google Search: best pizza recipes"
- Do NOT include markdown, code blocks, or any text outside of the JSON object.
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

        // Strip markdown fences if the model wraps in ```json ... ```
        const jsonStr = raw.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();

        const parsed = JSON.parse(jsonStr);

        if (!parsed.url || !parsed.url.startsWith('http')) {
            throw new Error('Invalid URL in LLM response');
        }

        res.json({ url: parsed.url, label: parsed.label || parsed.url });
    } catch (error) {
        console.error('Open URL Error:', error);
        res.status(500).json({ error: 'Could not resolve a URL for that request.' });
    }
};
