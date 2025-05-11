'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import TreeLoadingAnimation from '@/components/ui/TreeLoadingAnimation';
import HomeModelCanvas from '@/components/ui/HomeModelCanvas';
import QuestionStack from '@/components/ui/QuestionStack';
import TypewriterText from '@/components/ui/TypewriterText';
import { Button } from '@/components/ui/button';
import AnimatedStack from '@/components/ui/AnimatedStack';
import { FinalState } from '@/components/ui/FinalState';
import questionsData from './questions.json';
import { fetchReportFromAnswers } from './actions';

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
				handleFetchReport();
			}, 10);
		}
	}

	async function handleFetchReport() {
		try {
			setError(null);
			setReportData(null);
			setLoading(true);
			const { data, error: fetchError } = await fetchReportFromAnswers(answers);

			if (fetchError || !data) {
				setError(fetchError || 'Failed to fetch report data');
			} else {
				setReportData(data);
			}
		} catch (error) {
			console.error('Error handling report:', error);
			setError('Failed to process report data');
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
								<TypewriterText
									text="Homely helps you instantly save energy, cut costs, and unlock subsidies."
									className="text-4xl"
								/>
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
							className="w-full"
						>
							<QuestionStack question={question} onChoice={recordAnswer} />
						</motion.div>
					) : (
						<motion.div
							key="done"
							variants={fade}
							initial="hidden"
							animate="show"
							exit="hidden"
							className="py-12"
						>
							{/* Tree animation is always present but controls its visibility based on loading state */}
							<TreeLoadingAnimation isLoading={loading} />

							{/* Show content only when not loading */}
							{!loading &&
								(error ? (
									<div className="text-center">
										<p className="text-xl text-red-500">{error}</p>
										<button
											className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
											onClick={() => handleFetchReport()}
										>
											Try Again
										</button>
									</div>
								) : reportData ? (
									<FinalState {...reportData} questions={sections} answers={answers} />
								) : (
									<div className="text-center">
										<p className="text-xl text-red-500">
											Unable to load report data. Please try again.
										</p>
										<button
											className="bg-primary mt-4 rounded-md px-4 py-2 text-white"
											onClick={() => handleFetchReport()}
										>
											Try Again
										</button>
									</div>
								))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}
