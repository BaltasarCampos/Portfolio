/**
 * Shared TypeScript type definitions for the portfolio site.
 * All entities are defined here; import from '@types' alias.
 */

// =============================================================================
// CORE ENTITIES
// =============================================================================

/** A single portfolio project entity. */
export interface Project {
  /** Unique identifier (slug format, e.g. "astro-portfolio") */
  readonly id: string;
  /** Project title — max 60 characters */
  readonly title: string;
  /** Short description — 100–300 characters */
  readonly description: string;
  /** Array of technology tags (e.g. ["React", "TypeScript"]) */
  readonly technologies: readonly string[];
  /** Primary category for filtering */
  readonly category: ProjectCategory;
  /** Thumbnail image metadata */
  readonly thumbnail: ProjectImage;
  /** Optional live demo URL */
  readonly demoUrl?: string;
  /** Optional repository URL (GitHub, GitLab, etc.) */
  readonly repositoryUrl?: string;
  /** Pin this project to the top of the grid */
  readonly featured: boolean;
}

/** Project thumbnail image metadata */
export interface ProjectImage {
  /** Path relative to public/images/projects/ or full URL */
  readonly src: string;
  /** Descriptive alt text — 1–120 characters (required for accessibility) */
  readonly alt: string;
  /** Intrinsic width in pixels (required to prevent CLS) */
  readonly width: number;
  /** Intrinsic height in pixels (required to prevent CLS) */
  readonly height: number;
}

/** Valid project categories */
export type ProjectCategory =
  | 'web-app'
  | 'mobile'
  | 'open-source'
  | 'design-system'
  | 'tool'
  | 'experiment';

// =============================================================================
// CONTACT FORM
// =============================================================================

/** A contact form submission entity */
export interface ContactSubmission {
  /** UUID v4 generated at submission time */
  readonly id: string;
  /** ISO 8601 timestamp of submission */
  readonly submittedAt: string;
  /** Visitor's name — 1–100 characters */
  readonly name: string;
  /** Visitor's email address — valid email format */
  readonly email: string;
  /** Message body — 1–5000 characters */
  readonly message: string;
  /** Honeypot field — must be empty for legitimate submissions */
  readonly honeypot: string;
  /** Client IP address (from x-forwarded-for header) */
  readonly clientIp: string;
  /** Submission delivery status */
  readonly status: ContactSubmissionStatus;
  /** Error details if status is 'failed' */
  readonly errorMessage?: string;
}

export type ContactSubmissionStatus = 'pending' | 'sent' | 'failed';

// =============================================================================
// NAVIGATION STATE
// =============================================================================

/** Valid section identifiers */
export type SectionId = 'hero' | 'projects' | 'about' | 'contact';

/** Navigation state tracked as user scrolls */
export interface NavigationState {
  readonly activeSection: SectionId;
  readonly previousSection: SectionId | null;
  readonly isTransitioning: boolean;
}

// =============================================================================
// PROJECTS FILTER STATE
// =============================================================================

/** State for the project grid filter UI */
export interface ProjectsFilterState {
  /** Currently selected technology filters */
  readonly selectedTechnologies: readonly string[];
  /** Currently selected category filters */
  readonly selectedCategories: readonly ProjectCategory[];
  /** Projects after filtering is applied */
  readonly filteredProjects: readonly Project[];
  /** Total projects before filtering */
  readonly totalProjects: number;
  /** True while filter animation is in progress */
  readonly isLoading: boolean;
}

// =============================================================================
// FORM VALIDATION STATE
// =============================================================================

/** Individual field state */
export interface FieldState {
  readonly value: string;
  readonly error: string | undefined;
  readonly touched: boolean;
}

/** Form-wide validation and submission state */
export interface FormValidationState {
  readonly name: FieldState;
  readonly email: FieldState;
  readonly message: FieldState;
  readonly honeypot: FieldState;
  readonly isSubmitting: boolean;
  readonly submitStatus: FormSubmitStatus | null;
  readonly submitError: string | null;
}

export type FormSubmitStatus = 'success' | 'error' | 'rate-limited';

// =============================================================================
// API TYPES
// =============================================================================

/** Request body for POST /api/contact */
export interface ContactFormRequest {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly honeypot: string;
}

/** Success response from POST /api/contact */
export interface ContactFormSuccessResponse {
  readonly success: true;
  readonly message: string;
  readonly submissionId: string;
}

/** Error response from POST /api/contact */
export interface ContactFormErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly fields?: Partial<Record<keyof ContactFormRequest, string>>;
}

export type ContactFormResponse = ContactFormSuccessResponse | ContactFormErrorResponse;
