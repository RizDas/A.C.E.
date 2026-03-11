export async function getGroqChatStream(
  message: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullText: string) => void
) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const model = "llama-3.1-8b-instant";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are A.C.E. (Adaptive Cognitive Engine), my advanced humanoid AI personal assistant. Your primary function is to assist me. By default, keep your responses extremely concise (1-2 lines). However, if I explicitly ask for more detail, a longer explanation, or to 'tell more', provide a comprehensive response." },
          { role: "user", content: message }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.statusText}`);
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
            const content = parsed.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              onChunk(content);
            }
          } catch (e) {
            console.error("Error parsing Groq stream chunk", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("Groq API Call Failed:", error);
    onChunk("Error connecting to neural interface.");
  }
}
