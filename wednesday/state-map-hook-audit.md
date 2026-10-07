# Stretch — State Map Hook Audit

Author: Adriana Chipana · Track: Development · Day: Wednesday

Checks the reference Design state map (`trainees/development/reference/state-map-booking-cancellation.md`) against the `data-testid` hooks the app exposes today. Checked on 2026-09-30 in the rendered pages, logged in as a seeded patient, with the browser zone America/La_Paz.

Verdicts:
- **Present** — the hook exists and works as the map intends.
- **Missing** — no such hook.
- **Brittle** — a hook exists, but in a form the map warns against (the value is part of the name, or the state only lives in a CSS class).

## Booking flow

- **B1 Form, empty** — Present: `appointment-form`, `appointment-form-specialty-select`, `appointment-form-doctor-select`, and `appointment-form-submit-btn`, which is disabled.
- **B2 Specialty filtered** — Present: the select reflects the choice. Note: the filter is missing 4 specialties (Monday BUG-22).
- **B3 Doctor chosen** — Present: `date-time-picker`, `calendar-month-label`, `calendar-prev-month`, `calendar-next-month`.
- **B4 Date chosen** — Present, with a caveat: days are `calendar-day-{iso}` and carry a `data-disabled` attribute, so the state is machine-readable. But the native `disabled` property is `false` even on a doctor's non-working day, and past working days are enabled (Monday BUG-04).
- **B4a Date unavailable** — **Missing**: no `no-slots-message`. On a non-working day the slot section just has no slots.
- **B5 Slot chosen** — **Brittle**: `time-slot-{time}` exists and carries `data-available`, which is good. But the *selected* state is only a colour class (`bg-blue-600`); there is no attribute such as `aria-pressed` or `data-selected`. A test can't ask "which slot is selected?" without reading CSS.
- **B5a Slot unavailable** — Present but wrong: `data-available` is the right kind of hook, but it's `"true"` for booked slots (see `ac-gap-report.md`, Gap 4).
- **B6 Reason entered** — Present: `appointment-form-reason-textarea`, `reason-char-count`.
- **B6a Reason invalid** — **Missing**: no field-level validation hook. An empty reason only disables the submit button; there's no message or hook for it.
- **B7 Review open** — Present: `confirmation-modal`, `confirm-doctor`, `confirm-specialty`, `confirm-date`, `confirm-time`, `confirm-reason`.
- **B8 Booked** — Present, but transient: the toast "Appointment booked successfully" appears inside `toast-container` and disappears after a few seconds. There's no hook for the toast itself, only for its container. The container was also marked `aria-hidden="true"` for part of the time the toast was visible, so screen readers may not announce it.
- **B8a Booking rejected** — **Missing**: no form-level error hook. The map's own note says this is the state it's least confident about.

## Cancellation flow

- **C1 Detail, scheduled** — **Brittle** status: `appointment-detail-card`, `appointment-date`, `appointment-time`, `appointment-reason` and `appointment-specialty` are present. But the current status is only exposed as `status-badge-scheduled`. The value is in the hook name, so a test has to know the answer before it can read it — exactly what the map warns about.
- **C2 Cancel confirm open** — Present: `cancel-confirm-modal`, `cancel-modal-confirm-btn`, `cancel-modal-keep-btn`, `dialog-close-btn`.
- **C3 Cancelled** — **Brittle**: the status becomes `status-badge-cancelled` (value in the name, as in C1). The toast "Appointment cancelled" appears briefly in `toast-container`.
- **C4 Detail, cancelled** — Present: Edit and Cancel are not rendered on a cancelled appointment (checked on Tuesday, `ui-01`). The map flags this state as unspecified by PM; the app has made a choice.
- **C5 Not found** — Partly present: `appointment-not-found` shows for another patient's id, but `back-to-list` is **missing** on that page. For a malformed id (`/appointments/abc`), the whole page crashes with "Application error: a server-side exception has occurred" — the undesigned state the map asks about.

## List view

- **L1 Populated** — Partly present: `appointments-table`, `cell-date`, `cell-time`, `cell-doctor`, `cell-specialty`.
  - **Missing:** `cell-status` (the status is a `status-badge-<value>` component, brittle) and `cell-actions` (the action is `view-link-<id>`, which needs the id in advance).
  - The map predicted exactly these two.
- **L2 Empty** — Present: `appointments-empty` ("No appointments found").
- **L3 Loading** — Present: `appointments-loading`.
- **L4 Filtered / searched / sorted** — Present: `appointments-status-filter`, `appointments-search-input`, `appointments-sort-date`, `appointments-sort-specialty`.
- **L5 Paginated** — Present: `pagination-info`, `pagination-prev`, `pagination-next`.

## Summary

- **Missing (5):**
  - `no-slots-message` (B4a)
  - field-level validation hook (B6a)
  - form-level booking error hook (B8a)
  - `back-to-list` on not-found (C5)
  - `cell-status` / `cell-actions` (L1)
- **Brittle (3):**
  - selected slot is only a CSS class (B5)
  - status only as `status-badge-<value>` (C1, C3, L1)
  - success toast has no hook of its own and is transient (B8)
- **Undesigned state found:** a malformed appointment id crashes the page (C5).
- **Worth keeping:** `data-available` on slots and `data-disabled` on days are the right pattern. They just need correct values.
