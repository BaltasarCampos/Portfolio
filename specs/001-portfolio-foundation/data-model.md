# Data Model: Build Portfolio Foundation

**Phase**: 1 (Design)  
**Date**: 2026-03-04  
**Feature**: Build Portfolio Foundation (001-portfolio-foundation)

---

## Overview

This document defines all data entities, their structure, validation rules, relationships, and state transitions for the portfolio website. All definitions are language-agnostic but will be implemented in TypeScript with strict type checking.

---

## 1. Project Entity

### Definition

A **Project** represents a completed work or creation by the engineer. It is displayed in the Projects Grid and filterable by technology or category.

### Structure

```typescript
interface Project {
  // Unique identifier
  id: string;
  
  // Display information
  title: string;          // 1-60 characters, required
  description: string;    // 100-300 characters, required
  
  // Classification
  technologies: string[]; // Array of 1-10 technology tags (e.g., ["React", "TypeScript"])
  category?: string;      // Optional category (e.g., "web-app", "library", "tool")
  
  // Visual assets
  thumbnail: {
    src: string;          // Path to image file (WebP or JPEG)
    alt: string;          // Accessibility alt text (1-120 characters, required)
    width: number;        // Aspect ratio width (e.g., 16)
    height: number;       // Aspect ratio height (e.g., 9)
  };
  
  // External links (optional)
  demoUrl?: string;       // Full URL to live demo (must start with https://)
  repositoryUrl?: string; // Full URL to source code repo (must start with https://)
  
  // Metadata
  createdAt?: string;     // ISO 8601 date (e.g., "2025-06-15")
  featured?: boolean;     // Whether to pin project to top of grid
}
```

### Validation Rules

| Field | Rule | Severity |
|-------|------|----------|
| `id` | Must be unique across all projects | ERROR |
| `title` | 1-60 characters; no HTML tags | ERROR |
| `description` | 100-300 characters; no HTML tags | ERROR |
| `technologies` | 1-10 tags; each 1-30 characters | ERROR |
| `category` | Optional; 1-50 characters if present | WARNING |
| `thumbnail.src` | File must exist; must be .webp or .jpg/.jpeg | ERROR |
| `thumbnail.alt` | 1-120 characters; descriptive | ERROR |
| `thumbnail.width` | Positive integer; common aspect ratios (16, 4, 1) | WARNING |
| `thumbnail.height` | Positive integer; paired with width | WARNING |
| `demoUrl` | Optional; must start with `https://`; must be valid URL | ERROR |
| `repositoryUrl` | Optional; must start with `https://`; must be valid URL | ERROR |

### Relationships

- **Projects Grid**: One-to-many relationship with ProjectsGrid filtering state
- **Technology Filter**: Projects linked to technologies via `technologies` array
- **Category Filter**: Projects linked to optional categories via `category` field

### State Transitions

```
Not in Grid → In Grid → Filtered (by technology) → Visible in Grid
                     → Filtered (by category) → Visible in Grid
```

### Example

```typescript
const exampleProject: Project = {
  id: "project-001",
  title: "E-Commerce Analytics Dashboard",
  description: "Real-time analytics platform for online retailers. Features include sales trends, customer segmentation, and revenue forecasting. Built with React, TypeScript, and D3.js.",
  technologies: ["React", "TypeScript", "D3.js", "Node.js", "PostgreSQL"],
  category: "web-app",
  thumbnail: {
    src: "/images/projects/dashboard.webp",
    alt: "Analytics dashboard showing sales trends and customer metrics",
    width: 16,
    height: 9
  },
  demoUrl: "https://dashboard-demo.example.com",
  repositoryUrl: "https://github.com/engineer/analytics-dashboard",
  createdAt: "2025-06-15",
  featured: true
};
```

---

## 2. ContactSubmission Entity

### Definition

A **ContactSubmission** represents a message sent by a visitor through the contact form. It contains visitor information and their message, destined for email delivery.

### Structure

```typescript
interface ContactSubmission {
  // Submission metadata
  id: string;                    // Unique identifier (UUID)
  submittedAt: string;           // ISO 8601 timestamp (e.g., "2026-03-04T14:30:00Z")
  
  // Visitor information
  name: string;                  // 1-100 characters, required
  email: string;                 // Valid email format, required
  
  // Message content
  message: string;               // 1-5000 characters, required
  
  // Spam detection
  honeypot?: string;             // Hidden field; if filled, submission is bot attempt
  clientIp?: string;             // Client IP for rate limiting
  
  // Submission status
  status: 'pending' | 'sent' | 'failed'; // Processing status
  errorMessage?: string;         // Error details if status === 'failed'
}
```

