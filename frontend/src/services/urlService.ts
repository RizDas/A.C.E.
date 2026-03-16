export interface UrlResult {
    url: string;
    label: string;
}

/**
 * Sends the user's transcript to the backend which uses the LLM to resolve
 * it to a concrete URL. Opens the URL in a new tab and returns the label
 * for use in TTS confirmation.
 */
export async function resolveAndOpenUrl(message: string): Promise<UrlResult | null> {
    try {
        const response = await fetch('http://localhost:3001/api/open-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            console.error('Open URL backend error:', response.statusText);
            return null;
        }

        const data: UrlResult = await response.json();

        if (data.url) {
            window.open(data.url, '_blank', 'noopener,noreferrer');
            return data;
        }

        return null;
    } catch (error) {
        console.error('resolveAndOpenUrl failed:', error);
        return null;
    }
}
