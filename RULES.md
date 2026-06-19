<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 📜 MASTER AGENT RULES & CONTEXT

## 📖 Project Context
"Senior Health & Life-logging" (Thai: สุขภาพดีกับคุณ)
A mobile-first web app designed for Alzheimer's patients and seniors.
The UI must be "Invisible but Present" — extremely easy to use, using high-contrast colors, huge fonts, and tactile feedback.

## 🏗️ Technical Stack
- **Framework**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth (with `AuthGate` protection globally)
- **Database**: Supabase PostgreSQL
- **Realtime**: Supabase Realtime
- **Styling**: Vanilla CSS (Global theme in `app/globals.css`)
- **Animations**: Framer Motion
- **Icons**: Lucide React (Stroke width: 2.5 or 3)

## 📏 Design System Rules (STRICT ADHERENCE REQUIRED)
1. **Accessibility (Senior-First)**:
   - **Buttons**: Minimum height `56px`. Every button MUST have an icon + text.
   - **Fonts**: Base size `20px` (`1.25rem`). Hero headers `2.5rem` (`h1`), Section headers `1.8rem` (`h2`).
   - **Spacing**: Minimum `12px` gap between interactive elements.
   - **Contrast**: Use WCAG AAA guidelines. Backgrounds: White, Primary: Green.
2. **Branding (Green/White theme)**:
   - **Primary**: Green (`#16A34A`) | **Dark**: `#15803D` | **Light**: `#DCFCE7` | **Background**: `#FFFFFF`
3. **Language & Tone**:
   - **Thai Only**: Use only Thai for user-facing text.
   - **Polite/Friendly**: Ending sentences with "ครับ" (หรือ "ค่ะ") and using "คุณ" for address.
4. **Layout**:
   - Navigation: `SideNav.tsx` (Desktop/Tablet) and Fixed Bottom Bar (Mobile).
   - Transitions: All pages must wrap in `<LayoutTransition>`.

---

## ⚙️ AGENT OPERATING PROCEDURES
- **Read First**: Always read `RULES.md` and `TODO.md` at start of turn.
- **Update Cycle**: Update `TODO.md` (Checkpoints and Manual Steps) at the end of every turn.
- **Rules Enforcement**: Never output code that violates the 56px/20px accessibility rules.
- **State Maintenance**: Proactively update `TODO.md` as tasks are completed or new ones arise.
