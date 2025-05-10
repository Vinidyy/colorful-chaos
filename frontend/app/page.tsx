'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import QuestionStack from '@/components/ui/QuestionStack';
import AnimatedStack from '@/components/ui/AnimatedStack';
import { Button } from '@/components/ui/button';
import questionsData from './questions.json';
import TypewriterText from '@/components/ui/TypewriterText';

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
	const [sectionIdx, setSectionIdx] = useState(0);
	const [questionIdx, setQuestionIdx] = useState(0);

	const sections: Section[] = questionsData.sections;
	const section = sections[sectionIdx];
	const question = section.questions[questionIdx];

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
								<Image
									src="/home.png"
									alt=""
									width={128}
									height={128}
									priority
									className="select-none"
								/>
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
							<QuestionStack question={question} onChoice={next} />
						</motion.div>
					) : (
						<motion.div
							key="done"
							variants={fade}
							initial="hidden"
							animate="show"
							exit="hidden"
							className="flex flex-col items-center justify-center py-24"
						>
							<h2 className="mb-4 text-2xl font-semibold">All done!</h2>
							<p className="text-center text-lg opacity-50">
								Thank you for answering the questions. Your personalized energy advice is being
								prepared.
							</p>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</main>
	);
}
