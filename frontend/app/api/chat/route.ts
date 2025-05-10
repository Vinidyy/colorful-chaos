import { openrouter } from "@openrouter/ai-sdk-provider";
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openrouter('gpt-4.1-nano'),
    messages,
  });

  return result.toDataStreamResponse();
}