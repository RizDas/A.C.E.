export interface IntentAction {
    type: 'web' | 'app';
    target: string;
    label: string;
}

/**
 * Module-level store: label (lowercased) → WindowProxy
 * Persists across re-renders so we can close tabs later.
 */
const openedWindows = new Map<string, Window>();

/** Returns the labels ACE currently has tracked as open. */
export function getOpenTabLabels(): string[] {
    // Prune any tabs the user closed manually
    for (const [label, win] of openedWindows.entries()) {
        if (win.closed) openedWindows.delete(label);
    }
    return Array.from(openedWindows.keys());
}

/**
 * Calls /api/open-intent, opens ALL resolved web URLs in new tabs,
 * and returns the combined list of apps/sites for TTS confirmation.
 */
export async function resolveAndOpenIntents(message: string, history: any[] = []): Promise<IntentAction[]> {
    try {
        const response = await fetch('http://localhost:3001/api/open-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history }),
        });

        if (!response.ok) {
            console.error('Open Intent backend error:', response.statusText);
            return [];
        }

        const data: { actions: IntentAction[] } = await response.json();
        const opened: IntentAction[] = [];

        for (const item of data.actions ?? []) {
            if (item.type === 'web' && item.target) {
                const win = window.open(item.target, '_blank', 'noopener,noreferrer');
                if (win) {
                    openedWindows.set(item.label.toLowerCase(), win);
                }
                opened.push(item);
            } else if (item.type === 'app') {
                // App was already launched by the backend, just acknowledge it
                opened.push(item);
            }
        }

        return opened;
    } catch (error) {
        console.error('resolveAndOpenIntents failed:', error);
        return [];
    }
}

/**
 * Calls /api/close-tab with the current open labels,
 * closes whichever windows the LLM identifies, returns closed labels.
 */
export async function resolveAndCloseTabs(message: string): Promise<string[]> {
    const currentLabels = getOpenTabLabels();

    if (currentLabels.length === 0) return [];

    try {
        const response = await fetch('http://localhost:3001/api/close-tab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, openLabels: currentLabels }),
        });

        if (!response.ok) return [];

        const data: { labels: string[] } = await response.json();
        const closed: string[] = [];

        for (const label of data.labels ?? []) {
            const key = label.toLowerCase();
            // Try exact match first, then partial match
            const matchedKey = openedWindows.has(key)
                ? key
                : Array.from(openedWindows.keys()).find(k => k.includes(key) || key.includes(k));

            if (matchedKey) {
                const win = openedWindows.get(matchedKey);
                if (win && !win.closed) {
                    win.close();
                    closed.push(matchedKey);
                }
                openedWindows.delete(matchedKey);
            }
        }

        return closed;
    } catch (error) {
        console.error('resolveAndCloseTabs failed:', error);
        return [];
    }
}
