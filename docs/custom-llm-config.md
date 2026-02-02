---
summary: "Configure OpenClaw with custom LLM endpoints using just an address and API key (no account authorization required)"
read_when:
  - You want to use your own LLM service endpoint
  - You need to configure local or privately deployed models
  - You want to avoid using cloud provider accounts
title: "Custom LLM Configuration"
---

# Custom LLM Configuration

OpenClaw fully supports configuration with custom LLM addresses and API keys, **without requiring any additional account authorization**. You can use any service endpoint compatible with OpenAI or Anthropic APIs.

## Quick Start

### Minimal Configuration Example

Add to `openclaw.json` or `~/.openclaw/<agent-id>/models.json`:

```json5
{
  models: {
    mode: "merge", // "merge" keeps built-in providers, "replace" uses only custom
    providers: {
      "my-custom": {
        baseUrl: "https://api.your-provider.com/v1",
        apiKey: "sk-your-api-key-here",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Your Model Name",
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "my-custom/your-model-id" },
    },
  },
}
```

### Configuration Fields

**Required fields**:

- `baseUrl`: Complete LLM service URL (usually ends with `/v1`)
- `apiKey`: API key (or use `"${ENV_VAR}"` to reference environment variable)
- `models`: List of model definitions with at least `id` and `name`

**Optional fields**:

- `api`: API type (default `"openai-completions"`)
  - `"openai-completions"` - OpenAI Completions API
  - `"openai-responses"` - OpenAI Chat/Responses API
  - `"anthropic-messages"` - Anthropic Messages API
  - `"google-generative-ai"` - Google Generative AI
  - `"github-copilot"` - GitHub Copilot API
  - `"bedrock-converse-stream"` - AWS Bedrock
- `auth`: Authentication mode (default `"api-key"`)
- `headers`: Custom HTTP headers (for special authentication needs)

**Model definition optional fields**:

- `reasoning`: Whether it's a reasoning model (default `false`)
- `input`: Supported input types (default `["text"]`, optional `["text", "image"]`)
- `cost`: Cost configuration (default all `0`)
- `contextWindow`: Context window size (default `200000`)
- `maxTokens`: Maximum output tokens (default `8192`)

## Common Scenarios

### 1. Local LM Studio

LM Studio is the recommended local LLM runtime:

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
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
    },
  },
}
```

**Setup steps**:

1. Install LM Studio: https://lmstudio.ai
2. Download and load a model (MiniMax M2.1 full version recommended)
3. Start the local server in LM Studio
4. Use the above config to connect to `http://127.0.0.1:1234/v1`

### 2. Ollama Local Models

Ollama provides simple local model management:

```bash
# Install Ollama
# https://ollama.ai

# Pull a model
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/llama3.3" },
    },
  },
}
```

Ollama is automatically detected when running at `http://127.0.0.1:11434/v1`, no extra configuration needed.

### 3. vLLM Server

Deploy your own models with vLLM:

```json5
{
  models: {
    mode: "merge",
    providers: {
      vllm: {
        baseUrl: "http://your-server:8000/v1",
        apiKey: "sk-your-key",
        api: "openai-responses",
        models: [
          {
            id: "your-model",
            name: "Your Model",
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "vllm/your-model" },
    },
  },
}
```

### 4. Private Cloud LLM Service

Enterprise private deployment:

```json5
{
  models: {
    mode: "replace", // Use only custom providers, no cloud services
    providers: {
      enterprise: {
        baseUrl: "https://internal-llm.company.com/v1",
        apiKey: "${ENTERPRISE_LLM_KEY}", // Read from environment variable
        api: "openai-completions",
        headers: {
          "X-Custom-Header": "value", // Custom auth header
        },
        models: [
          {
            id: "company-model-v1",
            name: "Company Model V1",
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "enterprise/company-model-v1" },
    },
  },
}
```

### 5. Hybrid Config: Local Primary + Cloud Backup

```json5
{
  models: {
    mode: "merge", // Keep cloud services as backup
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local",
        api: "openai-responses",
        models: [
          {
            id: "local-model",
            name: "Local Model",
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "local/local-model",
        fallbacks: ["anthropic/claude-sonnet-4-5"], // Use cloud when local fails
      },
    },
  },
}
```

## Environment Variable Configuration

### Using Environment Variables for Keys

**Recommended approach**: Use `"${ENV_VAR}"` syntax in config:

