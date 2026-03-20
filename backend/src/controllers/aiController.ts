import { Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import { exec } from 'child_process';

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

export const getOpenIntent = async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message) {
        res.status(400).json({ error: 'No message provided.' });
        return;
    }

    const systemPrompt = `You are an Intent Resolver for an AI assistant called A.C.E.
The user wants to open ONE or MULTIPLE applications, websites, or pages in a single request.

Rules:
- Return ONLY a valid JSON object: { "actions": [ { "type": "web" | "app", "target": "<URL or app command>", "label": "<short name>" }, ... ] }
- Always return an ARRAY under "actions", even for one item.
- For websites (type: "web"): "target" must be a fully qualified URL starting with https://.
- For apps on the user's PC (type: "app"): "target" should be the system command or executable name (e.g., "start cmd" for Command Prompt, "code" for VS Code, "explorer" for File Explorer, "calc" for Calculator, "notepad" for Notepad).
- For well-known websites use their homepage. For Wikipedia lookups use the specific article. For ambiguous requests use a Google search.
- Labels should be short and human-friendly: "YouTube", "Command Prompt", "VS Code", "Wikipedia: Quantum Computing"
- CRITICAL: Return actions ONLY for items explicitly requested in the user's message. Do NOT include examples like YouTube unless requested.
- Do NOT include markdown, code blocks, or any text outside the JSON object.
- Do NOT explain yourself.`;

    try {
        const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: systemPrompt },
                ...(history || []),
                { role: 'user', content: message },
            ],
            stream: false,
            temperature: 0,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || '';
        const jsonStr = raw.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        let parsed: any = {};
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            console.error('[A.C.E Backend] Failed to parse JSON:', jsonStr);
        }

        let actions: { type: string; target: string; label: string }[] = [];
        
        if (Array.isArray(parsed.actions)) {
            actions = parsed.actions;
        } else if (parsed.actions && typeof parsed.actions === 'object') {
            actions = [parsed.actions];
        } else if (parsed.action && typeof parsed.action === 'object') {
            actions = [parsed.action];
        } else if (Array.isArray(parsed.urls)) {
            actions = parsed.urls.map((u: any) => ({ type: 'web', target: u.url, label: u.label }));
        } else if (parsed.url) {
            actions = [{ type: 'web', target: parsed.url, label: parsed.label || parsed.url }];
        }

        const frontendActions = [];
        for (const action of actions) {
            if (action.type === 'app' && action.target) {
                console.log(`[A.C.E Backend] Launching app: ${action.target}`);
                
                // Use 'start ""' on Windows to spawn a new detached window visibly
                let cmd = action.target;
                if (!cmd.toLowerCase().startsWith('start ')) {
                    cmd = `start "" "${cmd}"`;
                }
                
                exec(cmd, (error) => {
                    if (error) console.error(`Failed to launch app ${action.target}:`, error);
                });
                frontendActions.push(action);
            } else if (action.type === 'web' && action.target && action.target.startsWith('http')) {
                frontendActions.push(action);
            }
        }

        if (frontendActions.length === 0) throw new Error('No valid actions in LLM response');

        res.json({ actions: frontendActions });
    } catch (error) {
        console.error('Open Intent Error:', error);
        res.status(500).json({ error: 'Could not resolve actions for that request.' });
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
