import { NextRequest, NextResponse } from 'next/server';
import { logLLMCall } from '@/lib/datadog';

// ── Configuration ─────────────────────────────────────────────────────────────
const BEDROCK_API_KEY = process.env.BEDROCK_API_KEY || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.minimax.minimax-text-01';

// Bedrock Runtime endpoint for the Converse API
const BEDROCK_ENDPOINT = `https://bedrock-runtime.${AWS_REGION}.amazonaws.com`;

// ── Helper: Sign request with Bedrock API Key ─────────────────────────────────
async function bedrockFetch(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BEDROCK_API_KEY}`,
      'X-Amz-Content-Sha256': 'UNSIGNED-PAYLOAD',
    },
    body: JSON.stringify(body),
  });
  return response;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const {
      systemPrompt,
      userMessage,
      maxTokens = 500,
      temperature = 0.3,
      tools,
      action = 'chat',
    } = body;

    if (!BEDROCK_API_KEY) {
      return NextResponse.json(
        { error: 'BEDROCK_API_KEY not configured in .env' },
        { status: 500 },
      );
    }

    // ── Build Converse API payload (model-agnostic) ─────────────────────────
    const conversePayload: Record<string, unknown> = {
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens,
        temperature,
      },
    };

    // Add system prompt
    if (systemPrompt) {
      conversePayload.system = [{ text: systemPrompt }];
    }

    // Add tools if provided (Converse API tool format)
    if (tools && tools.length > 0) {
      conversePayload.toolConfig = {
        tools: tools.map((t: any) => ({
          toolSpec: {
            name: t.function?.name || t.name,
            description: t.function?.description || t.description,
            inputSchema: {
              json: t.function?.parameters || t.input_schema || {},
            },
          },
        })),
      };
    }

    // ── Call Bedrock Converse API ────────────────────────────────────────────
    const converseUrl = `${BEDROCK_ENDPOINT}/model/${encodeURIComponent(MODEL_ID)}/converse`;
    console.log(`🔑 Calling Bedrock Converse API: ${converseUrl}`);
    console.log(`📤 Model: ${MODEL_ID}, Region: ${AWS_REGION}`);

    const response = await bedrockFetch(converseUrl, conversePayload);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Bedrock API error (${response.status}):`, errorText);

      // If Converse fails, try InvokeModel as fallback
      console.log('🔄 Trying InvokeModel fallback...');
      const invokePayload = buildInvokeModelPayload(systemPrompt, userMessage, maxTokens, temperature);
      const invokeUrl = `${BEDROCK_ENDPOINT}/model/${encodeURIComponent(MODEL_ID)}/invoke`;
      const invokeResponse = await bedrockFetch(invokeUrl, invokePayload);

      if (!invokeResponse.ok) {
        const invokeError = await invokeResponse.text();
        console.error(`❌ InvokeModel fallback also failed (${invokeResponse.status}):`, invokeError);
        throw new Error(`Bedrock API error: ${response.status} - ${errorText}`);
      }

      // Parse InvokeModel response
      const invokeBody = await invokeResponse.json();
      const latencyMs = Date.now() - startTime;
      const textContent = extractTextFromInvokeResponse(invokeBody);

      logLLMCall({
        action,
        model: MODEL_ID,
        latencyMs,
        status: 'success',
        inputPreview: userMessage?.slice(0, 200),
        outputPreview: textContent?.slice(0, 200),
      });

      return NextResponse.json({
        content: textContent,
        latencyMs,
        model: MODEL_ID,
      });
    }

    // ── Parse Converse API response ─────────────────────────────────────────
    const responseBody = await response.json();
    const latencyMs = Date.now() - startTime;

    // Extract text content from Converse response
    const outputContent = responseBody.output?.message?.content || [];
    const textContent = outputContent
      .filter((b: any) => b.text)
      .map((b: any) => b.text)
      .join('');

    // Extract tool use blocks
    const toolUseBlocks = outputContent.filter((b: any) => b.toolUse);

    // Log observability data
    logLLMCall({
      action,
      model: MODEL_ID,
      promptTokens: responseBody.usage?.inputTokens,
      completionTokens: responseBody.usage?.outputTokens,
      latencyMs,
      status: 'success',
      inputPreview: userMessage?.slice(0, 200),
      outputPreview: textContent?.slice(0, 200),
    });

    console.log(`✅ Bedrock response (${MODEL_ID}, ${latencyMs}ms)`);

    // Return unified response format
    return NextResponse.json({
      content: textContent,
      toolCalls: toolUseBlocks.length > 0
        ? toolUseBlocks.map((tc: any) => ({
            name: tc.toolUse.name,
            arguments: tc.toolUse.input,
          }))
        : undefined,
      usage: responseBody.usage,
      latencyMs,
      model: MODEL_ID,
      stopReason: responseBody.stopReason,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    logLLMCall({
      action: 'chat',
      model: MODEL_ID,
      latencyMs,
      status: 'error',
      error: errorMsg,
    });

    console.error('Bedrock API error:', error);
    return NextResponse.json(
      { error: `Bedrock API error: ${errorMsg}` },
      { status: 500 },
    );
  }
}

// ── Fallback: Build InvokeModel payload ─────────────────────────────────────
function buildInvokeModelPayload(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  temperature: number,
): Record<string, unknown> {
  // Try OpenAI-compatible format (works with many Bedrock models)
  return {
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      { role: 'user', content: userMessage },
    ],
    max_tokens: maxTokens,
    temperature,
  };
}

// ── Extract text from InvokeModel response ──────────────────────────────────
function extractTextFromInvokeResponse(body: any): string {
  // Handle various response formats
  if (body.content && Array.isArray(body.content)) {
    return body.content
      .filter((b: any) => b.type === 'text' || b.text)
      .map((b: any) => b.text)
      .join('');
  }
  if (body.choices && body.choices[0]) {
    return body.choices[0].message?.content || body.choices[0].text || '';
  }
  if (body.generation) {
    return body.generation;
  }
  if (body.outputs && body.outputs[0]) {
    return body.outputs[0].text || '';
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body);
}
