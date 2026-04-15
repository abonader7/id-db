export const STORAGE_KEYS = {
	theme: "theme",
	size: "text-size",
	spacing: "line-spacing",
} as const;

export const THEME_OPTIONS = ["light", "dark", "system"] as const;
export const SIZE_OPTIONS = ["small", "medium", "large"] as const;
export const SPACING_OPTIONS = ["tight", "medium", "wide"] as const;

export type ThemeOption = (typeof THEME_OPTIONS)[number];
export type SizeOption = (typeof SIZE_OPTIONS)[number];
export type SpacingOption = (typeof SPACING_OPTIONS)[number];

export const SIZE_MAP: Record<SizeOption, string> = {
	small: "12px",
	medium: "14px",
	large: "16px",
};

export const LINE_MAP: Record<SpacingOption, string> = {
	tight: "1.35",
	medium: "1.6",
	wide: "1.9",
};

export const HEADING_LINE_MAP: Record<SpacingOption, string> = {
	tight: "1.1",
	medium: "1.2",
	wide: "1.25",
};

const SYSTEM_THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

const isThemeOption = (value: string | null): value is ThemeOption =>
	value !== null && THEME_OPTIONS.includes(value as ThemeOption);

const isSizeOption = (value: string | null): value is SizeOption =>
	value !== null && SIZE_OPTIONS.includes(value as SizeOption);

const isSpacingOption = (value: string | null): value is SpacingOption =>
	value !== null && SPACING_OPTIONS.includes(value as SpacingOption);

const resolveSystemTheme = (): Exclude<ThemeOption, "system"> =>
	window.matchMedia(SYSTEM_THEME_MEDIA_QUERY).matches ? "dark" : "light";

export const getStoredAppearanceSelection = () => {
	const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
	const storedSize = localStorage.getItem(STORAGE_KEYS.size);
	const storedSpacing = localStorage.getItem(STORAGE_KEYS.spacing);

	return {
		theme: isThemeOption(storedTheme) ? storedTheme : "system",
		size: isSizeOption(storedSize) ? storedSize : "medium",
		spacing: isSpacingOption(storedSpacing) ? storedSpacing : "medium",
	} as const;
};

export const applyThemePreference = (
	theme: ThemeOption,
	root: HTMLElement = document.documentElement,
	persist = true,
) => {
	const resolvedTheme = theme === "system" ? resolveSystemTheme() : theme;
	root.dataset.theme = resolvedTheme;
	root.classList.toggle("dark", resolvedTheme === "dark");

	if (!persist) return;

	if (theme === "system") {
		localStorage.removeItem(STORAGE_KEYS.theme);
		return;
	}

	localStorage.setItem(STORAGE_KEYS.theme, theme);
};

export const applySizePreference = (
	size: SizeOption,
	root: HTMLElement = document.documentElement,
	persist = true,
) => {
	const appliedSize = SIZE_MAP[size];
	root.style.fontSize = appliedSize;
	root.style.setProperty("--app-font-size", appliedSize);

	if (persist) {
		localStorage.setItem(STORAGE_KEYS.size, size);
	}
};

export const applySpacingPreference = (
	spacing: SpacingOption,
	root: HTMLElement = document.documentElement,
	persist = true,
) => {
	const lineHeight = LINE_MAP[spacing];
	const headingLineHeight = HEADING_LINE_MAP[spacing];

	root.style.lineHeight = lineHeight;
	root.style.setProperty("--app-line-height", lineHeight);
	root.style.setProperty("--app-line-height-headings", headingLineHeight);

	if (persist) {
		localStorage.setItem(STORAGE_KEYS.spacing, spacing);
	}
};

export const applyStoredAppearance = (root: HTMLElement = document.documentElement) => {
	const { theme, size, spacing } = getStoredAppearanceSelection();
	applyThemePreference(theme, root, false);
	applySizePreference(size, root, false);
	applySpacingPreference(spacing, root, false);
};