### Validation Rules

| Field | Rule | Severity |
|-------|------|----------|
| `id` | Must be unique UUID | ERROR |
| `submittedAt` | Must be valid ISO 8601 timestamp | ERROR |
| `name` | 1-100 characters; no leading/trailing whitespace | ERROR |
| `email` | Valid email format (RFC 5322 simplified); lowercase stored | ERROR |
| `message` | 1-5000 characters; no HTML tags allowed | ERROR |
| `honeypot` | Must be empty string (bot protection) | SILENT_REJECT |
| `clientIp` | Must be valid IPv4 or IPv6 format | WARNING |
| `status` | Must be one of: pending, sent, failed | ERROR |

### Email Format Regex

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

**Valid Examples**:
- `john@example.com` ✅
- `user+tag@domain.co.uk` ✅
- `test.email@company.org` ✅

**Invalid Examples**:
- `johnexample.com` ❌ (no @)
- `john@example` ❌ (no TLD)
- `john@.com` ❌ (no domain)

### Relationships

- **Edge Function API**: ContactSubmission sent via POST to `/api/contact`
- **Email Service**: ContactSubmission triggers email to `ENGINEER_EMAIL`
- **Session Storage**: Unsent submission preserved in `sessionStorage` for recovery

### State Transitions

```
User fills form → ValidationError (show inline) → Retry
                ↓
            Submission pending
                ↓
            Network call to /api/contact
                ↓
       Success (status='sent') → Show success message → Clear sessionStorage
                ↓
       Failure (status='failed') → Show error → Preserve in sessionStorage for retry
```

### Example

```typescript
const exampleSubmission: ContactSubmission = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  submittedAt: "2026-03-04T14:30:00Z",
  name: "Jane Developer",
  email: "jane@company.com",
  message: "Hi! I'm interested in collaborating on a React component library project. Your portfolio is impressive!",
  honeypot: "", // Empty = legitimate user
  clientIp: "192.0.2.1",
  status: "sent"
};
```

---

## 3. NavigationState Entity

### Definition

**NavigationState** tracks the current section and navigation transitions. It manages active section indication and smooth transitions between sections.

### Structure

```typescript
interface NavigationState {
  // Active section
  activeSection: 'hero' | 'projects' | 'about' | 'contact'; // Current section
  
  // Transition tracking
  previousSection?: 'hero' | 'projects' | 'about' | 'contact'; // For transition animations
  isTransitioning: boolean;                                      // True during transition animation
  transitionDuration: number;                                    // Milliseconds
  
  // Scroll position (for restoration)
  scrollPosition?: number;
}
```

### Validation Rules

| Field | Rule | Severity |
|-------|------|----------|
| `activeSection` | Must be one of: hero, projects, about, contact | ERROR |
| `previousSection` | Optional; must match activeSection enum if present | WARNING |
| `isTransitioning` | Must be boolean | ERROR |
| `transitionDuration` | Must be 0-1000 ms | WARNING |
| `scrollPosition` | Optional; must be non-negative number | WARNING |

### State Transitions

```
activeSection: 'hero'
        ↓
[User clicks "Projects" link]
        ↓
isTransitioning: true
previousSection: 'hero'
transitionDuration: 300ms
        ↓
[Animation completes]
        ↓
activeSection: 'projects'
isTransitioning: false
previousSection: 'hero' (retained for reference)
```

### Accessibility

- **ARIA Updates**: When `activeSection` changes, navigation bar announces: "Navigated to Projects section"
- **Focus Management**: Focus moves to section heading (e.g., `<h2 id="projects">`) after transition
- **Keyboard Shortcut**: No keyboard shortcuts; standard keyboard navigation via Tab/Enter only

### Example

```typescript
const navigationState: NavigationState = {
  activeSection: 'projects',
  previousSection: 'hero',
  isTransitioning: false,
  transitionDuration: 300,
  scrollPosition: 1200
};
```

---

## 4. ProjectsFilterState Entity

### Definition

**ProjectsFilterState** tracks which technologies or categories are currently selected for filtering the projects grid.

### Structure

```typescript
interface ProjectsFilterState {
  // Selected filters
  selectedTechnologies: string[];  // Array of technology tags (e.g., ["React", "TypeScript"])
  selectedCategories: string[];    // Array of categories (e.g., ["web-app"])
  
  // Results
  filteredProjects: Project[];      // Projects matching all selected filters
  totalProjects: number;            // Total project count (unfiltered)
  
  // UI state
  isLoading: boolean;               // True while filtering (should be instant, <500ms)
  lastFilterTime: number;           // Timestamp of last filter change
}
```

