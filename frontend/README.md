# TaskFlow — Premium Frontend v2

A refined TaskFlow frontend focused on readability, premium surfaces, restrained motion, and a clear productivity hierarchy.

## Visual direction
- Near-black navy base with soft electric blue and subtle violet accents.
- Reduced glass transparency: surfaces remain layered but readable.
- No continuous diagonal/flying background motion.
- Empty states and the TF principle use fixed compositions with slow breathing glow.
- Micro-text is intentionally larger; important metadata and status/priority pills are readable at a glance.
- Desktop Overview is composed to fit the viewport without page scrolling; task content can scroll inside its own list when necessary.
- Command Center uses larger rows, icons, descriptions, and shortcuts.

## Interaction improvements
- Contextual session message after sign-in/return.
- Existing task/action toasts retained and refined.
- Clearer task completion, priority, and status states.
- Developer Profile expanded with education metrics, career focus, strengths, technical skills, projects, certifications, and languages.
- Project detail panels expose role/focus/status in addition to stack and purpose.
- Reduced-motion support remains enabled.

## API
The frontend keeps the existing Flask REST API contract. Set `API_BASE_URL` in `config.js` before deployment.
