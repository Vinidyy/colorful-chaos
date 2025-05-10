'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import HomeModelCanvas from '@/components/ui/HomeModelCanvas';
import QuestionStack from '@/components/ui/QuestionStack';
import AnimatedStack from '@/components/ui/AnimatedStack';
import { Button } from '@/components/ui/button';
import questionsData from './questions.json';
import TypewriterText from '@/components/ui/TypewriterText';
import { FinalState } from '@/components/ui/FinalState';

interface Question {
	id: string;
	text: string;
	choices: string[];
}
interface Section {
	id: string;
	title: string;
	questions: Question[];
}

export default function Home() {
	const [step, setStep] = useState<'intro' | 'questions' | 'done'>('intro');
	const [reportData, setReportData] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sectionIdx, setSectionIdx] = useState(0);
	const [questionIdx, setQuestionIdx] = useState(0);

	const sections: Section[] = questionsData.sections;
	const section = sections[sectionIdx];
	const question = section.questions[questionIdx];

	const [answers, setAnswers] = useState(() =>
		sections.map((section) => ({
			id: section.id,
			questions: section.questions.map((q) => ({
				id: q.id,
				answer: undefined as string | undefined,
			})),
		}))
	);

	function recordAnswer(answer: string) {
		setAnswers((prev) =>
			prev.map((s, si) =>
				si === sectionIdx
					? {
							...s,
							questions: s.questions.map((q, qi) => (qi === questionIdx ? { ...q, answer } : q)),
						}
					: s
			)
		);
		next();
	}

	function next() {
		if (questionIdx < section.questions.length - 1) {
			setQuestionIdx((q) => q + 1);
		} else if (sectionIdx < sections.length - 1) {
			setSectionIdx((s) => s + 1);
			setQuestionIdx(0);
		} else {
			// Set loading state and transition to done state before fetching
			setLoading(true);
			setStep('done');
			// Use setTimeout to ensure the state changes are applied before fetching
			setTimeout(() => {
				fetchReport();
			}, 10);
		}
	}

	async function fetchReport() {
		// Loading state is already set in the next() function
		try {
			// Format the answers into a single question string for the API
			const formattedAnswers = answers
				.flatMap((section) =>
					section.questions
						.filter((q) => q.answer) // Only include answered questions
						.map((q) => `Question ${section.id}${q.id}: ${q.answer}`)
				)
				.join('\n');

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
				throw new Error(`API call failed with status: ${response.status}`);
			}

			const data = await response.json();
			const parsed = typeof data.answer === 'string' ? JSON.parse(data.answer) : data.answer;
			setReportData(parsed);
			console.log('parsed', parsed);
			setStep('done');
		} catch (error) {
			console.error('Error fetching report:', error);
			setError('Failed to fetch report. Please try again.');
			setStep('done');
		} finally {
			setLoading(false);
		}
	}

	const fade = { hidden: { opacity: 0 }, show: { opacity: 1 } };

	return (
		<main className="bg-background flex min-h-screen flex-col items-center justify-center">
			<div style={{ maxWidth: '60ch' }}>
				<AnimatePresence mode="wait">
					{step === 'intro' ? (
						<motion.div
							key="intro"
							variants={fade}
							initial="hidden"
							animate="show"
							exit="hidden"
							className="w-full"
						>
							<AnimatedStack identity="intro">
								<HomeModelCanvas />
								<TypewriterText text="Homely helps you instantly ⚡️ save energy, 📊 cut costs, and 💶 unlock subsidies." />
								<Button variant="primary" onClick={() => setStep('questions')}>
									Get started
								</Button>
							</AnimatedStack>
						</motion.div>
					) : step === 'questions' ? (
						<motion.div
							key="questions"
							variants={fade}
							initial="hidden"
							animate="show"
							exit="hidden"
							className="px-4"
						>
							<QuestionStack question={question} onChoice={recordAnswer} />
						</motion.div>
					) : (
						(console.log('render FinalState with', reportData),
						(
							<motion.div
								key="done"
								variants={fade}
								initial="hidden"
								animate="show"
								exit="hidden"
								className="py-12"
							>
								{loading ? (
									<div className="text-center">
										<p className="text-xl">Generating your personalized report...</p>
									</div>
								) : error ? (
									<div className="text-center">
										<p className="text-xl text-red-500">{error}</p>
										<button
											className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
											onClick={() => fetchReport()}
										>
											Try Again
										</button>
									</div>
								) : reportData ? (
									<FinalState {...reportData} />
								) : (
									<div className="text-center">
										<p className="text-xl text-red-500">
											Unable to load report data. Please try again.
										</p>
										<button
											className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
											onClick={() => fetchReport()}
										>
											Try Again
										</button>
									</div>
								)}
							</motion.div>
						))
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}
