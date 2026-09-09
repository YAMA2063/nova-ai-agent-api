# NOVA architecture

```text
Phone (Expo)
   |
   v
API /agent/run
   |
   +--> Planner / model router
   |       |
   |       +--> OpenAI adapter
   |       +--> Anthropic adapter
   |
   +--> Tool registry
   |       +--> calculator
   |       +--> time
   |       +--> web research (OpenAI web_search)
   |
   +--> Memory service
   |
   +--> Response synthesis
```

The server owns provider credentials. The mobile app only knows the API base URL and a short-lived auth token once authentication is added.
