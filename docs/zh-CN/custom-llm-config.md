---
summary: "使用自定义 LLM 地址和密钥配置 OpenClaw（无需其他账号授权）"
read_when:
  - 你想使用自己的 LLM 服务端点
  - 你需要配置本地或私有部署的模型
  - 你想避免使用云服务商账号
title: "自定义 LLM 配置"
---

# 自定义 LLM 配置

OpenClaw 完全支持使用自定义 LLM 地址和 API 密钥进行配置，**无需任何其他账号授权**。你可以使用任何兼容 OpenAI 或 Anthropic API 的服务端点。

## 快速开始

### 最简配置示例

在 `openclaw.json` 或 `~/.openclaw/<agent-id>/models.json` 中添加：

```json5
{
  models: {
    mode: "merge",  // "merge" 保留内置提供商，"replace" 仅使用自定义提供商
    providers: {
      "my-custom": {
        baseUrl: "https://api.your-provider.com/v1",
        apiKey: "sk-your-api-key-here",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Your Model Name",
          }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: { primary: "my-custom/your-model-id" }
    }
  }
}
```

### 配置说明

**必需字段**：
- `baseUrl`: LLM 服务的完整 URL（通常以 `/v1` 结尾）
- `apiKey`: API 密钥（或使用 `"${ENV_VAR}"` 引用环境变量）
- `models`: 模型定义列表，至少包含 `id` 和 `name`

**可选字段**：
- `api`: API 类型（默认 `"openai-completions"`）
  - `"openai-completions"` - OpenAI Completions API
  - `"openai-responses"` - OpenAI Chat/Responses API
  - `"anthropic-messages"` - Anthropic Messages API
  - `"google-generative-ai"` - Google Generative AI
  - `"github-copilot"` - GitHub Copilot API
  - `"bedrock-converse-stream"` - AWS Bedrock
- `auth`: 认证模式（默认 `"api-key"`）
- `headers`: 自定义 HTTP 头（用于特殊认证需求）

**模型定义可选字段**：
- `reasoning`: 是否为推理模型（默认 `false`）
- `input`: 支持的输入类型（默认 `["text"]`，可选 `["text", "image"]`）
- `cost`: 成本配置（默认全为 `0`）
- `contextWindow`: 上下文窗口大小（默认 `200000`）
- `maxTokens`: 最大输出令牌数（默认 `8192`）

## 常见场景

### 1. 本地 LM Studio

LM Studio 是最推荐的本地 LLM 运行方案：

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

**设置步骤**：
1. 安装 LM Studio: https://lmstudio.ai
2. 下载并加载模型（推荐 MiniMax M2.1 完整版本）
3. 在 LM Studio 中启动本地服务器
4. 使用上述配置连接到 `http://127.0.0.1:1234/v1`

### 2. Ollama 本地模型

Ollama 提供简单的本地模型管理：

```bash
# 安装 Ollama
# https://ollama.ai

# 拉取模型
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/llama3.3" }
    }
  }
}
```

Ollama 在 `http://127.0.0.1:11434/v1` 运行时会自动检测，无需额外配置。

### 3. vLLM 服务器

使用 vLLM 部署自己的模型：

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
          }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: { primary: "vllm/your-model" }
    }
  }
}
```

### 4. 私有云 LLM 服务

企业私有部署的 LLM 服务：

```json5
{
  models: {
    mode: "replace",  // 仅使用自定义提供商，不使用任何云服务
    providers: {
      enterprise: {
        baseUrl: "https://internal-llm.company.com/v1",
        apiKey: "${ENTERPRISE_LLM_KEY}",  // 从环境变量读取
        api: "openai-completions",
        headers: {
          "X-Custom-Header": "value"  // 自定义认证头
        },
        models: [
          {
            id: "company-model-v1",
            name: "Company Model V1",
            contextWindow: 128000,
            maxTokens: 8192,
          }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: { primary: "enterprise/company-model-v1" }
    }
  }
}
```

### 5. 混合配置：本地主用 + 云端备用

```json5
{
  models: {
    mode: "merge",  // 保留云服务作为备用
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
          }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: {
        primary: "local/local-model",
        fallbacks: ["anthropic/claude-sonnet-4-5"]  // 本地失败时使用云服务
      }
    }
  }
}
```

## 环境变量配置

### 使用环境变量存储密钥

**推荐方式**：在配置中使用 `"${ENV_VAR}"` 语法：

```json5
{
  models: {
    providers: {
      custom: {
        baseUrl: "https://api.custom.com/v1",
        apiKey: "${MY_CUSTOM_API_KEY}",  // 从环境变量读取
        models: [/* ... */]
      }
    }
  }
}
```

然后在环境中设置：

```bash
# Linux/macOS
export MY_CUSTOM_API_KEY="sk-your-key"

