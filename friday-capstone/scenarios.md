# Test Scenarios — MEDIC-108 Patient Profile Management

Author: Adriana Chipana · Track: Development · Day: Friday (capstone)

8 scenarios, written from the reference business rules (BR-PROF-001 to -007) and the screen as it really is: hooks, button and toast text.
- **IDs:** `SCEN-MED108-xx` are this bundle's scenarios. `SC-xx` always means a scenario in the reference AC.
- **Status** is the result on 2026-10-02.
- **Automated** marks the two scenarios covered by the capstone tests.

## SCEN-MED108-01 — Update name and phone through the UI

- **Type:** positive · **Priority:** High · **Rule:** BR-PROF-001 · **Risk:** R-02, R-03 (baseline)
- **Automated:** yes — `tests/profile-ui.spec.ts` (reference AC SC-01) · **Status:** Pass

```gherkin
Given a signed-in patient is on "/profile"
When they change Name to a new value and Phone to "+15550199"
And click "Save changes"
Then "PUT /api/profile" answers 200
And a success toast "Profile updated" is shown
And after reloading "/profile" the Name and Phone fields show the new values
```

## SCEN-MED108-02 — Identity fields can't be changed through the API

- **Type:** negative (security) · **Priority:** High · **Rule:** BR-PROF-002 · **Risk:** R-04
- **Automated:** yes — `tests/profile-api.spec.ts` (reference AC SC-03, SC-04) · **Status:** Pass

```gherkin
Given a signed-in patient
When they send "PUT /api/profile" with a new "email", "role" = "doctor" and a valid new "name"
Then the response is 200 and the name is updated
And the stored email and role are unchanged
And "PUT /api/profile" without a session answers 401 with code "UNAUTHORIZED"
```

## SCEN-MED108-03 — A changed name shows everywhere without logging in again

- **Type:** positive (cross-screen) · **Priority:** High · **Rule:** BR-PROF-006 · **Risk:** R-01
- **Automated:** no — fails today; regression candidate once fixed · **Status:** **Fail** (`bug-report.md`)

```gherkin
Given a signed-in patient has saved a new Name on "/profile"
When they open the dashboard and reload it
Then the navbar shows the new name
And the dashboard greeting shows the new name
And no log-out / log-in is needed
```

## SCEN-MED108-04 — Display name length boundaries

- **Type:** boundary · **Priority:** Medium · **Rule:** BR-PROF-005 · **Risk:** R-02
- **Automated:** later · **Status:** **Fail** (1 and 51 characters accepted)

```gherkin
Given a signed-in patient on "/profile"
When they save a Name of 2 characters, then of 50 characters
Then both are accepted
When they try a Name of 1 character, and of 51 characters
Then each is rejected with an inline error and "PUT /api/profile" answers 400
```

## SCEN-MED108-05 — Name can't be blank

- **Type:** negative · **Priority:** High · **Rule:** BR-PROF-005 · **Risk:** R-02
- **Automated:** later · **Status:** **Fail** (whitespace saved as an empty name, success toast shown)

```gherkin
Given a signed-in patient on "/profile"
When they replace the Name with "   " and click "Save changes"
Then the save is rejected with an inline error
And the stored name is unchanged
```

## SCEN-MED108-06 — Invalid phone is rejected

- **Type:** negative · **Priority:** Medium · **Rule:** BR-PROF-004 · **Risk:** R-03
- **Automated:** later · **Status:** **Fail** (accepted)

```gherkin
Given a signed-in patient on "/profile"
When they enter "INVALID_PHONE_123" as Phone and click "Save changes"
Then the save is rejected with an inline error under Phone
And "PUT /api/profile" with that value answers 400
```

## SCEN-MED108-07 — Markup in the name is shown as text

- **Type:** edge (security) · **Priority:** High · **Rule:** BR-PROF-001 · **Risk:** R-06
- **Automated:** later · **Status:** Pass on the profile screen; other screens not verified (they show the old name, SCEN-MED108-03)

```gherkin
Given a signed-in patient on "/profile"
When they save the Name "<script>alert('xss')</script> QA"
Then the Name is displayed as that literal text
And no JavaScript dialog opens on any screen that shows the name
```

## SCEN-MED108-08 — A failed save tells the patient

- **Type:** negative (error state) · **Priority:** Medium · **Rule:** BR-PROF-001 · **Risk:** —
- **Automated:** later (needs `page.route` to force the error) · **Status:** Pass

```gherkin
Given a signed-in patient on "/profile"
And the server fails the next "PUT /api/profile"
When they change Phone and click "Save changes"
Then an error toast "Failed to save profile" is shown
And the button returns from "Saving..." to "Save changes"
```

## Coverage

- **Positive:** SCEN-MED108-01, -03
- **Negative:** SCEN-MED108-02, -05, -06, -08
- **Boundary:** SCEN-MED108-04
- **Edge:** SCEN-MED108-07
- **Not covered here:** the audit log (BR-PROF-007) — nothing to observe; and avatar upload — not implemented.
