import { cancel as clackCancel, isCancel, select, text } from "@clack/prompts";
import type { ModelApi, ModelProviderConfig } from "../../config/types.models.js";
import type { RuntimeEnv } from "../../runtime.js";
import { normalizeProviderId } from "../../agents/model-selection.js";
import { loadConfig } from "../../config/config.js";
import { logConfigUpdated } from "../../config/logging.js";
import { stylePromptHint, stylePromptMessage } from "../../terminal/prompt-style.js";
import { updateConfig } from "./shared.js";

const SUPPORTED_APIS: Array<{ value: ModelApi; label: string; hint?: string }> = [
  {
    value: "openai-completions",
    label: "OpenAI Completions API",
    hint: "Most compatible with local/custom endpoints",
  },
  {
    value: "openai-responses",
    label: "OpenAI Responses API",
    hint: "Recommended for LM Studio, supports reasoning separation",
  },
  {
    value: "anthropic-messages",
    label: "Anthropic Messages API",
    hint: "For Anthropic-compatible endpoints",
  },
  {
    value: "google-generative-ai",
    label: "Google Generative AI",
    hint: "For Gemini-compatible endpoints",
  },
  {
    value: "github-copilot",
    label: "GitHub Copilot API",
    hint: "For GitHub Copilot proxies",
  },
  {
    value: "bedrock-converse-stream",
    label: "AWS Bedrock",
    hint: "For Bedrock-compatible endpoints",
  },
];

const COMMON_PRESETS: Array<{
  value: string;
  label: string;
  hint?: string;
  config: Partial<ModelProviderConfig> & { baseUrl: string };
}> = [
  {
    value: "lmstudio",
    label: "LM Studio (local)",
    hint: "Default LM Studio configuration",
    config: {
      baseUrl: "http://127.0.0.1:1234/v1",
      apiKey: "lmstudio",
      api: "openai-responses",
    },
  },
  {
    value: "ollama",
    label: "Ollama (local)",
    hint: "Default Ollama configuration",
    config: {
      baseUrl: "http://127.0.0.1:11434/v1",
      apiKey: "ollama",
      api: "openai-completions",
    },
  },
  {
    value: "vllm",
    label: "vLLM",
    hint: "Custom vLLM server",
    config: {
      baseUrl: "http://localhost:8000/v1",
      apiKey: "vllm",
      api: "openai-responses",
    },
  },
  {
    value: "custom",
    label: "Custom endpoint",
    hint: "Manual configuration",
    config: {
      baseUrl: "",
      apiKey: "",
      api: "openai-completions",
    },
  },
];

/**
 * Interactive command to add a custom LLM provider
 */
