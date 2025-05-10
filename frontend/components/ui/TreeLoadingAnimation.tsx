'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TreeEmoji {
	id: number;
	x: number;
	y: number;
	emoji: string;
	scale: number;
	duration: number;
	sector: number; // To distribute trees more evenly
}

interface TreeLoadingAnimationProps {
	isLoading?: boolean;
}

export default function TreeLoadingAnimation({ isLoading = true }: TreeLoadingAnimationProps) {
	const [trees, setTrees] = useState<TreeEmoji[]>([]);
	const treeEmojis = ['🌲', '🌳', '🌴', '🌵', '🌱', '🌿', '☘️', '🍀'];
	const isMountedRef = useRef(true);
	const activeIntervalsRef = useRef<NodeJS.Timeout[]>([]);
	const [shouldExit, setShouldExit] = useState(false);

	// Track loading state changes
	useEffect(() => {
		console.log('TreeLoadingAnimation rendered, isLoading:', isLoading);
		console.log('Current trees:', trees.length);

		// Handle loading state changes
		if (!isLoading && trees.length > 0) {
			console.log('Loading finished, should animate out now');
			setShouldExit(true);
		} else if (isLoading) {
			// Reset exit flag when loading starts
			setShouldExit(false);
		}
	}, [isLoading]);

	// Clean up all intervals when component unmounts
	useEffect(() => {
		// Mark component as mounted
		isMountedRef.current = true;

		return () => {
			console.log('Unmounting TreeLoadingAnimation');
			isMountedRef.current = false;
			activeIntervalsRef.current.forEach((interval) => {
				console.log('Clearing interval', interval);
				clearInterval(interval);
			});
		};
	}, []);

	// Effect for generating and removing trees
	useEffect(() => {
		console.log('Tree generation effect, isLoading:', isLoading);

		// Clear any existing intervals
		activeIntervalsRef.current.forEach((interval) => {
			clearInterval(interval);
		});
		activeIntervalsRef.current = [];

		// If not loading, let the exit animations handle it
		if (!isLoading) {
			console.log('Not loading, exiting early');
			return;
		}

		// Immediately create a few trees to ensure something is visible
		// Add 5 trees right away for an immediate effect
		if (trees.length === 0 && isLoading) {
			const initialTrees: TreeEmoji[] = [];
			for (let i = 0; i < 5; i++) {
				const sector = i % 9; // Distribute initial trees across sectors
				const sectorX = sector % 3;
				const sectorY = Math.floor(sector / 3);

				// Calculate position within sector (with some randomness)
				const x = sectorX * 33 + Math.random() * 25;
				const y = sectorY * 33 + Math.random() * 25;

				initialTrees.push({
					id: Date.now() + i + Math.random(),
					x: x,
					y: y,
					emoji: treeEmojis[i % treeEmojis.length],
					scale: 0.7 + Math.random() * 0.8, // Slightly larger initial trees
					duration: 1 + Math.random(),
					sector: sector,
				});
			}
			setTrees(initialTrees);
		}

		console.log('Setting up tree creation interval');
		// Create new trees at random intervals
		const createInterval = setInterval(() => {
			if (!isMountedRef.current || !isLoading) {
				console.log('Skipping tree creation - not mounted or not loading');
				return;
			}

			// Create trees more eagerly at first
			const maxTrees = trees.length < 5 ? 15 : 25;

			console.log('Tree creation interval fired, current trees:', trees.length, 'max:', maxTrees);

			if (trees.length < maxTrees) {
				// Divide the screen into sectors to reduce overlapping
				const sector = Math.floor(Math.random() * 9); // 9 sectors (3x3 grid)
				const sectorX = sector % 3;
				const sectorY = Math.floor(sector / 3);

				// Calculate position within sector (with some randomness)
				const x = sectorX * 33 + Math.random() * 25; // 33% width per sector with 25% random variation
				const y = sectorY * 33 + Math.random() * 25; // 33% height per sector with 25% random variation

				const newTree: TreeEmoji = {
					id: Date.now() + Math.random(),
					x: x,
					y: y,
					emoji: treeEmojis[Math.floor(Math.random() * treeEmojis.length)],
					scale: 0.5 + Math.random() * 1, // reduced maximum scale (0.5-1.5 instead of 0.5-2.5)
					duration: 0.8 + Math.random() * 2, // animation duration
					sector: sector,
				};

				console.log('Adding new tree');
				setTrees((prev) => [...prev, newTree]);
			}
		}, 200); // Faster creation (200ms instead of 250ms)

		// Remove trees after they've been displayed
		const removeInterval = setInterval(() => {
			if (!isMountedRef.current) return;

			setTrees((prev) => {
				if (prev.length > 0) {
					const newTrees = [...prev];
					newTrees.shift(); // remove the oldest tree
					return newTrees;
				}
				return prev;
			});
		}, 400);

		// Save intervals for cleanup
		activeIntervalsRef.current.push(createInterval, removeInterval);

		return () => {
			clearInterval(createInterval);
			clearInterval(removeInterval);
			activeIntervalsRef.current = activeIntervalsRef.current.filter(
				(id) => id !== createInterval && id !== removeInterval
			);
		};
	}, [isLoading, trees.length, treeEmojis]);

	// Effect to handle when loading stops - make trees exit
	useEffect(() => {
		if (shouldExit) {
			console.log('Starting exit animation for all trees');

			// Only clear trees after exit animation
			const timeout = setTimeout(() => {
				console.log('Exit animation complete, clearing trees');
				setTrees([]);
			}, 800); // Slightly faster cleanup

			return () => clearTimeout(timeout);
		}
	}, [shouldExit]);

	return (
		<div className="pointer-events-none fixed inset-0 isolate z-50 overflow-hidden">
			{/* For debugging - shows the number of trees */}
			{/* {isLoading && (
				<div className="absolute top-2 left-2 rounded bg-black/20 px-2 py-1 text-xs">
					Trees: {trees.length}
				</div>
			)} */}

			<AnimatePresence>
				{trees.map((tree) => (
					<motion.div
						key={tree.id}
						initial={{ opacity: 0, scale: 0 }}
						animate={{
							opacity: shouldExit ? 0 : 1,
							scale: shouldExit ? 0 : tree.scale,
							y: shouldExit ? -20 : 0,
						}}
						exit={{ opacity: 0, scale: 0 }}
						transition={{
							duration: shouldExit ? 0.6 : tree.duration,
							ease: 'easeInOut',
						}}
						style={{
							position: 'absolute',
							left: `${tree.x}%`,
							top: `${tree.y}%`,
							fontSize: '2rem', // Larger font size
							zIndex: 50 + Math.floor(tree.scale * 10),
							transform: `translate(-50%, -50%)`, // Center the emoji at its position
						}}
					>
						{tree.emoji}
					</motion.div>
				))}
			</AnimatePresence>

			{isLoading && (
				<div className="absolute inset-x-0 bottom-10 z-50 flex justify-center">
					<motion.div
						className="rounded-full bg-white px-6 py-3 text-center shadow-lg backdrop-blur-sm"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						transition={{ delay: 0.5 }}
					>
						<p className="text-xl font-medium">Generating your personalized report...</p>
					</motion.div>
				</div>
			)}
		</div>
	);
}
