export interface QuestionAnswer {
	id: string;
	answer: string | undefined;
}

export interface SectionAnswers {
	id: string;
	questions: QuestionAnswer[];
}

export interface Suggestion {
	title: string;
	cost: string;
	icon: string;
}

export interface Subsidy {
	program: string;
	amount: string;
	description: string;
}

export interface LegalImplication {
	title: string;
	description: string;
}

export interface ReportData {
	suggestions: Suggestion[];
	subsidies: Subsidy[];
	legalImplications: LegalImplication[];
}

export interface ApiResponse {
	data: ReportData | null;
	error: string | null;
}
