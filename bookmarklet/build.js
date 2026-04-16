'use strict';
/**
 * build.js – Compile bookmarklet sources into bookmarklet.html
 *
 * Usage:
 *   node build.js                   – build all entries
 *   node build.js artikel-info-tooltip ampel-highlighter  – build named entries
 *
 * Why Node.js instead of PowerShell:
 *   PowerShell's Get-Content reads UTF-8 files as Windows-1252 by default,
 *   turning multi-byte chars (»«·…✓) into mojibake before EscapeDataString
 *   encodes them. Node.js and terser treat everything as UTF-8, and
 *   encodeURIComponent encodes code-points correctly in a single pass.
 *
 * Each entry:
 *   name   – identifier used on the CLI
 *   source – source .js file (relative to this script)
 *   marker – plain ASCII string that appears verbatim inside the (URL-encoded)
 *            href of the target <a> tag; used to locate the correct bookmark
 *            in bookmarklet.html without relying on fragile line numbers.
 */

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');

const HTML_PATH = path.resolve(__dirname, 'bookmarklet.html');

const BOOKMARKLETS = [
  {
    name:   'artikel-info-tooltip',
    source: 'artikel-info-source.js',
    marker: '__bk_tip_panel',
  },
  {
    name:   'artikel-info-relay',
    source: 'artikel-info-receptor-source.js',
    marker: '__tg_relay_badge',
  },
  {
    name:   'ampel-highlighter',
    source: 'ampel-highlighter-source.js',
    marker: '__bk_ampel_panel',
  },
  {
    name:   'abgang-trend',
    source: 'abgang-trend-source.js',
    marker: '__bk_trend_panel',
  },
  {
    name:   'bv-autofill',
    source: 'bv-autofill-source.js',
    marker: '__bk_bvfill_panel',
  },
  {
    name:   'bv-auto',
    source: 'bv-auto-source.js',
    marker: '__bk_auto_modal',
  },
  {
    name:   'pal-loeschen',
    source: 'pal-loeschen-source.js',
    marker: '__bk_pal_modal',
  },
  {
    name:   'pb-recommend',
    source: 'pb-recommend-source.js',
    marker: '__bk_pb_panel',
  },
  {
    name:   'mhd-entscheidung',
    source: 'mhd-entscheidung-source.js',
    marker: '__bk_mhd_panel',
  },
  {
    name:   'suche',
    source: 'suche-source.js',
    marker: '__bk_exsearch_panel',
  },
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function build(entry) {
  const { name, source, marker } = entry;
  const srcPath = path.resolve(__dirname, source);

  if (!fs.existsSync(srcPath)) {
    console.error(`  [${name}] ERROR: source file not found: ${source}`);
    process.exitCode = 1;
    return false;
  }

  console.log(`Building ${name} …`);

  // terser reads the source file in its own Node.js process (UTF-8 correct).
  // execSync with encoding:'utf8' returns the minified JS as a proper string.
  const minified = execSync(
    `npx terser "${srcPath}" --compress --mangle`,
    { encoding: 'utf8', cwd: __dirname }
  ).trimEnd();

  // encodeURIComponent in Node.js encodes each Unicode code-point in a single
  // pass – no double-encoding, no Windows-1252 interpretation.
  const href = 'javascript:' + encodeURIComponent(minified);

  let html = fs.readFileSync(HTML_PATH, 'utf8');

  // URL encoding leaves plain ASCII (a-z A-Z 0-9 _ - . ! ~ * ' ( )) unencoded,
  // so the marker string always appears verbatim inside the href, regardless of
  // whether the surrounding href uses %7B-style encoding or raw JS syntax.
  const re = new RegExp(
    `(<a[^>]+class="[^"]*bm-link[^"]*"[^>]+href=")(javascript:[^"]*${escapeRegex(marker)}[^"]*?)(")`,
    'm'
  );

  const updated = html.replace(re, (_, pre, _old, post) => pre + href + post);

  if (updated === html) {
    console.error(`  [${name}] ERROR: marker "${marker}" not found in bookmarklet.html`);
    process.exitCode = 1;
    return false;
  }

  fs.writeFileSync(HTML_PATH, updated, 'utf8');
  console.log(`  Done · ${minified.length} chars minified · href ${href.length} chars`);
  return true;
}

const targets = process.argv.slice(2);
const entries = targets.length
  ? BOOKMARKLETS.filter(b => targets.includes(b.name))
  : BOOKMARKLETS;

if (!entries.length) {
  const names = BOOKMARKLETS.map(b => b.name).join(', ');
  console.error(`No matching bookmarklets found.\nAvailable: ${names}`);
  process.exit(1);
}

for (const entry of entries) {
  build(entry);
}
