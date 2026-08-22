/**
 * Self-contained tsdown preset for this plugin's browser client bundle.
 * Minimal copy of the official clientBundle preset (packages/client/tsdown.client.ts):
 * emits a closure-factory artifact that calls
 * window.__ModuleLoader__.load({ id, factory }) and resolves externals
 * through the injected require (loader module table). CSS Modules are
 * compiled by lightningcss inside the bundle: importing x.module.css yields
 * the hashed class map, and the css text auto-injects a
 * <style data-plugin="<id>"> tag at factory execution.
 */
import { readFile } from 'node:fs/promises'
import { basename, dirname, isAbsolute, resolve as resolvePath } from 'node:path'
import type { UserConfig } from 'tsdown'
import { transform } from 'lightningcss'

/** Bundle id under the web GUI loader module table.
 *
 * v6 audit-fix: the load id must be the bundle's graph-row id
 * (matching the package's `name` field and the framework's
 * `arrive()` invariant at
 * `packages/client/modules/src/client/system.ts:104-110` and
 * `manifest.ts:192`). For `@zach-tao/dsh-specify-subagent-suite` the
 * `cordis.patch.yml` row id is `specify-subagent-suite` (Phase 0.2);
 * the package `name` is `@zach-tao/dsh-specify-subagent-suite`
 * (Phase 0.1); the LOADER id is the latter (the `name`, not the
 * row id) — the framework serves `/plugins/<name>/client.js` and
 * rejects a bundle that does not register that id at runtime. */
const ID = '@zach-tao/dsh-specify-subagent-suite'

/**
 * Virtual-id wrapper keeping module CSS away from tsdown's own css pipeline
 * (which requires @tsdown/css). The suffix matters: tsdown's guard matches ids
 * ending in '.css', so the virtual id must not.
 */
const CSS_VIRTUAL_PREFIX = '\0dsh-css:'
const CSS_VIRTUAL_SUFFIX = '.mjs'

/**
 * Externals resolved from the loader module table: the platform seed entries.
 * Everything else (none in this plugin) must inline.
 */
const EXTERNALS: readonly string[] = ['react', 'react/jsx-runtime']

/** Resolve a relative CSS import against its importer's directory. */
function sourceAssetPath(source: string, importer: string): string {
  const base = isAbsolute(importer) ? dirname(importer) : dirname(resolvePath(process.cwd(), importer))
  return resolvePath(base, source)
}

const config: UserConfig = {
  name: `${ID}/client`,
  // v6 audit-fix (R7): single entry that combines the three client
  // halves into one self-contained factory. tsdown inlines the
  // imported sub-files so the produced `lib/client.js` has no
  // relative `require()` that the framework loader cannot resolve.
  entry: { client: 'src/index.js' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: false,
  clean: false,
  external: [...EXTERNALS],
  // tsdown auto-externalizes package dependencies; anything NOT in the
  // loader module table must inline instead. A require() the table cannot
  // answer is a guaranteed runtime throw.
  noExternal: (id: string) => (EXTERNALS.includes(id) ? undefined : true),
  // Browser bundles inline node-idiom deps; define the env probes a CJS
  // output cannot carry (same substitutions as the official preset).
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    'import.meta.env': JSON.stringify({ MODE: process.env.NODE_ENV ?? 'production' }),
  },
  plugins: [{
    // Bundle purity gate (build-time mirror of the module-edge rules):
    // platform seed entries stay external, and every other @deepseek-ai
    // VALUE import is a build error — a cross-plugin value import would
    // inline a duplicate runtime instance (type-only imports are erased and
    // never reach this gate). Collaborations go through cordis services.
    name: 'dsh-client-bundle-purity',
    resolveId(source: string) {
      if (!source.startsWith('@deepseek-ai/')) return null
      if (EXTERNALS.includes(source)) return null // platform module: external wins
      throw new Error(
        `client bundle purity: "${source}" is not a platform module (EXTERNALS) — `
        + 'cross-plugin value imports are forbidden; collaborate through cordis services '
        + '(type-only imports are erased and never reach this gate)',
      )
    },
  }, {
    name: 'dsh-css-modules-inline',
    resolveId(source: string, importer: string | undefined) {
      if (!source.endsWith('.module.css')) return null
      const abs = importer !== undefined ? sourceAssetPath(source, importer) : source
      return CSS_VIRTUAL_PREFIX + abs + CSS_VIRTUAL_SUFFIX
    },
    async load(virtualId: string) {
      if (!virtualId.startsWith(CSS_VIRTUAL_PREFIX)) return null
      const fileId = virtualId.slice(CSS_VIRTUAL_PREFIX.length, -CSS_VIRTUAL_SUFFIX.length)
      // The virtual id otherwise hides the physical stylesheet from Rolldown's watch graph.
      this.addWatchFile(fileId)
      const source = await readFile(fileId)
      const { code, exports: cssExports } = transform({
        filename: fileId,
        code: source,
        cssModules: { pattern: '[hash]_[local]' },
        minify: true,
      })
      const classMap: Record<string, string> = {}
      for (const [local, exp] of Object.entries(cssExports ?? {})) classMap[local] = exp.name
      // One <style data-plugin> per module file; idempotent under re-evaluation.
      return [
        `const css = ${JSON.stringify(code.toString())};`,
        `const tagId = ${JSON.stringify(`${ID}/${basename(fileId)}`)};`,
        'if (typeof document !== \'undefined\' && document.querySelector(\'style[data-plugin-css=\' + JSON.stringify(tagId) + \']\') === null) {',
        '  const tag = document.createElement(\'style\');',
        `  tag.dataset.plugin = ${JSON.stringify(ID)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
    },
  }],
  outputOptions: {
    // MERGE NOTE (Phase 0.5.3 + v6 audit-fix; wording corrected at v9
    // re-sync — it previously claimed a split `lib/client/composer.js`
    // output): single-entry output to `lib/client.js` as a CJS factory
    // wrapped by the banner's `__ModuleLoader__.load({id, factory})`.
    // The merged client halves are inlined here; the pre-merge
    // composer.tsx uses `exports.apply` / `exports.inject`, so the
    // factory return is the CJS module-exports object and the merged
    // entry reads `composerMod.apply` directly.
    entryFileNames: 'client.js',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
  },
}

export default config