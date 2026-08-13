import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiFinishReason,
  AiProvider,
  AiStreamChunk,
  AiToolCallPart,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderConfig,
} from "../types/ai";
import {
  createId,
  emptyUsage,
  estimateCost,
  fetchJson,
  messageContentToText,
} from "../utils";
import { getModelRoute } from "../gateway/router";

type OpenAIChatResponse = {
  id?: string;
  choices?: Array<{
    finish_reason?: string;
    message?: {
      role?: string;
      content?: string | null;
      tool_calls?: Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function resolveConfig(config: ProviderConfig = {}): Required<ProviderConfig> {
  return {
    apiKey: config.apiKey ?? process.env.OPENAI_API_KEY ?? "",
    baseUrl:
      config.baseUrl ??
      process.env.OPENAI_BASE_URL ??
      "https://api.openai.com/v1",
    defaultHeaders: config.defaultHeaders ?? {},
  };
}

function mapFinishReason(reason?: string): AiFinishReason {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "tool_calls":
      return "tool_calls";
    case "content_filter":
      return "content_filter";
    default:
      return "unknown";
  }
}

function toOpenAIMessages(request: AiCompletionRequest) {
  return request.messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool",
        tool_call_id: message.toolCallId,
        content: messageContentToText(message.content),
      };
    }

    const toolCalls =
      typeof message.content === "string"
        ? []
        : message.content.filter(
            (part): part is AiToolCallPart => part.type === "tool_call",
          );

    if (toolCalls.length > 0) {
      return {
        role: "assistant",
        content: messageContentToText(message.content) || null,
        tool_calls: toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.name,
            arguments: JSON.stringify(call.arguments),
          },
        })),
      };
    }

    return {
      role: message.role === "assistant" ? "assistant" : message.role,
      content: messageContentToText(message.content),
    };
  });
}

function isGpt5Family(model: string) {
  return model.startsWith("gpt-5");
}

function buildBody(request: AiCompletionRequest) {
  const body: Record<string, unknown> = {
    model: request.model,
    messages: toOpenAIMessages(request),
  };

  if (request.maxTokens) {
    if (isGpt5Family(request.model)) {
      body.max_completion_tokens = request.maxTokens;
    } else {
      body.max_tokens = request.maxTokens;
    }
  }

  if (request.temperature !== undefined && !isGpt5Family(request.model)) {
    body.temperature = request.temperature;
  }

  if (request.tools?.length) {
    body.tools = request.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
    if (request.toolChoice) {
      if (typeof request.toolChoice === "string") {
        body.tool_choice = request.toolChoice;
      } else {
        body.tool_choice = {
          type: "function",
          function: { name: request.toolChoice.name },
        };
      }
    }
  }

  if (request.responseFormat === "json") {
    body.response_format = request.jsonSchema
      ? {
          type: "json_schema",
          json_schema: {
            name: "response",
            schema: request.jsonSchema,
            strict: true,
          },
        }
      : { type: "json_object" };
  }

  return body;
}

