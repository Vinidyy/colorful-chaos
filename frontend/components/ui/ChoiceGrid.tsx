'use client';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function ChoiceGrid({
	choices,
	onPick,
	duration = 400,
	staggerMs = 40,
}: {
	choices: string[];
	onPick: (c: string) => void;
	duration?: number;
	staggerMs?: number;
}) {
	const container = {
		show: {
			transition: {
				delayChildren: 0.5,
				staggerChildren: staggerMs / 1000,
			},
		},
	};
	const item = {
		hidden: { opacity: 0, y: 12 },
		show: { opacity: 1, y: 0, transition: { duration: duration / 1000 } },
		exit: { opacity: 0, transition: { duration: duration / 1000 } },
	};

	return (
		<motion.div
			variants={container}
			style={{
				gap: '1rem',
				display: 'flex',
				flexDirection: 'row',
				flexWrap: 'wrap',
				justifyContent: 'center',
			}}
		>
			{choices.map((c, i) => (
				<motion.div key={i} variants={item}>
					<Button size="lg" onClick={() => onPick(c)}>
						{c}
					</Button>
				</motion.div>
			))}
		</motion.div>
	);
}
