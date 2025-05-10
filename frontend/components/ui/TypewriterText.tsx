'use client';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function TypewriterText({
	text,
	onComplete,
	className,
}: {
	text: string;
	onComplete?: () => void;
	className?: string;
}) {
	const words = text.split(' ');
	const container = {
		show: { transition: { staggerChildren: 0.12 } },
	};
	const word = { hidden: { opacity: 0 }, show: { opacity: 1 } };

	return (
		<h1 className={cn('inline-flex flex-wrap text-center text-2xl font-medium', className)}>
			<motion.span
				variants={container}
				initial="hidden"
				animate="show"
				onAnimationComplete={onComplete}
			>
				{words.map((w, i) => (
					<motion.span key={i} variants={word} className="mr-1 whitespace-pre">
						{w + ' '}
					</motion.span>
				))}
			</motion.span>
		</h1>
	);
}