```json5
{
  models: {
    providers: {
      custom: {
        baseUrl: "https://api.custom.com/v1",
        apiKey: "${MY_CUSTOM_API_KEY}", // Read from environment
        models: [
          /* ... */
        ],
      },
    },
  },
}
```

Then set in your environment:

```bash
# Linux/macOS
export MY_CUSTOM_API_KEY="sk-your-key"

# Or add to ~/.profile
echo 'export MY_CUSTOM_API_KEY="sk-your-key"' >> ~/.profile
source ~/.profile
```

### Direct Configuration (Testing Only)

```json5
{
  env: {
    MY_CUSTOM_API_KEY: "sk-your-key",
  },
  models: {
    providers: {
      custom: {
        baseUrl: "https://api.custom.com/v1",
        apiKey: "${MY_CUSTOM_API_KEY}",
        models: [
          /* ... */
        ],
      },
    },
  },
}
```

**Note**: Never commit real API keys to version control.

## CLI Commands

### List Available Models

```bash
openclaw models list
```

### Set Primary Model

```bash
openclaw models set custom/your-model-id
```

### Configuration Management

```bash
# Set configuration value
openclaw config set models.mode merge

# View current configuration
openclaw config get models

# Open configuration file
openclaw config edit
```

## Validate Configuration

### Test Connection

```bash
# Test if custom endpoint is accessible
curl http://127.0.0.1:1234/v1/models

# Or
curl https://api.your-provider.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

### Send Test Message

```bash
openclaw message send "Hello, this is a test message"
```

## Troubleshooting

### Connection Issues

**Symptom**: Cannot connect to LLM service

**Checklist**:

1. Confirm service endpoint is running: `curl http://127.0.0.1:1234/v1/models`
2. Check firewall settings
3. Verify `baseUrl` is correct (note port and path)
4. For HTTPS endpoints, ensure certificate is valid

### Authentication Issues

**Symptom**: 401 or 403 errors

**Checklist**:

1. Verify API key is correct
2. Check environment variable is set: `echo $MY_CUSTOM_API_KEY`
3. Confirm key format matches provider requirements
4. Check if custom `headers` are needed

### Model ID Mismatch

**Symptom**: Model not found error

**Solutions**:

1. Check service endpoint's supported models list
2. Ensure config `id` matches actual model ID
3. For LM Studio, ensure model is loaded

### Context Window Error

**Symptom**: Context exceeds limit

**Solutions**:

1. Lower `contextWindow` value in config
2. Or increase server's context limit
3. Enable conversation compaction

## Security Recommendations

1. **Don't hardcode keys in config**: Use environment variables
2. **Use HTTPS**: Avoid HTTP in production
3. **Limit access**: Only allow trusted clients to access LLM service
4. **Rotate keys regularly**: Update API keys periodically
5. **Local models**: For sensitive data, prefer local deployment

## Additional Resources

- [Model Providers Overview](/concepts/model-providers)
- [Local Models Guide](/gateway/local-models)
- [Ollama Configuration](/providers/ollama)
- [Configuration Examples](/gateway/configuration-examples)
- [Environment Variables](/environment)

## FAQ

### Q: Can I use multiple custom providers simultaneously?

**A**: Yes! Add multiple entries in `models.providers`:

```json5
{
  models: {
    providers: {
      provider1: {
        /* ... */
      },
      provider2: {
        /* ... */
      },
      provider3: {
        /* ... */
      },
    },
  },
}
```

### Q: How to completely disable cloud service providers?

**A**: Use `mode: "replace"` instead of `mode: "merge"`:

```json5
{
  models: {
    mode: "replace", // Use only custom providers
    providers: {
      local: {
        /* ... */
      },
    },
  },
}
```

### Q: Which API formats are supported?

**A**: OpenClaw supports multiple API formats:

- OpenAI Completions API (`openai-completions`)
- OpenAI Responses API (`openai-responses`)
- Anthropic Messages API (`anthropic-messages`)
- Google Generative AI (`google-generative-ai`)
- GitHub Copilot API (`github-copilot`)
- AWS Bedrock (`bedrock-converse-stream`)

Most self-hosted LLM services are compatible with OpenAI API format.

### Q: Do I need to configure a proxy?

**A**: OpenClaw follows standard HTTP(S) proxy environment variables:

```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1
```

### Q: How to verify configuration is correct?

**A**: Use these commands:

```bash
# List all available models (should include your custom model)
openclaw models list

# Send test message
openclaw message send "test"

# Check gateway logs
tail -f /tmp/openclaw-gateway.log
```
