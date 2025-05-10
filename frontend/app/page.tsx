'use client';

import Image from "next/image";
import Button from "../lib/Button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#fafbfa]">
      <div className="flex flex-col items-center gap-6">
        <Image
          src="/home.png"
          alt="Home illustration"
          width={96}
          height={96}
          className="mb-2 select-none"
          priority
        />
        <h1 className="text-3xl sm:text-3xl font-medium text-center max-w-xl text-balance">
          Homely helps you instantly see how you can
          <span role="img" aria-label="lightning"> ⚡&nbsp;</span>save energy,
          <span role="img" aria-label="money"> 💵&nbsp;</span>cut costs, and
          <span role="img" aria-label="government"> 🏛️&nbsp;</span>unlock subsidies
          tailored for your home, no expertise needed.
        </h1>
        <div className="flex flex-col items-center gap-3">
          <div className="text-gray-500 text-sm flex items-center gap-2">
            We detected your location in
            <span className="bg-tint/10 text-tint rounded-full px-3 py-1 text-sm flex items-center gap-1 font-medium">
              Freiburg
              <svg width="16" height="16" fill="none" viewBox="0 0 20 20" className="ml-1 cursor-pointer"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l8 8M6 14L14 6"/></svg>
            </span>
          </div>
          <Button>
            Discover Energy Savings
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7 7l7-7-7-7"/></svg>
          </Button>
        </div>
      </div>
    </main>
  );
}