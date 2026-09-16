# 📊 Record Completeness Bar — PCF Control

A **Power Apps Component Framework (PCF)** control that displays a **visual completeness score** for any Dataverse record. It evaluates which fields are filled vs. empty and renders a progress bar with color-coded thresholds plus a detailed missing-fields list.

Built with **Fluent UI 9** (React virtual control) for seamless integration in **Model-Driven Apps**.

![Record Completeness Bar](./assets/screenshot-preview.png)

> This repo also contains **[TaskCompletenessBar](#-task-completeness-bar--pcf-control)**, a sibling control that scores the **related Task records** of the current record instead of its own fields. See its dedicated section below. `RecordCompletenessBar` is unchanged and works exactly as documented here.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Visual Progress Bar** | Fluent UI ProgressBar with `large` thickness and `rounded` shape |
| **Color-Coded Thresholds** | 🟢 Green (≥ warning), 🟠 Orange (≥ danger), 🔴 Red (< danger) |
| **Configurable Fields** | Comma-separated list — no code changes needed per entity |
| **Friendly Labels** | Optional display names for each field |
| **Missing Fields Chips** | Visual chip list showing ✅ filled and ❌ missing fields |
| **Responsive** | Works on any form width |
| **Zero External Dependencies** | Only Fluent UI 9 + React (platform libraries) |

---

## 🎯 Use Cases

- **Sales**: Ensure Contact/Account records have email, phone, address, job title before qualification
- **Customer Service**: Validate case records have required fields before escalation
- **Field Service**: Check Work Order completeness before dispatch
- **Any Entity**: Configure for any Dataverse table — just list the fields

---

## 📦 Installation

### Option A: Import Managed Solution

1. Download the latest `.zip` from [Releases](https://github.com/hakimmouchquelita/record-completeness-bar/releases)
2. Go to **make.powerapps.com** → Solutions → Import
3. Select the `.zip` file and follow the wizard

### Option B: Build from Source

```bash
# Prerequisites: Node.js 18+, npm, .NET SDK, PAC CLI

git clone https://github.com/hakimmouchquelita/record-completeness-bar.git
cd record-completeness-bar

npm install
npm run build

# Create a solution project (one-time)
mkdir Solutions && cd Solutions
pac solution init --publisher-name HMQ --publisher-prefix hmq
pac solution add-reference --path ../

# Build the solution .zip
msbuild /t:build /restore
```

The solution `.zip` will be in `Solutions/bin/Debug/`.

---

## ⚙️ Configuration

After importing, add the control to any Model-Driven App form:

### Step 1: Add to Form

1. Open the form editor for your entity (e.g., Contact)
2. Select any **Single Line of Text** field (this is the anchor field)
3. Click **+ Component** → **Get more components** → search for `RecordCompletenessBar`
4. Configure the properties:

### Step 2: Set Properties

| Property | Required | Example | Description |
|---|---|---|---|
| **Fields To Check** | ✅ | `emailaddress1,telephone1,address1_city,jobtitle` | Comma-separated logical names of fields to evaluate |
| **Field Labels** | ❌ | `Email,Phone,City,Job Title` | Friendly labels (same order). Falls back to logical name if omitted |
| **Warning Threshold (%)** | ❌ | `60` | Below this → 🟠 orange bar (default: 60) |
| **Danger Threshold (%)** | ❌ | `30` | Below this → 🔴 red bar (default: 30) |
| **Show Missing Fields List** | ❌ | `true` | Show/hide the chip list below the bar (default: true) |

### Step 3: Publish

Save and publish the form. The control renders immediately on the form.

---

## 🖼️ Screenshots

### High Completeness (Green)
```
[██████████████████████░░] 88%  ✅ Record Completeness
                                    7/8 fields
```

### Medium Completeness (Orange)
```
[██████████████░░░░░░░░░░] 50%  ⚠️ Record Completeness
                                    4/8 fields
```

### Low Completeness (Red)
```
[█████░░░░░░░░░░░░░░░░░░░] 25%  🔴 Record Completeness
                                    2/8 fields
```

---

## 🏗️ Architecture

```
RecordCompletenessBar/
├── ControlManifest.Input.xml    # Component manifest (properties, metadata)
├── index.ts                     # PCF lifecycle class (init, updateView, destroy)
├── CompletenessBar.tsx          # React component (Fluent UI 9)
└── generated/
    └── ManifestTypes.d.ts       # Auto-generated TypeScript interfaces
```

### How It Works

1. **index.ts** reads the `fieldsToCheck` property and evaluates each field via `Xrm.Page.getAttribute()` 
2. It passes the field statuses to the React component
3. **CompletenessBar.tsx** calculates the percentage, applies threshold colors, and renders:
   - A score header with Fluent UI Badge
   - A ProgressBar with appropriate color
   - A list of field chips (filled ✅ / missing ❌)

---

## 🔧 Development

```bash
# Start the test harness
npm start

# Start with hot-reload
npm run start:watch

# Build for production
npm run build

# Lint
npm run lint
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## ✅ Task Completeness Bar — PCF Control

A sibling control (`TaskCompletenessBar/`) built the same way, but instead of checking
fields on the current record, it evaluates the **related Task records** linked to it
and shows what percentage of them are marked complete. It has no missing-field/task
chip list — just a percentage bar with a one-line status.

### ✨ Features

| Feature | Description |
|---|---|
| **Visual Progress Bar** | Same Fluent UI ProgressBar styling as Record Completeness Bar |
| **Completion Percentage** | `completed / total` of the linked task records |
| **Due-Date-Aware Color** | 🟢 Green when all tasks are complete (or none are overdue/due today), 🟠 Orange when an incomplete task is due today, 🔴 Red when an incomplete task is overdue |
| **Configurable Schema** | Task entity, lookup field, completed field, and due date field are all configurable — not hardcoded |
| **Async Data Fetch** | Fetches related tasks via `context.webAPI.retrieveMultipleRecords`, with dedicated loading/error/empty states |
| **Bound Field Control** | Anchored to a field on the parent form, same pattern as Record Completeness Bar (not a subgrid/dataset control) |

### 🎯 Use Case

Originally built for Oceanco's onboarding app: an **Onboarding Case** (`itr_onboardingcase`)
record has multiple related **Task** (`task`) records representing onboarding steps. This
control shows, at a glance, what percentage of those tasks are done and whether any are
overdue or due today — with the option to adapt the schema (entity/lookup/completed/due
date field names) to any parent/child relationship via configuration.

### ⚙️ Configuration

Add the control to a form the same way as Record Completeness Bar (bind it to any
Single Line of Text field as an anchor), then set:

| Property | Required | Default | Description |
|---|---|---|---|
| **Task Entity Logical Name** | ❌ | `task` | Logical name of the related task entity |
| **Lookup Field Name** | ❌ | `itr_onboardingcase` | Logical name of the lookup field on the task entity pointing back to the parent record |
| **Completed Field Name** | ❌ | `itr_completed` | Logical name of the Yes/No field on the task entity indicating completion |
| **Due Date Field Name** | ❌ | `scheduledend` | Logical name of the date field used to determine overdue/due-today status |

### 🎨 Color Logic

1. If **all** linked tasks are completed → 🟢 **green**.
2. Otherwise, if any incomplete task's due date has **passed** → 🔴 **red**.
3. Otherwise, if any incomplete task is due **today** → 🟠 **orange**.
4. Otherwise (incomplete tasks exist, but none overdue/due today) → 🟢 **green**.

### How It Works

1. **index.ts** reads the schema properties and, via the existing `getFormContext()`-style
   helper, reads the current record's id from `Xrm.Page`. It passes `context.webAPI`, the
   record id, and the resolved configuration down as props — no async calls happen here,
   `updateView` stays synchronous.
2. **TaskCompletenessBar.tsx** owns the async work in a `useEffect`/`useState` pair: it
   calls `webAPI.retrieveMultipleRecords` filtered on the lookup field (selecting the
   completed and due date fields), then renders:
   - a **loading** spinner while the request is in flight,
   - an **error** message if the WebApi call fails,
   - a neutral **empty state** if there are zero linked tasks (not shown as 0%),
   - otherwise the completion percentage, a badge (`completed/total`), a ProgressBar
     colored per the due-date-aware logic above, and a short status line (e.g.
     "2 incomplete tasks overdue.").

### Architecture

```
TaskCompletenessBar/
├── ControlManifest.Input.xml    # Component manifest (properties, metadata)
├── index.ts                     # PCF lifecycle class (init, updateView, destroy)
├── TaskCompletenessBar.tsx      # React component (Fluent UI 9, async data fetch)
└── generated/
    └── ManifestTypes.d.ts       # Auto-generated TypeScript interfaces
```

### Deploying to a Real Form

Same build/packaging steps as [Record Completeness Bar](#-installation) — `npm run build`,
then `pac solution` + `msbuild` to produce a solution `.zip` (or import via
`pac pcf push`). Once imported into your environment:

1. Open the **Onboarding Case** (`itr_onboardingcase`) main form in the form editor.
2. Select a **Single Line of Text** field to use as the anchor.
3. **+ Component** → **Get more components** → `TaskCompletenessBar`.
4. Leave the defaults (they already match Oceanco's schema) or override per environment.
5. Save & publish — the bar then reflects the real linked `task` records for that
   Onboarding Case record.

---

## 📝 Changelog

### TaskCompletenessBar v1.0.0
- New sibling control scoring related Task records instead of current-record fields
- Configurable task entity, lookup field, completed field, and due date field
- Async fetch via `context.webAPI.retrieveMultipleRecords` with loading/error/empty states
- Due-date-aware color logic (green/orange/red based on overdue or due-today incomplete tasks), no missing-item chip list

### v1.0.0 (2026-05-17)
- Initial release
- Fluent UI 9 virtual control
- Configurable fields, labels, thresholds
- Missing fields chip list
- Model-Driven Apps support

---

## 📄 License

[MIT](./LICENSE) — © 2026 [Hakim Mouchquelita](https://www.linkedin.com/in/hakimmouchquelita/)

---

## 🔗 Links

- **PCF Gallery**: *(pending submission)*
- **Author**: [Hakim Mouchquelita](https://www.linkedin.com/in/hakimmouchquelita/) — Solution Architect Power Platform & AI
- **Blog**: [GitHub Pages CV](https://hakimmouchquelita.github.io/CV-Expert-D365-Power-Platform/)

