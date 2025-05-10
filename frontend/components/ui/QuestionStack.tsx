'use client';
import AnimatedStack from '@/components/ui/AnimatedStack';
import ChoiceGrid from '@/components/ui/ChoiceGrid';
import TypewriterText from '@/components/ui/TypewriterText';
import { motion } from 'motion/react';

interface Question {
	id: string;
	text: string;
	choices: string[];
}

interface QuestionStackProps {
	sectionTitle: string;
	question: Question;
	onChoice: (c: string) => void;
	newSection: boolean;
}

export default function QuestionStack({
	sectionTitle,
	question,
	onChoice,
	newSection,
}: QuestionStackProps) {
	return (
		<>
			<AnimatedStack identity={question.id}>
				<TypewriterText text={question.text} />

				<ChoiceGrid choices={question.choices} onPick={onChoice} />
			</AnimatedStack>
		</>
	);
}
