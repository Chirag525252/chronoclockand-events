# ◈ ChronoHub — Smart Calendar & Time Manager

> A production-ready, zero-dependency web app for managing time — beautifully.

---

## Overview

**ChronoHub** is a fully offline, browser-based productivity suite built with vanilla HTML, CSS, and JavaScript. It combines a smart monthly calendar with powerful time tools — all in one elegant, dark/light-mode dashboard.

---

## Features

### 📅 Smart Calendar
| Feature | Details |
|---|---|
| Monthly navigation | Previous / Next month buttons |
| Today highlight | Today's date is always visually distinct |
| Click to add events | Click any date to create events |
| Event fields | Title, Description, Date, Time, Category, Color, Recurring |
| Recurring events | Daily / Weekly / Monthly |
| Event indicators | Color-coded dots on dates with events |
| Edit & Delete | Full CRUD on all events |
| Side panel | Events for selected date shown instantly |
| Browser notifications | Auto-scheduled at event time |
| Audio alerts | Oscillator-based beep when event fires |
| Search | Filter events by title or description |
| Export | Download all events as `.json` |
| Import | Load events from a `.json` backup |
| Monthly stats | Event count and category breakdown |
| Print support | Clean print layout via `window.print()` |

### 🎉 Indian National Holidays
- Republic Day, Holi, Good Friday, Ambedkar Jayanti, Independence Day, Gandhi Jayanti, Dussehra, Diwali, Christmas
- Highlighted in orange on the calendar
- Holiday name shown inline and on hover
- Toggle visibility with **🎉 Holidays** button

### ⏰ Alarm Clock
- Set hour & minute (24-hour)
- Custom label per alarm
- Enable/disable toggle per alarm
- Multiple simultaneous alarms
- Audio alert on trigger
- Snooze for 5 minutes
- Stop button
- Persisted in LocalStorage

### ⏱ Countdown Timer
- Input hours, minutes, seconds
- Start / Pause+Resume / Reset
- Animated progress bar
- Percentage display
- Urgent animation when ≤ 10 seconds remain
- Audio alert on completion

### 🏁 Stopwatch
- Start / Pause / Resume / Reset
- Lap recording with split times
- Fastest lap (green) and slowest lap (red) highlighting
- Export laps to `.txt` file

### 🌙 Dark Mode
- Full dark theme with CSS variable overrides
- Persisted to LocalStorage

---

## Installation

No build step required.

```bash
# Clone or download
git clone https://github.com/chirag525252/chronohub.git
cd chronohub

# Open directly in any modern browser
open chronohubindex.html
```

Or simply double-click `chronohubindex.html`.

> ✅ Tested in Chrome, Firefox, Edge, Safari.

---

## Usage Guide

1. **Calendar** — Click any date cell → Add events in the side panel or via the "+ Add Event" button.
2. **Alarm** — Navigate to ⏰ Alarm, enter hour/minute, click "Set Alarm". Alarms fire even if you leave the tab open.
3. **Timer** — Navigate to ⏱ Timer, enter duration, press Start.
4. **Stopwatch** — Navigate to 🏁 Stopwatch, press Start, use Lap to record splits.
5. **Theme** — Click the 🌙 button in the sidebar footer.
6. **Export/Import** — Use the buttons in the Calendar header toolbar.

### Notification Permission
The app requests browser notification permission on first load. Allow it to receive desktop alerts when events are due.

---

## File Structure

```
chronohub/
├── chronohubindex.html   ← App shell & HTML structure
├── chronohubstyle.css    ← All styles (CSS variables, dark mode, responsive)
├── chronohubjs.js    ← All logic (Calendar, Alarm, Timer, Stopwatch)
└── README.md    ← This file
```

---

## Screenshots

> *(Add screenshots here after taking them in your browser)*

| Calendar (Light) | Calendar (Dark) | Alarm |
|---|---|---|
| ![light]() | ![dark]() | ![alarm]() |

---

## Technical Notes

- **No external frameworks** — pure HTML5 / CSS3 / ES6+
- **Web Audio API** — oscillator-based beep, no audio files needed
- **Notification API** — browser notifications at event time
- **LocalStorage** — events and alarms persist across sessions
- **CSS Variables** — single-file theming, trivially extensible
- **Modular IIFE pattern** — `Calendar`, `AlarmClock`, `CountdownTimer`, `Stopwatch` are self-contained modules

---

## Future Enhancements

- [ ] Google Calendar sync
- [ ] Drag & drop events across dates
- [ ] Week / Day view
- [ ] Full-screen mode
- [ ] Cloud sync (Firebase / Supabase)
- [ ] PWA support (offline installable)
- [ ] Dynamic Indian holiday API integration
- [ ] Custom alarm ringtone upload

---

## Author

Built with ❤️ using only the web platform.  
Feel free to fork, modify, and share.

---

## License

MIT — free for personal and commercial use.
