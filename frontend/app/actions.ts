'use server';

import type { SectionAnswers, ReportData, ApiResponse } from '@/types/report';

export async function fetchReportFromAnswers(answers: SectionAnswers[]): Promise<ApiResponse> {
	try {
		// Validate input
		if (!answers || !Array.isArray(answers) || answers.length === 0) {
			return { data: null, error: 'Invalid answers format' };
		}

		// Format the answers into a single question string for the API
		const formattedAnswers = answers
			.flatMap((section) =>
				section.questions
					.filter((q) => q.answer) // Only include answered questions
					.map((q) => `Question ${section.id}${q.id}: ${q.answer}`)
			)
			.join('\n');

		if (!formattedAnswers) {
			return { data: null, error: 'No answers provided' };
		}

		// Call the API with the formatted answers
		const response = await fetch('http://192.168.1.158:8000/chat/json', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				question: formattedAnswers,
			}),
		});

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}

		const responseData = await response.json();

		// The API returns stringified JSON, so we need to parse it
		let parsedData: unknown;
		try {
			parsedData =
				typeof responseData.answer === 'string'
					? JSON.parse(responseData.answer)
					: responseData.answer;
		} catch (parseError) {
			console.error('Error parsing response:', parseError);
			return { data: null, error: 'Invalid JSON response from API' };
		}

		// Validate the response data structure
		if (!parsedData || typeof parsedData !== 'object') {
			return { data: null, error: 'Invalid response format from API' };
		}

		// Type guard to validate the response structure
		const isValidReportData = (data: unknown): data is ReportData => {
			if (!data || typeof data !== 'object') return false;
			const d = data as any;
			return (
				Array.isArray(d.suggestions) &&
				Array.isArray(d.subsidies) &&
				Array.isArray(d.legalImplications)
			);
		};

		if (!isValidReportData(parsedData)) {
			return { data: null, error: 'Invalid report data structure' };
		}

		return { data: parsedData, error: null };
	} catch (err) {
		console.error('Error fetching report:', err);
		return {
			data: null,
			error: err instanceof Error ? err.message : 'Failed to fetch report data',
		};
	}
}
