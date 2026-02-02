# Custom LLM Provider Examples

This file contains example configurations for adding custom LLM providers to OpenClaw.

## Example 1: Local LM Studio

```json5
{
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1 GS32",
          }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" }
    }
  }
}
```

## Example 2: Using CLI Command

```bash
# Interactive mode
openclaw models add-custom-provider

# Non-interactive mode
openclaw models add-custom-provider \
  --provider lmstudio \
  --base-url "http://127.0.0.1:1234/v1" \
  --api-key "lmstudio" \
  --api openai-responses \
  --model-id minimax-m2.1-gs32 \
  --model-name "MiniMax M2.1" \
  --yes
```

See the full documentation at [/docs/custom-llm-config.md](/docs/custom-llm-config.md).
