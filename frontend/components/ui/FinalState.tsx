import { useEffect, useState } from 'react';
import TypewriterText from '@/components/ui/TypewriterText';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface Suggestion {
	title: string;
	cost: string;
	icon: string;
}

interface Subsidy {
	program: string;
	amount: string;
	description: string;
}

interface LegalImplication {
	title: string;
	description: string;
}

interface FinalStateProps {
	suggestions: Suggestion[];
	subsidies: Subsidy[];
	legalImplications: LegalImplication[];
}

export function FinalState({ suggestions, subsidies, legalImplications }: FinalStateProps) {
	const [currentStep, setCurrentStep] = useState(0);
	const [subsidiesAnimated, setSubsidiesAnimated] = useState(0);
	const [legalAnimated, setLegalAnimated] = useState(0);

	// Sequential steps
	const handleTitleDone = () => setCurrentStep(1); // Show cards
	const handleLastCardDone = () => setCurrentStep(2); // Show subsidies title
	const handleSubsidiesDone = () => setCurrentStep(3); // Show subsidies content
	const handleLastSubsidyDone = () => setCurrentStep(4); // Show legal title
	const handleLegalTitleDone = () => setCurrentStep(5); // Show legal content
	const handleLastLegalDone = () => setCurrentStep(6); // Show next step

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

	return (
		<div className="mx-auto flex flex-col" style={{ minHeight: '100vh', gap: '32px' }}>
			<div className="text-center">
				<div className="text-2xl font-semibold">
					<TypewriterText
						text="Your report is ready. Based on your answers, I recommend:"
						onComplete={handleTitleDone}
					/>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
									className="mb-4 h-24 w-24"
								/>
								<h3 className="text-lg font-semibold">{suggestion.title}</h3>
								<p className="text-gray-600">{suggestion.cost}</p>
							</motion.div>
						))}
				</AnimatePresence>
			</div>

			{subsidies.length > 0 && currentStep >= 2 && (
				<div className="flex w-full flex-col items-center gap-4 text-center">
					<TypewriterText
						text="Great news! I found some funding options:"
						onComplete={handleSubsidiesDone}
						className="mb-6 text-xl font-semibold"
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
										className="mx-auto mb-6 w-full max-w-2xl rounded-xl bg-white/90 p-6 text-left shadow"
										onAnimationComplete={() => {
											setSubsidiesAnimated((prev) => prev + 1);
										}}
									>
										<div className="text-lg font-semibold text-emerald-600">{subsidy.amount}</div>
										<div className="mt-2 text-base font-semibold">{subsidy.program}</div>
										<div className="mt-2 text-gray-600">{subsidy.description}</div>
									</motion.div>
								))}
						</AnimatePresence>
					</div>
				</div>
			)}

			{legalImplications.length > 0 && currentStep >= 4 && (
				<div className="flex w-full flex-col items-center gap-4 text-center">
					<TypewriterText
						text="Legal implications you should know about:"
						onComplete={handleLegalTitleDone}
						className="mb-6 text-xl font-semibold"
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
										className="mx-auto mb-6 w-full max-w-2xl rounded-xl bg-white/90 p-6 text-left shadow"
										onAnimationComplete={() => {
											setLegalAnimated((prev) => prev + 1);
										}}
									>
										<div className="text-base font-semibold">{item.title}</div>
										<div className="mt-2 text-gray-600">{item.description}</div>
									</motion.div>
								))}
						</AnimatePresence>
					</div>
				</div>
			)}

			{/* Next step, only after all legal implications */}
			{legalImplications.length > 0 && currentStep >= 6 && (
				<div className="text-center">
					<TypewriterText
						text={
							'Your next step: hire a Energie-Effizienz-Experte. I can help you find one near you.'
						}
						className="text-xl font-semibold"
					/>
				</div>
			)}
		</div>
	);
}
