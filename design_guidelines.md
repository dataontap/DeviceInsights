# IMEI Device Checker - Design Guidelines

## Design Approach

**Selected Framework:** Material Design System with custom elements
**Justification:** Utility-focused application requiring clarity, professional appearance, and efficient user flows. Material Design provides excellent structure for data-heavy interfaces while allowing creative customization for the NPS widget.

**Key Principles:**
- Clarity over decoration: Every element serves a purpose
- Progressive disclosure: Show information hierarchically as users interact
- Trust through professionalism: Clean, confident design language
- Welcoming minimalism: Spacious layouts that feel approachable, not sterile

---

## Typography System

**Primary Font:** Inter (Google Fonts)
**Secondary Font:** SF Mono (for IMEI numbers and technical data)

**Hierarchy:**
- Hero Heading: 3xl-4xl (48-56px), font-bold, tracking-tight
- Section Headings: 2xl (32px), font-semibold
- Body Text: base-lg (16-18px), font-normal, leading-relaxed
- Technical Data Labels: sm (14px), font-medium, uppercase, tracking-wide
- IMEI/Serial Numbers: base, font-mono, font-medium
- NPS Widget Text: base (16px), font-normal, leading-snug

---

## Layout System

**Spacing Scale:** Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing (within components): 2, 4
- Component internal padding: 6, 8
- Section spacing: 12, 16, 24
- Major sections: 24, 32

**Container Strategy:**
- Maximum width: max-w-4xl (centered for focused experience)
- Hero section: max-w-2xl (tighter for search focus)
- Results cards: max-w-3xl
- Form elements: max-w-md

**Grid System:**
- Single column primary flow (optimal for sequential search → results → feedback)
- Results display: 2-column grid on desktop (md:grid-cols-2) for device specifications
- Mobile: Single column stack throughout

---

## Core Components

### Hero Section
**Layout:** Centered, minimal, search-focused
- Heading + subheading stacked vertically with 4-unit spacing
- Search input field prominent with 12-unit top margin
- Clear visual hierarchy: heading → subheading → search → helper text
- Vertical padding: py-24 (desktop), py-16 (mobile)

**Search Input:**
- Large input field: h-14, text-lg
- Rounded corners: rounded-xl
- Shadow: shadow-sm
- Padding: px-6
- Placeholder text guides format (e.g., "Enter 15-digit IMEI: 123456789012345")
- Search button integrated on right side with blur backdrop
- Helper text below: "Tap *#06# on your device to find IMEI"

### Results Display Section
**Layout:** Card-based, information hierarchy
- Animated slide-in appearance (subtle, smooth transition)
- Device summary card at top: rounded-2xl, shadow-lg, p-8
- Specification grid below: 2-column on desktop, single on mobile
- Spacing between cards: gap-6

**Device Summary Card:**
- Device name/model: 2xl, font-bold
- Status indicator: Small pill badge (rounded-full, px-4, py-1, text-sm)
- Primary specs in grid: Brand, Model, Storage, Color
- Visual separation with subtle dividers between spec groups

**Specification Cards:**
- Individual cards: rounded-xl, shadow-md, p-6
- Label + value pairing with clear hierarchy
- Icons for categories (use Heroicons): shield (warranty), calendar (purchase date), signal (network)
- Consistent internal spacing: gap-3

### NPS Feedback Widget
**Critical Design Requirements:**
- Appears after successful IMEI check (3-second delay)
- Position: Fixed bottom-right, m-6 (desktop), bottom-center full-width (mobile)
- Non-intrusive: Starts minimized, expands on hover/tap

**Minimized State:**
- Compact pill shape: rounded-full, px-6, py-3
- Simple text: "Quick feedback?" with subtle arrow icon
- Shadow: shadow-xl for prominence without aggression
- Backdrop blur on background

**Expanded State:**
- Transforms to card: rounded-2xl, shadow-2xl, p-6
- Width: w-96 (desktop), w-full minus margins (mobile)
- Smooth height transition (300ms ease)

**NPS Widget Content Structure:**
1. Question text: "How likely are you to recommend this service?" (font-semibold, mb-4)
2. Number scale (0-10): Horizontal button row
   - Each number: Circular button (h-10, w-10), rounded-full
   - Spacing: gap-2
   - Hover states: scale-105 transform
3. Labels below scale: "Not likely" (left), "Very likely" (right), text-xs
4. Optional comment field (appears after rating): textarea, rounded-lg, p-3, h-20
5. Submit button: Full width, rounded-lg, py-2.5, font-medium
6. Close button: Absolute top-right, p-2, subtle

**Dismissal:**
- Small "X" icon in top-right corner
- "Maybe later" text link at bottom
- Auto-dismiss after 60 seconds of inactivity

### Navigation
**Simple header:**
- Logo/brand left aligned
- "How it works" + "FAQs" links right aligned
- Height: h-16
- Container: max-w-6xl, centered
- Sticky positioning: sticky top-0, backdrop-blur

### Footer
**Compact, informative:**
- Single row on desktop, stacked on mobile
- Links: About, Privacy, Terms, Contact
- Trust indicators: "Secure" badge, "Free service" text
- Padding: py-12
- Max width: max-w-6xl

---

## Images

**Hero Background:**
- Subtle gradient overlay on abstract technology pattern (circuit boards, smartphone silhouettes)
- Image dimensions: Full viewport width, 600px height
- Treatment: Low opacity (20-30%), slight blur for text legibility
- Alternative: Solid backdrop with subtle noise texture if image unavailable
- Note: Hero has large background image treatment, not full hero image

**Device Icons/Illustrations:**
- Small device type icons in results (smartphone, tablet, etc.)
- Use simple line art style, 24x24px or 32x32px
- Placement: Next to device model in summary card

---

## Animations & Interactions

**Transitions (Minimal):**
- Search button: Gentle scale on hover (scale-105)
- Results appearance: Fade-in + slide-up (300ms)
- NPS widget expansion: Smooth height/width transform (250ms cubic-bezier)
- Number buttons: Soft scale feedback on click

**Loading States:**
- Spinner for IMEI validation: Simple circular progress
- Skeleton screens for results: Rounded rectangles with pulse animation
- Duration: 300-500ms typical response

---

## Accessibility Standards

- All interactive elements minimum 44px touch target
- Focus states: 2px outline offset for keyboard navigation
- ARIA labels on all icons and interactive elements
- Semantic HTML throughout (proper heading hierarchy, form labels)
- Color contrast ratios maintained (defined in color implementation phase)
- NPS widget keyboard navigable: Tab through numbers, Enter to select, Escape to dismiss

---

## Responsive Behavior

**Breakpoints:**
- Mobile: base (< 768px)
- Desktop: md (≥ 768px)

**Key Adaptations:**
- Hero search: Full width mobile, centered max-w-md desktop
- Results grid: Stack on mobile, 2-column desktop
- NPS widget: Full-width bottom on mobile, fixed bottom-right desktop
- Typography scales down one size on mobile
- Padding reduces: 24 → 12, 16 → 8 on smaller screens