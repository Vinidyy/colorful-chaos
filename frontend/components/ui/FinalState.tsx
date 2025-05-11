import { useEffect, useState } from 'react';
import TypewriterText from '@/components/ui/TypewriterText';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import type { ReportData } from '@/types/report';
import { useChat } from '@ai-sdk/react';
import { Markdown } from '@/components/ui/Markdown';

type FinalStateProps = ReportData & {
	questions: Array<{
		id: string;
		title: string;
		questions: Array<{ id: string; text: string; choices: string[] }>;
	}>;
	answers: Array<{ id: string; questions: Array<{ id: string; answer: string | undefined }> }>;
};

export function FinalState(props: FinalStateProps) {
	const suggestions = props.suggestions.slice(0, 3);
	const subsidies = props.subsidies;
	const legalImplications = props.legalImplications;

	const [currentStep, setCurrentStep] = useState(0);
	const [subsidiesAnimated, setSubsidiesAnimated] = useState(0);
	const [legalAnimated, setLegalAnimated] = useState(0);

	// Create a context object to pass to the chat API
	const questionsAndAnswers = props.questions.map((section) => {
		const answerSection = props.answers.find((a) => a.id === section.id);
		return {
			sectionId: section.id,
			sectionTitle: section.title,
			questions: section.questions.map((q) => {
				const answerObj = answerSection?.questions.find((aq) => aq.id === q.id);
				return {
					questionId: q.id,
					question: q.text,
					answer: answerObj?.answer ?? null,
				};
			}),
		};
	});

	const reportContext = JSON.stringify({
		questionsAndAnswers,
		suggestions: suggestions.map((s) => ({ title: s.title, cost: s.cost })),
		subsidies: subsidies.map((s) => ({
			program: s.program,
			amount: s.amount,
			description: s.description,
		})),
		legalImplications: legalImplications.map((l) => ({
			title: l.title,
			description: l.description,
		})),
	});

	// Initialize chat with system message and context
	const { messages, input, handleInputChange, handleSubmit, status, error } = useChat({
		body: {
			reportContext, // This will be available in the API route
		},
	});

	// Sequential steps
	const handleTitleDone = () => setCurrentStep(1); // Show cards
	const handleLastCardDone = () => setCurrentStep(2); // Show subsidies title
	const handleSubsidiesDone = () => setCurrentStep(3); // Show subsidies content
	const handleLastSubsidyDone = () => setCurrentStep(4); // Show legal title
	const handleLegalTitleDone = () => setCurrentStep(5); // Show legal content
	const handleLastLegalDone = () => setCurrentStep(6); // Show next step
	const handleNextStepDone = () => setCurrentStep(7); // Show chat interface

	// Track animations completion
	useEffect(() => {
		if (subsidiesAnimated === subsidies.length) {
			handleLastSubsidyDone();
		}
	}, [subsidiesAnimated, subsidies.length]);

	useEffect(() => {
		if (legalAnimated === legalImplications.length) {
			handleLastLegalDone();
		}
	}, [legalAnimated, legalImplications.length]);

	useEffect(() => {
		console.log(status, error);
	}, [status, error]);

	return (
		<div
			className="mx-auto flex flex-col"
			style={{ minHeight: '100vh', gap: '32px', margin: '100px 0' }}
		>
			<div className="text-center">
				<div className="text-2xl font-semibold">
					<TypewriterText
						text="Your report is ready. Based on your answers, I recommend:"
						onComplete={handleTitleDone}
					/>
				</div>
			</div>

			<div className="-mx-16 grid grid-cols-1 gap-6 md:grid-cols-3">
				<AnimatePresence>
					{currentStep >= 1 &&
						suggestions.map((suggestion, index) => (
							<motion.div
								key={suggestion.title}
								initial={{ opacity: 0, y: -8 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								transition={{
									duration: 0.3,
									delay: index * 0.15,
								}}
								className={cn(
									'rounded-2xl bg-black/2.5 p-6',
									'flex flex-col items-center text-center'
								)}
								onAnimationComplete={() => {
									if (index === suggestions.length - 1) handleLastCardDone();
								}}
							>
								<img
									src={suggestion.icon + '.png'}
									alt={suggestion.title}
									className="mb-4 size-40"
								/>
								<h3 className="text-lg font-semibold">{suggestion.title}</h3>
								<p className="text-gray-600">{suggestion.cost}</p>
							</motion.div>
						))}
				</AnimatePresence>
			</div>

			{subsidies.length > 0 && currentStep >= 2 && (
				<div className="mt-12 flex w-full flex-col items-center gap-4 text-center">
					<TypewriterText
						text="Great news! I found some funding options:"
						onComplete={handleSubsidiesDone}
					/>
					<div className="flex w-full flex-col items-center gap-2">
						<AnimatePresence>
							{currentStep >= 3 &&
								subsidies.map((subsidy, index) => (
									<motion.div
										key={subsidy.program}
										initial={{ opacity: 0, y: -8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.3, delay: index * 0.15 }}
										className="mx-auto w-full max-w-2xl rounded-xl bg-white/90 p-6 text-left shadow"
										onAnimationComplete={() => {
											setSubsidiesAnimated((prev) => prev + 1);
										}}
									>
										<div className="text-lg font-semibold text-emerald-600">{subsidy.amount}</div>
										<div className="text-base font-semibold">{subsidy.program}</div>
										<div className="text-gray-600">{subsidy.description}</div>
									</motion.div>
								))}
						</AnimatePresence>
					</div>
				</div>
			)}

			{legalImplications.length > 0 && currentStep >= 4 && (
				<div className="mt-12 flex w-full flex-col items-center gap-4 text-center">
					<TypewriterText
						text="Legal implications you should know about:"
						onComplete={handleLegalTitleDone}
					/>
					<div className="flex w-full flex-col items-center gap-2">
						<AnimatePresence>
							{currentStep >= 5 &&
								legalImplications.map((item, index) => (
									<motion.div
										key={item.title}
										initial={{ opacity: 0, y: -8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.3, delay: index * 0.15 }}
										className="mx-auto w-full max-w-2xl rounded-xl bg-white/90 p-6 text-left shadow"
										onAnimationComplete={() => {
											setLegalAnimated((prev) => prev + 1);
										}}
									>
										<div className="text-base font-semibold">{item.title}</div>
										<div className="text-gray-600">{item.description}</div>
									</motion.div>
								))}
						</AnimatePresence>
					</div>
				</div>
			)}

			{/* Next step, only after all legal implications */}
			{legalImplications.length > 0 && currentStep >= 6 && (
				<div className="mt-12 text-center">
					<TypewriterText
						text={
							'Your next step: hire a Energie-Effizienz-Experte. I can help you find one near you.'
						}
						onComplete={handleNextStepDone}
					/>
				</div>
			)}

			{/* AI Chat interface */}
			{currentStep >= 7 && (
				<div className="mt-12 flex w-full flex-col items-center gap-4">
					{/* Display chat messages */}
					<div className="w-full max-w-2xl space-y-4">
						{messages.map((message) => (
							<div key={message.id} className="text-center">
								<div
									className={cn(
										'inline-flex flex-wrap text-center text-2xl font-medium',
										message.role === 'user' ? 'text-black/50' : ''
									)}
								>
									{message.role === 'user' ? (
										<span>{message.content}</span>
									) : (
										<Markdown>{message.content || ''}</Markdown>
									)}
								</div>
							</div>
						))}
					</div>

					{/* Loading indicator for chat */}
					{status === 'submitted' && (
						<div className="mx-auto w-full max-w-2xl animate-pulse py-2 text-center text-lg text-gray-400">
							Thinking…
						</div>
					)}

					{/* Chat input - only show when not loading */}
					{status === 'ready' && (
						<form onSubmit={handleSubmit} className="w-full max-w-2xl">
							<input
								value={input}
								onChange={handleInputChange}
								placeholder="Ask a follow-up question"
								className={cn(
									'w-full border-none bg-transparent px-4 py-2 text-center text-2xl font-medium outline-none',
									'opacity-50 placeholder:opacity-50 focus:ring-0'
								)}
							/>
						</form>
					)}
				</div>
			)}
		</div>
	);
}
