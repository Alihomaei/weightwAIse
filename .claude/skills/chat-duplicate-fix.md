# Chat Duplicate Message Bug

## Problem
Assistant responses appear as TWO identical bubbles in the chat.

## Root Cause
In `frontend/src/hooks/useChat.ts`, the `onDone` SSE callback does this:

```typescript
onDone: () => {
    setStreamingMessage((prev) => {
        if (prev && prev.content) {
            const finalMessage = { ...prev... };
            setMessages((msgs) => [...msgs, finalMessage]);  // ← SIDE EFFECT!
        }
        return null;
    });
}
```

React 18 Strict Mode (enabled by Next.js in dev) calls state updater functions **TWICE with the same `prev` value** to detect impure side effects. So `setMessages` runs twice → message added twice.

## Fix
NEVER put `setMessages` inside another state updater. Use a ref to capture the streaming content, then update both states separately:

```typescript
onDone: () => {
    const prev = streamingMessageRef.current;
    if (prev && prev.content) {
        const finalMessage: ChatMessage = {
            id: generateId(),
            session_id: sid,
            role: 'assistant',
            content: prev.content,
            citations: prev.citations,
            extracted_fields: prev.extracted_fields,
            model_used: prev.model_used,
            language,
            created_at: new Date().toISOString(),
        };
        setMessages((msgs) => [...msgs, finalMessage]);
    }
    setStreamingMessage(null);
    setStreaming(false);
},
```

And keep a ref in sync with streamingMessage:
```typescript
const streamingMessageRef = useRef<StreamingMessage | null>(null);

// In onToken callback, also update the ref:
onToken: (token: string) => {
    setStreamingMessage((prev) => {
        const next = prev ? { ...prev, content: prev.content + token } : null;
        streamingMessageRef.current = next;
        return next;
    });
},
```

## Files
- `frontend/src/hooks/useChat.ts` — onDone callback and streamingMessage ref

## Rule
NEVER call one setState inside another setState's updater function. React Strict Mode will execute the updater twice, causing the side effect to run twice.
