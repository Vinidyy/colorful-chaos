import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

interface MessagePart {
	type: string;
	text: string;
}

interface ChatMessage {
	role: string;
	content?: string;
	parts?: MessagePart[];
	id?: string;
}

export async function POST(req: Request) {
	const requestData = await req.json();
	const { messages, reportContext } = requestData;

	// Normalize all messages to ensure they have the correct format
	const normalizedMessages: any[] = messages
		.map((message: ChatMessage) => {
			// Skip system messages for now, we'll add our own
			if (message.role === 'system') return null;

			// Handle messages that might have parts instead of content
			if (message.parts && !message.content) {
				return {
					role: message.role,
					content: message.parts.map((part: MessagePart) => part.text).join(' '),
				};
			}

			// Return messages that already have content
			return {
				role: message.role,
				content: message.content || '',
			};
		})
		.filter(Boolean); // Remove null values

	// Parse the report context if available
	let reportData = null;
	if (reportContext) {
		try {
			reportData = JSON.parse(reportContext);
		} catch (e) {
			console.error('Failed to parse report context:', e);
		}
	}

	// Create a detailed system prompt with the report data
	let systemPrompt = `You are Homely, an energy efficiency advisor helping users save energy, cut costs, and access subsidies.
	Your goal is to provide helpful advice and detailed information about recommended energy-saving measures,
	available subsidies, and legal requirements related to home energy efficiency.
	Keep your responses informative, accurate, and tailored to the user's specific questions about their energy report. Keep answers very short and succinct.`;

	// Add report data to the system prompt if available
	if (reportData) {
		systemPrompt += `\n\nBased on your analysis, you have provided the following recommendations:\n`;

		if (reportData.recommendations && reportData.recommendations.length > 0) {
			reportData.recommendations.forEach((rec: any) => {
				systemPrompt += `- ${rec.title}: ${rec.cost}\n`;
			});
		}

		if (reportData.subsidies && reportData.subsidies.length > 0) {
			systemPrompt += `\nAvailable subsidies:\n`;
			reportData.subsidies.forEach((subsidy: any) => {
				systemPrompt += `- ${subsidy.program}: ${subsidy.amount} - ${subsidy.description}\n`;
			});
		}

		if (reportData.legalImplications && reportData.legalImplications.length > 0) {
			systemPrompt += `\nLegal implications:\n`;
			reportData.legalImplications.forEach((legal: any) => {
				systemPrompt += `- ${legal.title}: ${legal.description}\n`;
			});
		}
	}

	normalizedMessages.unshift({
		role: 'system',
		content: systemPrompt,
	});

	try {
		const result = streamText({
			model: openai.responses('gpt-4o'),
			messages: normalizedMessages,
			tools: {
				web_search_preview: openai.tools.webSearchPreview({
					searchContextSize: 'high',
					userLocation: {
						type: 'approximate',
						city: 'Freiburg',
						region: 'Baden-Württemberg',
					},
				}),
			},
		});

		function getErrorMessage(error: unknown) {
			if (error == null) return 'Unbekannter Fehler';
			if (typeof error === 'string') return error;
			if (error instanceof Error) return error.message;
			return JSON.stringify(error);
		}

		return result.toDataStreamResponse({
			getErrorMessage,
		});
	} catch (error) {
		console.error('Error in chat API:', error);
		return new Response(JSON.stringify({ error: 'Failed to process chat request' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
