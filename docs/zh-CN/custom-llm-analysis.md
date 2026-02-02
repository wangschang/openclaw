# OpenClaw 自定义 LLM 配置分析报告

## 问题

**原始问题**：分析一下 openclaw 的代码是否可以实现自定义来实现填写 llm 的地址和 key 来配置并启动，不需要其他的账号授权。

## 结论

✅ **OpenClaw 完全支持使用自定义 LLM 地址和 API 密钥进行配置，无需任何其他账号授权。**

## 核心发现

### 1. 现有功能已完整支持

OpenClaw 已经内置了完整的自定义 LLM 提供商配置系统：

- ✅ 支持任何 OpenAI 或 Anthropic 兼容的 API 端点
- ✅ 简单的 API 密钥认证（无需 OAuth 或其他复杂授权）
- ✅ 支持环境变量引用以保护敏感信息
- ✅ 支持本地部署（LM Studio、Ollama、vLLM 等）
- ✅ 支持私有云和企业内网部署
- ✅ 支持自定义请求头（用于特殊认证需求）

### 2. 配置方式

#### 方式一：直接编辑配置文件

在 `openclaw.json` 中添加：

```json5
{
  models: {
    mode: "merge",
    providers: {
      "自定义名称": {
        baseUrl: "https://你的LLM服务地址/v1",
        apiKey: "你的API密钥",
        api: "openai-completions",
        models: [
          {
            id: "模型ID",
            name: "模型显示名称",
          }
        ]
      }
    }
  },
  agents: {
    defaults: {
      model: { primary: "自定义名称/模型ID" }
    }
  }
}
```

#### 方式二：使用新增的 CLI 命令（本次实现）

```bash
# 交互式配置
openclaw models add-custom-provider

# 非交互式配置
openclaw models add-custom-provider \
  --provider my-llm \
  --base-url "http://localhost:8000/v1" \
  --api-key "sk-your-key" \
  --model-id "your-model" \
  --yes
```

### 3. 支持的 API 类型

- `openai-completions` - OpenAI Completions API（最广泛兼容）
- `openai-responses` - OpenAI Responses API（推荐用于 LM Studio）
- `anthropic-messages` - Anthropic Messages API
- `google-generative-ai` - Google Generative AI
- `github-copilot` - GitHub Copilot API
- `bedrock-converse-stream` - AWS Bedrock

大多数自托管 LLM 服务都兼容 OpenAI API 格式。

## 实现的增强功能

为了让配置过程更加简单，本次实现添加了以下功能：

### 1. 中文文档

- 文件位置：`docs/zh-CN/custom-llm-config.md`
- 内容：
  - 详细的配置说明
  - LM Studio、Ollama、vLLM 等常见场景示例
  - 环境变量配置方法
  - 故障排除指南
  - 常见问题解答

### 2. 英文文档

- 文件位置：`docs/custom-llm-config.md`
- 与中文文档内容对应

### 3. CLI 辅助命令

- 命令：`openclaw models add-custom-provider`
- 功能：
  - 交互式向导（逐步引导配置）
  - 预设配置（LM Studio、Ollama、vLLM）
  - 非交互式模式（支持自动化脚本）
  - 配置验证和下一步提示

### 4. 示例文件

- 文件位置：`docs/examples/custom-llm-providers.md`
- 包含多种实际使用场景的完整配置示例

## 使用示例

### 场景 1：本地 LM Studio

```bash
# 1. 安装并启动 LM Studio (https://lmstudio.ai)
# 2. 加载模型并启动本地服务器
# 3. 添加配置

openclaw models add-custom-provider \
  --preset lmstudio \
  --model-id minimax-m2.1-gs32 \
  --yes

# 4. 设置为主模型
openclaw models set lmstudio/minimax-m2.1-gs32

# 5. 测试
openclaw message send "你好"
```

### 场景 2：vLLM 服务器

