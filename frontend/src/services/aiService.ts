import { ChatMessage } from "../context/AIContext";

export async function getChatStream(
    message: string,
    history: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
) {
    try {
        const response = await fetch("http://localhost:3001/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message, history }),
        });

        if (!response.ok) {
            throw new Error(`Backend Error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        if (!reader) return;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter((line) => line.trim() !== "");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.replace("data: ", "");
                    if (data === "[DONE]") {
                        onComplete(fullResponse);
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.content || "";
                        if (content) {
                            fullResponse += content;
                            onChunk(content);
                        }
                    } catch (e) {
                        console.error("Error parsing backend stream chunk", e);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Backend Call Failed:", error);
        onChunk("Error connecting to neural interface.");
    }
}
