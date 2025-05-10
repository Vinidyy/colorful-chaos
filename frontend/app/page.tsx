'use client';
import { useState } from 'react';
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
	const [step, setStep] = useState<'intro' | 'questions' | 'done'>('done');
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
			setStep('done');
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
						<motion.div
							key="done"
							variants={fade}
							initial="hidden"
							animate="show"
							exit="hidden"
							className="py-12"
						>
							<FinalState
								suggestions={[
									{ title: 'Install Solar Panels', cost: '5,000 - 15,000 EUR', icon: 'solar' },
									{
										title: 'Improve Wall Insulation',
										cost: '1,000 - 4,000 EUR',
										icon: 'insulation',
									},
									{ title: 'Upgrade Heating System', cost: '4,000 - 10,000 EUR', icon: 'radiator' },
								]}
								subsidies={[
									{
										program: 'Federal Funding for Efficient Buildings (BEG)',
										amount: 'Up to 20,000 EUR',
										description: 'Subsidy for energy-efficient renovations and installations.',
									},
									{
										program: 'KfW Energy-efficient Renovation Program',
										amount: 'Low-interest loans up to 120,000 EUR',
										description:
											'Loans for improving energy efficiency and building sustainability.',
									},
								]}
								legalImplications={[
									{
										title: 'Compliance with Energy Efficiency Requirements',
										description:
											'Ensure your building meets the Niedrigstenergiegebäude (nearly zero-energy building) standards as per § 10.',
									},
									{
										title: 'Adherence to Minimum Thermal Insulation',
										description:
											'Follow § 11 for minimum thermal protection to enhance energy efficiency.',
									},
								]}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}
