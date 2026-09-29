const fs = require('fs');
const path = require('path');
const base = 'C:/Users/2311/AppData/Roaming/Code/User/History';
const hits = [];
for (const d of fs.readdirSync(base)) {
  const dir = path.join(base, d);
  let st; try { st = fs.statSync(dir); } catch { continue; }
  if (!st.isDirectory()) continue;
  const ej = path.join(dir, 'entries.json');
  if (!fs.existsSync(ej)) continue;
  try {
    const txt = fs.readFileSync(ej, 'utf8');
    if (/thao-luan/i.test(txt)) {
      const data = JSON.parse(txt);
      const out = { dir, files: [] };
      const entries = Array.isArray(data) ? data : (data && data.entries ? data.entries : []);
      // entries.json is usually { version, resource, entries:[{id, timestamp, source}] }
      const src = data && data.source ? data.source : null;
      out.meta = { source: src };
      for (const k of Object.keys(data || {})) { if (/file|entry|id/i.test(k)) out.files.push(String(data[k])); }
      hits.push(out);
      const files = fs.readdirSync(dir).filter(f => f !== 'entries.json');
      console.log('DIR', dir, '| metaSource:', src, '| otherFiles:', files.join(','));
    }
  } catch (e) { /* ignore */ }
}
console.log('TOTAL matching dirs:', hits.length);