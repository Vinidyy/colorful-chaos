import { ReactNode, useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'motion';

interface VerticalStackProps {
	/** Changing this will trigger a fade-out of old children and fade-in of new children */
	identity: string | number;
	children: ReactNode[];
	className?: string;
	/** Fade duration in ms for each child */
	duration?: number;
	/** Stagger delay in ms between children */
	staggerMs?: number;
}

/**
 * VerticalStack animates its direct children out/in with a staggered fade when identity changes.
 */
export function VerticalStack({
	identity,
	children,
	className = '',
	duration = 800,
	staggerMs = 100,
}: VerticalStackProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [displayedChildren, setDisplayedChildren] = useState(children);
	const [isAnimating, setIsAnimating] = useState(false);
	const prevIdentity = useRef(identity);

	useEffect(() => {
		if (identity !== prevIdentity.current) {
			setIsAnimating(true);
			// Fade out old children
			const nodes = containerRef.current?.children;
			if (nodes && nodes.length) {
				animate(
					'.vertical-stack-item' as any,
					{ opacity: [1, 0] },
					{
						duration: duration / 1000,
						delay: stagger(staggerMs / 1000),
						easing: 'cubic-bezier(0.4,0,0.2,1)',
						scope: containerRef.current!,
						onComplete: () => {
							setTimeout(() => {
								setDisplayedChildren(children);
								prevIdentity.current = identity;
							}, 300);
						},
					}
				);
			} else {
				setDisplayedChildren(children);
				prevIdentity.current = identity;
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [identity]);

	// Animate in new children
	useEffect(() => {
		if (!isAnimating) return;
		const nodes = containerRef.current?.children;
		if (nodes && nodes.length) {
			animate(
				'.vertical-stack-item' as any,
				{ opacity: [0, 1] },
				{
					duration: duration / 1000,
					delay: stagger(staggerMs / 1000),
					easing: 'cubic-bezier(0.4,0,0.2,1)',
					scope: containerRef.current!,
					onComplete: () => setIsAnimating(false),
				}
			);
		} else {
			setIsAnimating(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [displayedChildren]);

	return (
		<div
			ref={containerRef}
			className={`flex flex-col items-center justify-center gap-6 ${className}`}
		>
			{displayedChildren.map((child, i) => (
				<div key={i} className="vertical-stack-item">
					{child}
				</div>
			))}
		</div>
	);
}
