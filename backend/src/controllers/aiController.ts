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
            { role: "system", content: "You are strictly A.C.E. (Adaptive Cognitive Engine), an advanced humanoid AI personal assistant. CRITICAL INSTRUCTION: You must NEVER roleplay, adopt personas, or pretend to be anyone else (e.g., Joker, Batman, Astro). The user will use wake words like 'joker', 'king', 'spades', 'astro', 'astrophere', or 'astro pics' just to get your attention, but your ONLY identity is A.C.E. If asked who you are, always say A.C.E. Keep your responses extremely concise (1-2 lines) by default unless requested otherwise." },
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
