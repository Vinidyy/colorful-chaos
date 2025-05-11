---
trigger: glob
description: When using Tailwind or CSS
globs: *.{tsx,css}
---

# Tailwind CSS Rules

<author>blefnk/rules</author>
<version>1.0.0</version>

## Context

- For styling with Tailwind CSS v4
- Emphasizes utility classes for consistency

## Requirements

- Maintain consistent spacing (e.g., `p-4`, `m-2`, `space-y-4`).
- Combine conditional classes with `cn()`.
- Use only custom colors defined in `globals.css`.
- Ensure dark mode support via `.dark:` variants.

## Examples

<example>
  import { cn } from "$/lib/utils";
  
  export function ExampleBox({ isActive }: { isActive: boolean }) {
    return (
      <div className={cn("p-4 rounded-md", isActive ? "bg-blue-500" : "")}>
        Content
      </div>
    );
  }
</example>

<example type="invalid">
  <div style={{ padding: "20px" }}>Inline styled box</div>
</example>

## Tailwind v4 Updates

- Config: `tailwind.config.ts` deprecated; now configure in `globals.css` with `@import "tailwindcss"`.
- Removed Utilities: `bg-opacity-*`, `text-opacity-*`, `flex-shrink-*`, `flex-grow-*` → replaced by new patterns (`bg-black/50`, `shrink-*`, `grow-*`, etc.).
- `@layer`: `@layer utilities/components` replaced by `@utility`.
- Variant Stacking: Applied left to right (e.g., `.hover:focus:bg-red-500`).
- Theming: Use `var(--color-...)` instead of `theme()` in CSS.