### Validation Rules

| Field | Rule | Severity |
|-------|------|----------|
| `selectedTechnologies` | Must be subset of all available technologies | ERROR |
| `selectedCategories` | Must be subset of all available categories | ERROR |
| `filteredProjects` | Must match filter criteria exactly | ERROR |
| `totalProjects` | Must equal length of unfiltered projects array | WARNING |
| `isLoading` | Must be boolean | ERROR |
| `lastFilterTime` | Must be valid timestamp (ms since epoch) | WARNING |

### Filter Logic

```typescript
// Pseudo-code for filtering
const filteredProjects = allProjects.filter(project => {
  const techMatch = selectedTechnologies.length === 0 ||
    selectedTechnologies.every(tech => project.technologies.includes(tech));
  
  const categoryMatch = selectedCategories.length === 0 ||
    selectedCategories.includes(project.category);
  
  return techMatch && categoryMatch;
});
```

### Performance

- **Filter Response**: <500ms (requirement SC-008)
- **Optimization**: Pre-compute technology/category indices at build time
- **Debouncing**: No debouncing needed (clicks are naturally spaced)

### Accessibility Announcement

When filter results update:
```
Screen reader announces: "Showing 5 projects for React and TypeScript"
```

### Example

```typescript
const filterState: ProjectsFilterState = {
  selectedTechnologies: ["React", "TypeScript"],
  selectedCategories: ["web-app"],
  filteredProjects: [
    { id: "proj-001", title: "...", technologies: ["React", "TypeScript", "Node.js"], ... },
    { id: "proj-003", title: "...", technologies: ["React", "TypeScript", "GraphQL"], ... }
  ],
  totalProjects: 15,
  isLoading: false,
  lastFilterTime: 1709572200000
};
```

---

## 5. FormValidationState Entity

### Definition

**FormValidationState** tracks form field values, validation status, and error messages for the contact form.

### Structure

```typescript
interface FormValidationState {
  // Field values
  fields: {
    name: string;       // 0-100 characters
    email: string;      // 0+ characters (validated before submission)
    message: string;    // 0-5000 characters
    honeypot: string;   // Hidden field (should stay empty)
  };
  
  // Validation errors
  errors: {
    name?: string;      // Optional error message
    email?: string;
    message?: string;
  };
  
  // UI state
  touched: {
    name?: boolean;     // User has focused and blurred field
    email?: boolean;
    message?: boolean;
  };
  
  // Submission state
  isSubmitting: boolean;        // True while POST request in flight
  submitStatus: 'idle' | 'success' | 'error';
  submitError?: string;         // Error message if submission failed
  
  // Session recovery
  lastSavedAt?: number;         // Timestamp of last sessionStorage save
}
```

### Validation Rules

| Field | Rule | Severity | When Applied |
|-------|------|----------|--------------|
| `fields.name` | 1-100 characters; trim whitespace | ERROR | On blur, on submit |
| `fields.email` | Valid email format | ERROR | On blur, on submit |
| `fields.message` | 1-5000 characters; trim whitespace | ERROR | On blur, on submit |
| `fields.honeypot` | Must be empty string | SILENT | On submit |
| `errors.name` | Show only if field touched and invalid | UI | Conditional display |
| `errors.email` | Show only if field touched and invalid | UI | Conditional display |
| `errors.message` | Show only if field touched and invalid | UI | Conditional display |

### Inline Validation Logic

```typescript
function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'Name is required';
  if (trimmed.length > 100) return 'Name must be 100 characters or less';
  return undefined;
}

function validateEmail(email: string): string | undefined {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';
  return undefined;
}

function validateMessage(message: string): string | undefined {
  const trimmed = message.trim();
  if (trimmed.length === 0) return 'Message is required';
  if (trimmed.length > 5000) return 'Message must be 5000 characters or less';
  return undefined;
}
```

### Session Storage

Form data is automatically saved to `sessionStorage` on every field change:
```typescript
sessionStorage.setItem('contactForm', JSON.stringify(state.fields));
```

On page load, restore if exists:
```typescript
const saved = sessionStorage.getItem('contactForm');
if (saved) setFields(JSON.parse(saved));
```

On successful submission, clear:
```typescript
sessionStorage.removeItem('contactForm');
```

### Example