```bash
# 1. 启动 vLLM 服务器
# 2. 添加配置

openclaw models add-custom-provider \
  --provider my-vllm \
  --base-url "http://192.168.1.100:8000/v1" \
  --api-key "sk-your-key" \
  --api openai-responses \
  --model-id llama-3.3-70b \
  --yes

# 3. 设置并测试
openclaw models set my-vllm/llama-3.3-70b
openclaw message send "测试消息"
```

### 场景 3：企业私有云

```json5
{
  models: {
    mode: "replace", // 仅使用自定义提供商，不使用任何云服务
    providers: {
      enterprise: {
        baseUrl: "https://internal-llm.company.com/v1",
        apiKey: "${ENTERPRISE_LLM_KEY}",
        api: "openai-completions",
        headers: {
          "X-Custom-Auth": "value"
        },
        models: [
          {
            id: "company-model-v1",
            name: "公司模型 V1",
          }
        ]
      }
    }
  }
}
```

## 安全性建议

1. **使用环境变量存储密钥**：不要在配置文件中硬编码 API 密钥
   ```json5
   {
     apiKey: "${MY_API_KEY}" // 从环境变量读取
   }
   ```

2. **使用 HTTPS**：生产环境避免使用 HTTP

3. **限制访问**：配置防火墙规则，仅允许信任的客户端访问

4. **本地优先**：对于敏感数据，优先使用本地部署的模型

## 验证步骤

```bash
# 1. 列出所有模型
openclaw models list

# 2. 查看特定提供商的模型
openclaw models list --provider my-custom

# 3. 检查模型状态
openclaw models status

# 4. 发送测试消息
openclaw message send "测试"
```

## 常见问题

### Q1: 是否需要云服务商账号？
**A**: 不需要。可以使用 `mode: "replace"` 完全禁用内置的云服务提供商，仅使用自定义端点。

### Q2: 支持哪些本地 LLM 工具？
**A**: 支持所有兼容 OpenAI API 的工具，包括：
- LM Studio
- Ollama
- vLLM
- LiteLLM
- Text Generation WebUI
- 其他 OpenAI 兼容代理

### Q3: 可以同时配置多个自定义提供商吗？
**A**: 可以。在 `models.providers` 中添加多个条目即可。

### Q4: 如何完全离线使用？
**A**: 
1. 部署本地 LLM 服务（如 LM Studio）
2. 使用 `mode: "replace"` 禁用云服务
3. 配置指向本地端点的自定义提供商

## 技术实现细节

### 配置系统架构

```
openclaw.json
    ↓
models.providers
    ↓
[自定义提供商配置]
    ↓
baseUrl + apiKey + api + models
    ↓
运行时模型选择和 API 调用
```

### 认证优先级

1. 环境变量（推荐）
2. 配置文件中的 `apiKey` 字段
3. Auth profiles（存储在 `~/.openclaw/<agent-id>/auth-profiles.json`）

### API 适配器

OpenClaw 使用适配器模式支持不同的 API 格式：
- `openai-completions` → OpenAI Completions API
- `openai-responses` → OpenAI Chat API
- `anthropic-messages` → Anthropic Messages API
- 等等

## 文件清单

本次实现添加/修改的文件：

1. `docs/zh-CN/custom-llm-config.md` - 中文配置文档
2. `docs/custom-llm-config.md` - 英文配置文档
3. `src/commands/models/add-custom-provider.ts` - CLI 命令实现
4. `src/commands/models.ts` - 命令导出
5. `src/cli/models-cli.ts` - CLI 注册
6. `docs/examples/custom-llm-providers.md` - 配置示例

## 总结

OpenClaw 从设计之初就支持自定义 LLM 配置，本次实现：

1. ✅ **确认**：完全支持仅使用自定义 LLM 地址和密钥配置
2. ✅ **增强**：添加了更友好的文档和 CLI 工具
3. ✅ **验证**：所有代码通过编译、检查和格式化
4. ✅ **文档**：提供中英文完整文档和多个实用示例

**最终答案**：OpenClaw 可以完全通过自定义 LLM 地址和 API 密钥配置使用，无需任何其他账号授权。