export function createOpenAIProvider(config: ProviderConfig = {}): AiProvider {
  const resolved = resolveConfig(config);

  return {
    id: "openai",

    async complete(request) {
      const started = Date.now();
      if (!resolved.apiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const data = await fetchJson<OpenAIChatResponse>(
        `${resolved.baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resolved.apiKey}`,
            "Content-Type": "application/json",
            ...resolved.defaultHeaders,
          },
          body: JSON.stringify(buildBody(request)),
        },
      );

      const choice = data.choices?.[0];
      const toolCalls: AiToolCallPart[] = (choice?.message?.tool_calls ?? []).map(
        (call) => ({
          type: "tool_call",
          id: call.id,
          name: call.function.name,
          arguments: safeParseArgs(call.function.arguments),
        }),
      );

      const usage = {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        totalTokens:
          data.usage?.total_tokens ??
          (data.usage?.prompt_tokens ?? 0) + (data.usage?.completion_tokens ?? 0),
      };

      const route = getModelRoute(request.model) ?? {
        id: request.model,
        provider: "openai" as const,
        model: request.model,
        capabilities: ["chat" as const],
        costPer1kInput: 0,
        costPer1kOutput: 0,
      };

      const response: AiCompletionResponse = {
        id: data.id ?? createId("openai"),
        provider: "openai",
        model: request.model,
        message: {
          role: "assistant",
          content:
            toolCalls.length > 0
              ? [
                  ...(choice?.message?.content
                    ? [{ type: "text" as const, text: choice.message.content }]
                    : []),
                  ...toolCalls,
                ]
              : (choice?.message?.content ?? ""),
        },
        toolCalls,
        finishReason: mapFinishReason(choice?.finish_reason),
        usage,
        cost: estimateCost(route, usage),
        latencyMs: Date.now() - started,
        raw: data,
      };

      return response;
    },

    async *stream(request): AsyncIterable<AiStreamChunk> {
      if (!resolved.apiKey) {
        yield { type: "error", error: "OPENAI_API_KEY is not configured" };
        return;
      }

      const started = Date.now();
      const response = await fetch(
        `${resolved.baseUrl.replace(/\/$/, "")}/chat/completions`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resolved.apiKey}`,
            "Content-Type": "application/json",
            ...resolved.defaultHeaders,
          },
          body: JSON.stringify({ ...buildBody(request), stream: true }),
        },
      );

      if (!response.ok || !response.body) {
        const text = await response.text();
        yield {
          type: "error",
          error: `HTTP ${response.status}: ${text.slice(0, 800)}`,
        };
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let text = "";
      const toolCalls = new Map<
        number,
        { id: string; name: string; arguments: string }
      >();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: Array<{
                delta?: {
                  content?: string;
                  tool_calls?: Array<{
                    index: number;
                    id?: string;
                    function?: { name?: string; arguments?: string };
                  }>;
                };
                finish_reason?: string;
              }>;
            };
            const delta = json.choices?.[0]?.delta;
            if (delta?.content) {
              text += delta.content;
              yield { type: "text_delta", text: delta.content };
            }
            for (const call of delta?.tool_calls ?? []) {
              const current = toolCalls.get(call.index) ?? {
                id: call.id ?? createId("tool"),
                name: "",
                arguments: "",
              };
              if (call.id) current.id = call.id;
              if (call.function?.name) current.name += call.function.name;
              if (call.function?.arguments) {
                current.arguments += call.function.arguments;
                yield {
                  type: "tool_call_delta",
                  id: current.id,
                  name: current.name || undefined,
                  argumentsDelta: call.function.arguments,
                };
              }
              toolCalls.set(call.index, current);
            }
          } catch {
            // ignore malformed SSE chunks
          }
        }
      }

      const mappedToolCalls: AiToolCallPart[] = [...toolCalls.values()].map(
        (call) => ({
          type: "tool_call",
          id: call.id,
          name: call.name,
          arguments: safeParseArgs(call.arguments),
        }),
      );

      const usage = emptyUsage();
      const route = getModelRoute(request.model);
      const cost = route
        ? estimateCost(route, usage)
        : {
            currency: "USD" as const,
            inputCost: 0,
            outputCost: 0,
            totalCost: 0,
          };

      const finalResponse: AiCompletionResponse = {
        id: createId("openai"),
        provider: "openai",
        model: request.model,
        message: {
          role: "assistant",
          content:
            mappedToolCalls.length > 0
              ? [
                  ...(text ? [{ type: "text" as const, text }] : []),
                  ...mappedToolCalls,
                ]
              : text,
        },
        toolCalls: mappedToolCalls,
        finishReason: mappedToolCalls.length > 0 ? "tool_calls" : "stop",
        usage,
        cost,
        latencyMs: Date.now() - started,
      };

      yield { type: "usage", usage, cost };
      yield {
        type: "done",
        finishReason: finalResponse.finishReason,
        response: finalResponse,
      };
    },

    async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
      const started = Date.now();
      if (!resolved.apiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const data = await fetchJson<{
        data?: Array<{ embedding: number[] }>;
        usage?: { prompt_tokens?: number; total_tokens?: number };
      }>(`${resolved.baseUrl.replace(/\/$/, "")}/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resolved.apiKey}`,
          "Content-Type": "application/json",
          ...resolved.defaultHeaders,
        },
        body: JSON.stringify({
          model: request.model,
          input: request.input,
        }),
      });

      const usage = {
        inputTokens: data.usage?.prompt_tokens ?? data.usage?.total_tokens ?? 0,
        outputTokens: 0,
        totalTokens: data.usage?.total_tokens ?? data.usage?.prompt_tokens ?? 0,
      };
      const route = getModelRoute(request.model);

      return {
        provider: "openai",
        model: request.model,
        embeddings: (data.data ?? []).map((item) => item.embedding),
        usage,
        cost: route
          ? estimateCost(route, usage)
          : { currency: "USD", inputCost: 0, outputCost: 0, totalCost: 0 },
        latencyMs: Date.now() - started,
      };
    },
  };
}

function safeParseArgs(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // fall through
  }
  return { raw: value };
}