```typescript
const formState: FormValidationState = {
  fields: {
    name: "John Doe",
    email: "john@example.com",
    message: "Hi, I'd like to collaborate!",
    honeypot: ""
  },
  errors: {},
  touched: {
    name: true,
    email: true,
    message: true
  },
  isSubmitting: false,
  submitStatus: 'idle',
  lastSavedAt: 1709572200000
};
```

---

## 6. Relationships & Data Flow

### Data Flow Diagram

```
Page Load
  ├─ Load Projects array from src/data/projects.ts
  ├─ Initialize NavigationState (activeSection: 'hero')
  ├─ Initialize ProjectsFilterState (no filters)
  └─ Initialize FormValidationState (empty, restore from sessionStorage if exists)

User clicks "Projects" button
  ├─ NavigationState updates (activeSection: 'projects', isTransitioning: true)
  ├─ Announce to screen reader: "Navigated to Projects section"
  └─ Transition animation plays (prefers-reduced-motion respected)

User clicks technology filter
  ├─ ProjectsFilterState updates (selectedTechnologies: [selected])
  ├─ Filtered projects computed in <500ms
  ├─ Announce to screen reader: "Showing 5 projects for React"
  └─ Grid updates with animation (prefers-reduced-motion respected)

User fills contact form
  ├─ FormValidationState updates on each field change
  ├─ Inline validation runs (show errors if touched and invalid)
  ├─ Automatically save to sessionStorage
  └─ Focus moves to next field or submit button

User submits contact form
  ├─ Validate all fields (name, email, message)
  ├─ Check honeypot (silent rejection if filled)
  ├─ POST to /api/contact with ContactSubmission
  ├─ FormValidationState.isSubmitting = true
  ├─ On success: Show success message, clear form, clear sessionStorage
  └─ On failure: Show error, preserve fields in sessionStorage for retry
```

### Entity Dependencies

```
Project
  └─ Used in ProjectsFilterState.filteredProjects
  └─ Used in ProjectsGrid component rendering

ContactSubmission
  └─ Created from FormValidationState on successful validation
  └─ Sent to /api/contact edge function

NavigationState
  └─ Determines which section is visible
  └─ Drives Framer Motion animations
  └─ Updates active indicator in navigation bar

ProjectsFilterState
  └─ Derived from Projects array + selected filters
  └─ Recomputed in <500ms when filters change

FormValidationState
  └─ Converted to ContactSubmission on submit
  └─ Persisted to sessionStorage on every change
```

---

## 7. Build-Time Data Loading

### Project Data Source

Projects are defined in TypeScript at `src/data/projects.ts` and loaded at build time:

```typescript
// src/data/projects.ts
export const projects: Project[] = [
  {
    id: "project-001",
    title: "E-Commerce Analytics Dashboard",
    // ... (full project definition)
  },
  {
    id: "project-002",
    title: "Component Library",
    // ... (full project definition)
  },
  // ... (up to 20 projects)
];

// Computed at build time
export const allTechnologies = Array.from(
  new Set(projects.flatMap(p => p.technologies))
).sort();

export const allCategories = Array.from(
  new Set(projects.map(p => p.category).filter(Boolean))
).sort();
```

### Data Validation at Build Time

```typescript
// build-time validation script
export function validateProjectsData(projects: Project[]): void {
  projects.forEach((project, index) => {
    if (!project.id) throw new Error(`Project ${index} missing id`);
    if (!project.title) throw new Error(`Project ${index} missing title`);
    if (project.title.length > 60) throw new Error(`Project ${index} title too long`);
    // ... (validate all required fields)
  });
  console.log(`✅ Validated ${projects.length} projects`);
}
```

---

## 8. Validation Summary

### Build-Time Validation
- Project data structure and constraints
- Technology tags consistency
- Image file existence and format
- URL format validation

### Runtime Validation

**Client-Side (Immediate Feedback)**:
- Form field length limits
- Email format validation
- Honeypot detection (silent rejection)
- Navigation state consistency

**Server-Side (Security)**:
- Email format validation
- Message length validation
- Rate limiting by IP (3 submissions/hour)
- Honeypot detection
- CORS verification

---

## Next Steps

**Phase 1 (Design)** continues with:
1. ✅ `data-model.md` (this file)
2. `contracts/form-api.md`: Contact form POST endpoint specification
3. `contracts/image-delivery.md`: Image format negotiation
4. `quickstart.md`: Local dev setup and deployment
5. Agent context update

All entities defined and validated. Ready for API contract design.
