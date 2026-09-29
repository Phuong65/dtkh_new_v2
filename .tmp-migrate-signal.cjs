// Temporary migration helper for Angular 21 signal-first refactor (lop-hoc-phan).
// Converts mechanical TS patterns. Test carefully; do not rely on it for HTML.
const fs = require('fs');
const path = require('path');
const ROOT = 'D:/data/project/angular/v21/dtkh_new_v2/src/app/modules/admin/features/lop-hoc-phan';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.component.ts')) out.push(p);
  }
  return out;
}

function ensureCoreImport(s) {
  // Ensure signal/computed/input/output/viewChild/viewChildren/contentChild/contentChildren/inject are imported from '@angular/core' if used.
  const want = ['signal', 'computed', 'input', 'output', 'viewChild', 'viewChildren', 'contentChild', 'contentChildren', 'inject'];
  const used = want.filter(k => new RegExp(`\\b${k}\\s*\\(\\s*`).test(s) || new RegExp(`\\b${k}\\s*[;.<>=]`).test(s));
  if (!used.length) return s;
  const m = s.match(/import\s*\{([^}]*)\}\s*from\s*'@angular\/core'/);
  if (!m) return s;
  const names = m[1].split(',').map(x => x.trim()).filter(Boolean);
  for (const k of used) {
    if (!names.includes(k)) { names.push(k); }
  }
  // Remove legacy decorator names from the core import if they are no longer used as decorators in the file.
  const legacy = ['Input', 'Output', 'ViewChild', 'ViewChildren', 'ContentChild', 'ContentChildren', 'NgModule'];
  const filtered = names.filter(n => {
    if (n === 'inject' || n === 'input' || n === 'output' || n === 'viewChild' || n === 'viewChildren' || n === 'contentChild' || n === 'contentChildren' || n === 'signal' || n === 'computed') return true;
    if (!legacy.includes(n)) return true;
    // keep only if still used as a decorator
    return new RegExp('@' + n + '\\b').test(s);
  });
  const newImport = `import { ${filtered.join(', ')} } from '@angular/core'`;
  return s.replace(m[0], newImport);
}

function processInputsAndViews(s) {
  // name = input<Type>();  ->  name = input<Type>();
  // name = input();         ->  name = input();
  let s2 = s.replace(/@Input\(\)\s+([A-Za-z_$][\w$]*)\s*:\s*([^;=\n]+);/g, (mm, n, t) => {
    return `${n} = input<${t.trim()}>();`;
  });
  s2 = s2.replace(/@Input\(\)\s+([A-Za-z_$][\w$]*)\s*;/g, (mm, n) => `${n} = input();`);

  // x = viewChild<T>('sel'); / x = viewChild<T>(Selector);
  s2 = s2.replace(/@ViewChild\(\s*(['"][^'"]+['"]|[A-Za-z_$][\w$]*)\s*\)\s+([A-Za-z_$][\w$]*)\s*:\s*([^;=]+);/g, (mm, sel, n, t) => {
    return `${n} = viewChild<${t.trim()}>(${sel});`;
  });
  s2 = s2.replace(/@ViewChildren\(\s*(['"][^'"]+['"]|[A-Za-z_$][\w$]*)\s*\)\s+([A-Za-z_$][\w$]*)\s*:\s*([^;=]+);/g, (mm, sel, n, t) => {
    return `${n} = viewChildren<${t.trim()}>(${sel});`;
  });
  s2 = s2.replace(/@ContentChild\(\s*(['"][^'"]+['"]|[A-Za-z_$][\w$]*)\s*\)\s+([A-Za-z_$][\w$]*)\s*:\s*([^;=]+);/g, (mm, sel, n, t) => {
    return `${n} = contentChild<${t.trim()}>(${sel});`;
  });
  s2 = s2.replace(/@ContentChildren\(\s*(['"][^'"]+['"]|[A-Za-z_$][\w$]*)\s*\)\s+([A-Za-z_$][\w$]*)\s*:\s*([^;=]+);/g, (mm, sel, n, t) => {
    return `${n} = contentChildren<${t.trim()}>(${sel});`;
  });
  return s2;
}

function collectSignalVars(s) {
  const vars = [];
  const dec = s.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*(?:input|viewChild|viewChildren|contentChild|contentChildren)(?:<[^>]*>)?\(/g);
  for (const m of dec) vars.push(m[1]);
  return vars;
}

function convertThisAccess(s, vars) {
  let s2 = s;
  for (const v of vars) {
    // Only rewrite within class body (skip the declaration line itself).
    const reProp = new RegExp('this\\.' + v + '\\.', 'g');
    s2 = s2.replace(reProp, 'this.' + v + '().');
    // Bare reference before non-paren punct/space/&&/||/?/]/}/;/:
    const reBare = new RegExp('this\\.' + v + '(?![\\w$.(])', 'g');
    s2 = s2.replace(reBare, 'this.' + v + '()');
  }
  return s2;
}

function convertConstructorDI(s) {
  // Find constructors whose params are all `(private|public|protected) name: Type`.
  // Convert each to a class-field inject() and leave a no-arg constructor.
  const lines = s.split('\n');
  const out = [];
  let i = 0;
  let changed = 0;
  while (i < lines.length) {
    const line = lines[i];
    const cm = line.match(/^\s*constructor\s*\(/);
    if (cm) {
      // gather until matching close paren (account for nested parens)
      let j = i;
      const params = [];
      let buf = line.substring(line.indexOf('(') + 1);
      let depth = 1;
      // read params across lines until depth 0
      while (true) {
        for (const ch of buf) {
          if (ch === '(') depth++;
          else if (ch === ')') depth--;
        }
        if (depth <= 0) break;
        j++;
        buf = lines[j];
      }
      // get the full param text (the span from i..j), last line may have ') ... ) {' or ') {'
      const fullParamText = lines.slice(i, j + 1);
      // join and extract params content between first '(' and last ')'
      const joined = fullParamText.join('\n');
      const pi = joined.indexOf('(');
      const pl = joined.lastIndexOf(')');
      const paramBlock = joined.substring(pi + 1, pl);
      const paramList = paramBlock.split(',').map(x => x.trim()).filter(Boolean);
      const allDi = paramList.length > 0 && paramList.every(p => /^(private|public|protected)\s+[A-Za-z_$][\w$]*\s*:\s*/.test(p));
      if (allDi) {
        const injectFields = paramList.map(p => {
          const mm = p.match(/^(?:private|public|protected)\s+([A-Za-z_$][\w$]*)\s*:\s*(.+)$/);
          return `    private ${mm[1]} = inject(${mm[2].trim()});`;
        });
        for (const f of injectFields) out.push(f);
        out.push('');
        out.push('    constructor() {');
        changed++;
      } else {
        // Not an all-DI constructor: keep every original line untouched.
        for (let k = i; k <= j; k++) out.push(lines[k]);
      }
      i = j + 1;
    } else {
      out.push(line);
      i++;
    }
  }
  return { out: out.join('\n'), changed };
}

const target = process.argv[2];
const files = target ? [target] : walk(ROOT);
for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  s = processInputsAndViews(s);
  const vars = collectSignalVars(s);
  const { out, changed } = convertConstructorDI(s);
  s = out;
  // Convert this.<var>. and bare this.<var> AFTER DI so the new inject fields don't collide.
  s = convertThisAccess(s, vars);
  s = ensureCoreImport(s);
  if (s !== fs.readFileSync(f, 'utf8')) {
    fs.writeFileSync(f, s);
    console.log('UPDATED', f, '| constructorDI:', changed);
  }
}
console.log('done');