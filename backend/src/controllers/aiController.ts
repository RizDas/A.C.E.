import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export const getChatStream = async (req: Request, res: Response) => {
    const { message } = req.body;

    try {
        const stream = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You are A.C.E. (Adaptive Cognitive Engine), my advanced humanoid AI personal assistant. Your primary function is to assist me. By default, keep your responses extremely concise (1-2 lines). However, if I explicitly ask for more detail, a longer explanation, or to 'tell more', provide a comprehensive response." },
                { role: "user", content: message }
            ],
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