export async function modelsAddCustomProviderCommand(
  opts: {
    provider?: string;
    baseUrl?: string;
    apiKey?: string;
    api?: string;
    modelId?: string;
    modelName?: string;
    preset?: string;
    yes?: boolean;
  },
  runtime: RuntimeEnv,
) {
  if (!process.stdin.isTTY && !opts.yes) {
    throw new Error("add-custom-provider requires an interactive TTY or --yes mode.");
  }

  let providerName = opts.provider?.trim();
  let baseUrl = opts.baseUrl?.trim();
  let apiKey = opts.apiKey?.trim();
  let api = opts.api?.trim() as ModelApi | undefined;
  let modelId = opts.modelId?.trim();
  let modelName = opts.modelName?.trim();

  // Interactive mode
  if (!opts.yes && process.stdin.isTTY) {
    // Step 1: Choose preset or custom
    const presetChoice = await select({
      message: stylePromptMessage("Choose a configuration preset"),
      options: COMMON_PRESETS.map((preset) => ({
        value: preset.value,
        label: preset.label,
        hint: preset.hint ? stylePromptHint(preset.hint) : undefined,
      })),
    });

    if (isCancel(presetChoice)) {
      clackCancel("Operation cancelled.");
      process.exit(0);
    }

    const preset = COMMON_PRESETS.find((p) => p.value === presetChoice);
    if (!preset) {
      throw new Error(`Unknown preset: ${String(presetChoice)}`);
    }

    // Apply preset defaults
    if (!providerName) {
      providerName = preset.value === "custom" ? "" : preset.value;
    }
    if (!baseUrl && preset.config.baseUrl) {
      baseUrl = preset.config.baseUrl;
    }
    if (!apiKey && preset.config.apiKey) {
      apiKey = preset.config.apiKey;
    }
    if (!api && preset.config.api) {
      api = preset.config.api;
    }

    // Step 2: Provider name
    if (!providerName) {
      const providerInput = await text({
        message: stylePromptMessage("Provider name"),
        placeholder: "my-custom-provider",
        validate: (value) => {
          if (!value || String(value).trim().length === 0) {
            return "Provider name is required";
          }
          return undefined;
        },
      });

      if (isCancel(providerInput)) {
        clackCancel("Operation cancelled.");
        process.exit(0);
      }

      providerName = String(providerInput).trim();
    }

    // Step 3: Base URL
    if (!baseUrl || preset.value === "custom") {
      const baseUrlInput = await text({
        message: stylePromptMessage("Base URL"),
        placeholder: "http://localhost:8000/v1",
        initialValue: baseUrl || "http://localhost:8000/v1",
        validate: (value) => {
          if (!value || String(value).trim().length === 0) {
            return "Base URL is required";
          }
          const url = String(value).trim();
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return "Base URL must start with http:// or https://";
          }
          return undefined;
        },
      });

      if (isCancel(baseUrlInput)) {
        clackCancel("Operation cancelled.");
        process.exit(0);
      }

      baseUrl = String(baseUrlInput).trim();
    }

    // Step 4: API Key
    if (!apiKey || preset.value === "custom") {
      const apiKeyInput = await text({
        message: stylePromptMessage("API Key (or environment variable like ${MY_API_KEY})"),
        placeholder: "sk-your-api-key or ${ENV_VAR}",
        initialValue: apiKey || "",
        validate: (value) => {
          if (!value || String(value).trim().length === 0) {
            return "API Key is required (use a placeholder for testing)";
          }
          return undefined;
        },
      });

      if (isCancel(apiKeyInput)) {
        clackCancel("Operation cancelled.");
        process.exit(0);
      }

      apiKey = String(apiKeyInput).trim();
    }

    // Step 5: API Type
    if (!api || preset.value === "custom") {
      const apiTypeChoice = await select({
        message: stylePromptMessage("API Type"),
        options: SUPPORTED_APIS.map((apiOpt) => ({
          value: apiOpt.value,
          label: apiOpt.label,
          hint: apiOpt.hint ? stylePromptHint(apiOpt.hint) : undefined,
        })),
        initialValue: api || "openai-completions",
      });

      if (isCancel(apiTypeChoice)) {
        clackCancel("Operation cancelled.");
        process.exit(0);
      }

      api = String(apiTypeChoice) as ModelApi;
    }

    // Step 6: Model ID
    if (!modelId) {
      const modelIdInput = await text({
        message: stylePromptMessage("Model ID (as returned by the provider)"),
        placeholder: "model-name-v1",
        validate: (value) => {
          if (!value || String(value).trim().length === 0) {
            return "Model ID is required";
          }
          return undefined;
        },
      });

      if (isCancel(modelIdInput)) {
        clackCancel("Operation cancelled.");
        process.exit(0);
      }

      modelId = String(modelIdInput).trim();
    }

    // Step 7: Model Name (optional, defaults to model ID)
    if (!modelName) {
      const modelNameInput = await text({
        message: stylePromptMessage("Model Display Name (optional)"),
        placeholder: modelId,
        initialValue: "",
      });

      if (isCancel(modelNameInput)) {
        clackCancel("Operation cancelled.");
        process.exit(0);
      }

      const nameInput = String(modelNameInput).trim();
      modelName = nameInput.length > 0 ? nameInput : modelId;
    }
  }

  // Validate required fields
  if (!providerName) {
    throw new Error("Provider name is required (use --provider)");
  }
  if (!baseUrl) {
    throw new Error("Base URL is required (use --base-url)");
  }
  if (!apiKey) {
    throw new Error("API Key is required (use --api-key)");
  }
  if (!modelId) {
    throw new Error("Model ID is required (use --model-id)");
  }

  // Normalize provider name
  const normalizedProvider = normalizeProviderId(providerName);

  // Default values
  api = api || "openai-completions";
  modelName = modelName || modelId;

  // Check if provider already exists
  const currentConfig = loadConfig();
  const existingProvider = currentConfig.models?.providers?.[normalizedProvider];

  if (existingProvider && !opts.yes) {
    runtime.log(`Warning: Provider "${normalizedProvider}" already exists and will be updated.`);
  }

  // Build provider config
  const providerConfig: ModelProviderConfig = {
    baseUrl,
    apiKey,
    api,
    models: [
      {
        id: modelId,
        name: modelName,
        reasoning: false,
        input: ["text"],
        cost: {
          input: 0,
          output: 0,
          cacheRead: 0,
          cacheWrite: 0,
        },
        contextWindow: 200000,
        maxTokens: 8192,
      },
    ],
  };

  // Update config
  await updateConfig((config) => {
    // Ensure models.providers exists
    if (!config.models) {
      config.models = {};
    }
    if (!config.models.providers) {
      config.models.providers = {};
    }

    // Set mode to merge if not already set
    if (!config.models.mode) {
      config.models.mode = "merge";
    }

    // Add or update provider
    config.models.providers[normalizedProvider] = providerConfig;

    return config;
  });

  logConfigUpdated(runtime);
  runtime.log(`✓ Added custom provider: ${normalizedProvider}`);
  runtime.log(`  Base URL: ${baseUrl}`);
  runtime.log(`  API Type: ${api}`);
  runtime.log(`  Model: ${normalizedProvider}/${modelId}`);
  runtime.log("");
  runtime.log("Next steps:");
  runtime.log(`  1. Verify configuration: openclaw models list --provider ${normalizedProvider}`);
  runtime.log(`  2. Set as primary model: openclaw models set ${normalizedProvider}/${modelId}`);
  runtime.log(`  3. Test with a message: openclaw message send "Hello"`);
}
