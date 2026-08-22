/**
 * Preset chip tone: a stable background+foreground pair the chip renders with
 * so a glance at the one-shot subagent banner tells which preset the recorded
 * subagent ran under.
 *
 * Logic and palette copied from DSH's stock `preset-tone.ts`
 * (packages/client/ui-agent-preset/src/client/preset-tone.ts) — the host picks
 * a hash-stable color slot for every authored id, and ships two variants per
 * tone so the chip stays readable in both light and dark themes. This plugin
 * does NOT depend on the stock module (the ambient-shim build never links
 * @deepseek-ai/* packages), so the four-tone table is duplicated verbatim.
 *
 * Each shipped preset gets a hand-tuned tone so the four built-ins read as
 * distinct capability badges. Authored presets hash their id into one of a
 * fixed palette of soft tints; the swatches are chosen so every authored
 * entry sits at least 30° in hue from every shipped entry — the contract
 * the palette has to honour is "never confuse a built-in with a user preset
 * in slot N", not "guarantee a glance-distinguishable swatch for every
 * pair of authored ids". The 6-slot palette covers a wide enough range that
 * a hash collision between two authored ids can still land on neighbours
 * that read as the same hue band (emerald ≈ 155° and teal ≈ 170° are 15°
 * apart), which is the trade-off for fitting a small palette outside the
 * four shipped bands.
 *
 * Each tone ships in two variants: a light and a dark. The chip's CSS module
 * picks the matching variant under `@media (prefers-color-scheme: dark)`,
 * so the chip stays readable in both themes.
 *
 * The hash is a 32-bit FNV-1a, picked for being dependency-free and stable
 * across browsers; the chip never changes id within one session, so caching
 * is unnecessary.
 */

/** A background+foreground pair the chip CSS resolves via custom properties. */
export interface PresetTone {
  /** CSS color used for the chip background under the light theme. */
  readonly background: string
  /** CSS color used for the chip foreground (text + icon) under the light theme. */
  readonly foreground: string
  /** CSS color used for the chip background under the dark theme. */
  readonly backgroundDark: string
  /** CSS color used for the chip foreground under the dark theme. */
  readonly foregroundDark: string
}

/** Hand-picked tones for the four shipped presets, ordered by capability. */
const SHIPPED_TONES: Readonly<Record<string, PresetTone>> = {
  // The default: a calm blue that says "general purpose" without shouting.
  standard: {
    background: 'rgba(59, 130, 246, 0.16)',
    foreground: '#1d4ed8',
    backgroundDark: 'rgba(96, 165, 250, 0.22)',
    foregroundDark: '#bfdbfe',
  },
  // Code mode: violet to mark "this one writes programs".
  code: {
    background: 'rgba(139, 92, 246, 0.18)',
    foreground: '#6d28d9',
    backgroundDark: 'rgba(167, 139, 250, 0.24)',
    foregroundDark: '#ddd6fe',
  },
  // Minimal: neutral slate so the chip recedes next to the louder options.
  minimal: {
    background: 'rgba(100, 116, 139, 0.16)',
    foreground: '#475569',
    backgroundDark: 'rgba(148, 163, 184, 0.20)',
    foregroundDark: '#cbd5e1',
  },
  // Cordis / Creator: amber, the only warm tone — author work stands out.
  cordis: {
    background: 'rgba(245, 158, 11, 0.18)',
    foreground: '#b45309',
    backgroundDark: 'rgba(251, 191, 36, 0.24)',
    foregroundDark: '#fde68a',
  },
}

/**
 * Palette for authored presets. Each entry sits at least 30° hue away from
 * every shipped tone (standard ≈ 220, code ≈ 255, minimal ≈ 215, cordis ≈ 40),
 * so a hash into this 6-slot palette never lands an authored id on a swatch
 * that reads as a built-in. Adjacent-array contrast is not claimed —
 * emerald (≈ 155°) and teal (≈ 170°) sit 15° apart, so two authored ids that
 * hash to neighbouring slots can still read as the same hue band; the
 * trade-off for fitting a 6-slot palette outside the four shipped bands.
 * Index by FNV-1a hash of the id.
 */
const AUTHOR_PALETTE: readonly PresetTone[] = [
  // emerald — hue ≈ 155, far from every shipped swatch.
  {
    background: 'rgba(16, 185, 129, 0.16)',
    foreground: '#047857',
    backgroundDark: 'rgba(52, 211, 153, 0.20)',
    foregroundDark: '#6ee7b7',
  },
  // pink — hue ≈ 330.
  {
    background: 'rgba(244, 114, 182, 0.18)',
    foreground: '#be185d',
    backgroundDark: 'rgba(249, 168, 212, 0.22)',
    foregroundDark: '#fbcfe8',
  },
  // teal — hue ≈ 170.
  {
    background: 'rgba(20, 184, 166, 0.18)',
    foreground: '#0f766e',
    backgroundDark: 'rgba(45, 212, 191, 0.20)',
    foregroundDark: '#99f6e4',
  },
  // lime — hue ≈ 80; far enough from cordis (hue ≈ 40) to read as distinct.
  {
    background: 'rgba(132, 204, 22, 0.18)',
    foreground: '#4d7c0f',
    backgroundDark: 'rgba(163, 230, 53, 0.22)',
    foregroundDark: '#d9f99d',
  },
  // magenta — hue ≈ 290; far enough from code (hue ≈ 255).
  {
    background: 'rgba(217, 70, 239, 0.18)',
    foreground: '#a21caf',
    backgroundDark: 'rgba(232, 121, 249, 0.22)',
    foregroundDark: '#f5d0fe',
  },
  // red — hue ≈ 0.
  {
    background: 'rgba(239, 68, 68, 0.14)',
    foreground: '#b91c1c',
    backgroundDark: 'rgba(248, 113, 113, 0.20)',
    foregroundDark: '#fecaca',
  },
]

/** FNV-1a 32-bit hash. Stable, allocation-free, good enough for palette bucketing. */
function hashId(id: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < id.length; index++) {
    hash ^= id.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  // Unsigned right shift so the result is non-negative.
  return hash >>> 0
}

/**
 * Resolve the tone for one preset id.
 * @param id - the preset id the chip is rendering.
 * @returns a four-color tone (light + dark bg/fg). Shipped ids map to fixed
 * tones; authored ids land on a hash-stable slot in `AUTHOR_PALETTE`.
 */
export function presetTone(id: string): PresetTone {
  const shipped = SHIPPED_TONES[id]
  if (shipped !== undefined) return shipped
  const palette = AUTHOR_PALETTE
  const fallback = palette[0]
  if (fallback === undefined)
    throw new Error('preset-tone: AUTHOR_PALETTE must be non-empty')
  return palette[hashId(id) % palette.length] ?? fallback
}

/**
 * Serialize a tone as inline CSS custom properties the chip module reads.
 * @param tone - the tone to render.
 * @returns a `style` prop value carrying four custom properties
 * (`--preset-tone-bg`, `--preset-tone-fg`, plus their `-dark` siblings).
 * The CSS module picks the matching variant under
 * `@media (prefers-color-scheme: dark)`.
 */
export function presetToneStyle(tone: PresetTone): {
  '--preset-tone-bg': string
  '--preset-tone-fg': string
  '--preset-tone-bg-dark': string
  '--preset-tone-fg-dark': string
} {
  return {
    '--preset-tone-bg': tone.background,
    '--preset-tone-fg': tone.foreground,
    '--preset-tone-bg-dark': tone.backgroundDark,
    '--preset-tone-fg-dark': tone.foregroundDark,
  }
}