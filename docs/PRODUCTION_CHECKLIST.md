# Production checklist

- Replace in-memory memory with Postgres + pgvector.
- Add authentication and per-user authorization to every endpoint.
- Add encrypted secret storage and API key rotation.
- Add request rate limits and spend ceilings.
- Add confirmation UI before side-effecting tools.
- Add streaming SSE for token-by-token responses.
- Add speech-to-text and text-to-speech with platform-native permissions.
- Add push notifications / background jobs for scheduled tasks.
- Add audit logging for tools.
- Build Android with EAS and test on at least two physical devices.
