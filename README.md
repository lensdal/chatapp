# Huddle 🤝

**Every group, every kid, one place.**

Huddle is a family command center for parents who are drowning in scattered
group chats. Instead of tracking soccer, school, swim, scouts, and the PTA
across a dozen WhatsApp threads, email chains, and text messages, Huddle puts
every organization your family belongs to in one app — and turns the
conversation into a shared calendar and to-do list automatically.

This repository is an **interactive web prototype** running on realistic
sample data. It's the first step: get the experience right, then layer in real
accounts, real-time messaging, and live integrations.

## What it does

- **One inbox for every group.** Chat with the soccer coach, the homeroom
  parent, the swim team, and the school — each in its own group, all in one
  place.
- **Turn any message into a task or event.** Hover a message ("Everyone bring a
  RED shirt by Saturday") and tap **Make task / event**. It becomes a shared
  task or a calendar event for the whole group, tagged to the right kid.
- **Everything, by kid.** The dashboard and Tasks view roll every group up into
  a single list — "here's everything due for Isabella, for Calixta, for
  Mateo" — so nothing slips through the cracks.
- **A calendar across all groups.** Every event from every organization on one
  month view, color-coded and filterable by child.
- **Payments in the flow.** Fees and dues show up as tasks with a **Pay $45 ·
  Venmo** button. Paying checks the task off automatically.

## Integrations (simulated in this prototype)

The **Google Calendar** and **Venmo / Cash App** buttons work *inside* the app —
they flip state, "add to calendar," and check tasks off — but do not yet touch
your real accounts. Wiring those up (and real accounts + real-time chat) is the
planned next phase. See Settings for the toggles.

## Tech

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Router](https://reactrouter.com/) for navigation
- [lucide-react](https://lucide.dev/) icons, [date-fns](https://date-fns.org/) for dates
- State lives in a small reducer and persists to `localStorage` (no backend yet)

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # type-check + production build
npm run preview  # preview the production build
npm run lint     # type-check only
```

## Project layout

```
src/
  components/   Reusable UI (Sidebar, Topbar, cards, task/event rows, modals)
  pages/        Dashboard, Chats, Calendar, Tasks, Kids, Settings
  store/        Reducer + localStorage persistence, and the sample data seed
  lib/          Selectors, date helpers, color/theme maps
  types.ts      Shared data model
```

To restore the demo data at any time, use **Settings → Reset sample data**.
