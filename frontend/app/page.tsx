'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-[#fafbfa]">
			<div className="flex flex-col items-center gap-6">
				<Image
					src="/home.png"
					alt="Home illustration"
					width={128}
					height={128}
					className="mb-2 select-none"
					priority
				/>
				<h1 className="max-w-xl text-center text-3xl font-medium text-balance sm:text-3xl">
					Homely helps you instantly see how you can
					<span role="img" aria-label="lightning">
						{' '}
						⚡&nbsp;
					</span>
					save energy,
					<span role="img" aria-label="money">
						{' '}
						💵&nbsp;
					</span>
					cut costs, and
					<span role="img" aria-label="government">
						{' '}
						🏛️&nbsp;
					</span>
					unlock subsidies tailored for your home, no expertise needed.
				</h1>

				<div className="flex items-center gap-2 text-sm text-gray-500">
					We detected your location in
					<span className="bg-tint/10 text-tint flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium">
						Freiburg
						<svg
							width="16"
							height="16"
							fill="none"
							viewBox="0 0 20 20"
							className="ml-1 cursor-pointer"
						>
							<path
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M6 6l8 8M6 14L14 6"
							/>
						</svg>
					</span>
				</div>

				<Button>
					Discover Energy Savings
					<svg width="18" height="18" fill="none" viewBox="0 0 24 24">
						<path
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 12h14m-7 7l7-7-7-7"
						/>
					</svg>
				</Button>
			</div>
		</main>
	);
}
