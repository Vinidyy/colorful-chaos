'use client';
import { Children, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
	identity: string | number;
	children: ReactNode;
	duration?: number; // ms
	staggerMs?: number; // ms between elements
}

export default function AnimatedStack({
	identity,
	children,
	duration = 400,
	staggerMs = 60,
}: Props) {
	const items = Children.toArray(children);

	const container = {
		show: {
			transition: { staggerChildren: staggerMs / 1000 },
		},
	};

	const item = {
		hidden: { opacity: 0, y: 8 },
		show: { opacity: 1, y: 0, transition: { duration: duration / 1000 } },
		exit: { opacity: 0, transition: { duration: duration / 1000 } },
	};

	return (
		<AnimatePresence mode="wait">
			<motion.div
				key={identity}
				variants={container}
				initial="hidden"
				animate="show"
				exit="hidden"
				className="flex w-full flex-col items-center gap-6"
			>
				{items.map((child, i) => (
					<motion.div key={i} variants={item} className="max-w-full">
						{child}
					</motion.div>
				))}
			</motion.div>
		</AnimatePresence>
	);
}
