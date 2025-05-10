'use client';
import AnimatedStack from '@/components/ui/AnimatedStack';
import ChoiceGrid from '@/components/ui/ChoiceGrid';
import TypewriterText from '@/components/ui/TypewriterText';

interface Question {
	id: string;
	text: string;
	choices: string[];
}

interface QuestionStackProps {
	question: Question;
	onChoice: (c: string) => void;
}

export default function QuestionStack({ question, onChoice }: QuestionStackProps) {
	return (
		<>
			<AnimatedStack identity={question.id}>
				<TypewriterText text={question.text} />

				<ChoiceGrid choices={question.choices} onPick={onChoice} />
			</AnimatedStack>
		</>
	);
}
