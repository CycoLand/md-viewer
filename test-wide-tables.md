The dominant pattern is **not JSON-RPC** for ordinary “send a prompt, receive an AI answer” APIs.

Most projects use:

```text
HTTP POST request
    +
streamed HTTP response
    ├── SSE
    └── NDJSON
```

JSON-RPC becomes more common when the product is an **interactive agent/session protocol**, especially one with server notifications, tool calls, cancellation, and bidirectional operations.

## What representative projects do

| Project/API | Request/response shape | Streaming transport | Best suited for |
|---|---|---|---|
| OpenAI Responses API | HTTP API | SSE; also WebSocket mode | Hosted model generation and agent responses |
| Anthropic Messages API | HTTP API | SSE | Hosted model generation and tool-use streaming |
| Gemini standard APIs | REST API | SSE | Hosted model generation |
| Gemini Live API | Session API | WebSocket | Bidirectional real-time audio/video/text |
| Ollama | REST API | NDJSON over HTTP | Local model serving |
| MCP | JSON-RPC protocol | stdio or Streamable HTTP/SSE | Tool/resource/session interoperability |
| LSP | JSON-RPC protocol | stdio or WebSocket-like transports | Long-lived interactive editor sessions |

## Hosted model APIs: REST plus SSE

### OpenAI

OpenAI’s standard streaming API is essentially:

```http
POST /v1/responses
```

with `stream: true`, followed by an SSE stream containing semantic events such as:

```text
response.created
response.output_item.added
response.output_text.delta
response.function_call_arguments.delta
response.completed
```

OpenAI also offers WebSocket mode for persistent sessions and incremental inputs, but the normal integration remains HTTP plus SSE.

Source: [OpenAI streaming responses](https://developers.openai.com/api/docs/guides/streaming-responses)