# 或者在 ~/.profile 中添加
echo 'export MY_CUSTOM_API_KEY="sk-your-key"' >> ~/.profile
source ~/.profile
```

### 直接配置（仅用于测试）

```json5
{
  env: {
    MY_CUSTOM_API_KEY: "sk-your-key"
  },
  models: {
    providers: {
      custom: {
        baseUrl: "https://api.custom.com/v1",
        apiKey: "${MY_CUSTOM_API_KEY}",
        models: [/* ... */]
      }
    }
  }
}
```

**注意**：不要将真实的 API 密钥提交到版本控制系统。

## CLI 命令

### 查看可用模型

```bash
openclaw models list
```

### 设置主模型

```bash
openclaw models set custom/your-model-id
```

### 配置管理

```bash
# 设置配置项
openclaw config set models.mode merge

# 查看当前配置
openclaw config get models

# 打开配置文件
openclaw config edit
```

## 验证配置

### 测试连接

```bash
# 测试自定义端点是否可访问
curl http://127.0.0.1:1234/v1/models

# 或
curl https://api.your-provider.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

### 发送测试消息

```bash
openclaw message send "你好，这是一条测试消息"
```

## 故障排除

### 连接问题

**症状**：无法连接到 LLM 服务

**检查清单**：
1. 确认服务端点正在运行：`curl http://127.0.0.1:1234/v1/models`
2. 检查防火墙设置
3. 验证 `baseUrl` 是否正确（注意端口号和路径）
4. 对于 HTTPS 端点，确认证书有效

### 认证问题

**症状**：401 或 403 错误

**检查清单**：
1. 验证 API 密钥是否正确
2. 检查环境变量是否已设置：`echo $MY_CUSTOM_API_KEY`
3. 确认密钥格式与服务商要求一致
4. 查看是否需要自定义 `headers`

### 模型 ID 不匹配

**症状**：模型未找到错误

**解决方案**：
1. 检查服务端点支持的模型列表
2. 确认配置中的 `id` 与实际模型 ID 一致
3. 对于 LM Studio，确保模型已加载

### 上下文窗口错误

**症状**：上下文超出限制

**解决方案**：
1. 降低配置中的 `contextWindow` 值
2. 或者提高服务器的上下文限制
3. 启用对话压缩功能

## 安全建议

1. **不要在配置文件中硬编码密钥**：使用环境变量
2. **使用 HTTPS**：生产环境避免使用 HTTP
3. **限制访问**：仅允许信任的客户端访问 LLM 服务
4. **定期轮换密钥**：定期更新 API 密钥
5. **本地模型**：对于敏感数据，优先使用本地部署

## 更多资源

- [模型提供商概览](/concepts/model-providers)
- [本地模型指南](/gateway/local-models)
- [Ollama 配置](/providers/ollama)
- [配置示例](/gateway/configuration-examples)
- [环境变量](/environment)

## 常见问题

### Q: 可以同时使用多个自定义提供商吗？

**A**: 可以！在 `models.providers` 中添加多个条目：

```json5
{
  models: {
    providers: {
      "provider1": { /* ... */ },
      "provider2": { /* ... */ },
      "provider3": { /* ... */ }
    }
  }
}
```

### Q: 如何完全禁用云服务提供商？

**A**: 使用 `mode: "replace"` 而不是 `mode: "merge"`：

```json5
{
  models: {
    mode: "replace",  // 仅使用自定义提供商
    providers: {
      local: { /* ... */ }
    }
  }
}
```

### Q: 支持哪些 API 格式？

**A**: OpenClaw 支持多种 API 格式：
- OpenAI Completions API (`openai-completions`)
- OpenAI Responses API (`openai-responses`)
- Anthropic Messages API (`anthropic-messages`)
- Google Generative AI (`google-generative-ai`)
- GitHub Copilot API (`github-copilot`)
- AWS Bedrock (`bedrock-converse-stream`)

大多数自托管 LLM 服务都兼容 OpenAI API 格式。

### Q: 需要配置代理吗？

**A**: OpenClaw 遵循标准的 HTTP(S) 代理环境变量：

```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
export NO_PROXY=localhost,127.0.0.1
```

### Q: 如何验证配置是否正确？

**A**: 使用以下命令：

```bash
# 列出所有可用模型（应包含你的自定义模型）
openclaw models list

# 发送测试消息
openclaw message send "测试"

# 检查网关日志
tail -f /tmp/openclaw-gateway.log
```
