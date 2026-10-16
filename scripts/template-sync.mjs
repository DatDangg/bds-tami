#!/usr/bin/env node
/**
 * template-sync.mjs — Kéo cập nhật mới nhất từ template canonical vào một project.
 *
 * Chỉ ghi đè các path thuộc quyền TEMPLATE (managedPaths):
 *   AGENTS.md · CLAUDE.md · .agent/ · .opencode/ · .claude/{agents,commands,skills,hooks}/ · scripts/ · skills/
 * KHÔNG BAO GIỜ đụng: code, SPECIFICATIONS.md, BRIEF.md, docs/, spec/, tasks/,
 * .context/, .devops/, .env*, package.json, .gitignore, README.md.
 *
 * CÁCH DÙNG (chạy từ bất kỳ đâu):
 *   node scripts/template-sync.mjs                       # project = thư mục cha của scripts/
 *   node scripts/template-sync.mjs --project /path/proj  # chỉ định project đích
 *   node scripts/template-sync.mjs --dry-run             # chỉ xem, KHÔNG ghi
 *   node scripts/template-sync.mjs --prune               # xoá file template đã bỏ (trong managedPaths)
 *   node scripts/template-sync.mjs --template <git-url>  # đổi nguồn template
 *   node scripts/template-sync.mjs --no-config           # bỏ qua .template-sync.json
 *
 * Config tuỳ chọn: <project>/.template-sync.json
 *   { "managedPaths": [...], "reportOnlyPaths": [...], "templateRepo": "..." }
 *
 * An toàn: nếu managedPaths đang có thay đổi CHƯA COMMIT trong project → script DỪNG,
 * không ghi đè. Mọi thay đổi đều nằm trong git của project → xem `git diff`, hoàn tác `git checkout --`.
 */

import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TEMPLATE_REPO = 'git@github.com:ocanhdt12-gif/opencode-project-template.git'
const BRANCH = 'main'

const DEFAULTS = {
  // Path thuộc quyền template → tự đồng bộ (ghi đè bằng bản template mới nhất).
  managedPaths: ['AGENTS.md', 'CLAUDE.md', '.agent', '.opencode', '.claude/agents', '.claude/commands', '.claude/skills', '.claude/hooks', 'scripts', 'skills'],
  // Path chỉ CẢNH BÁO drift, KHÔNG tự ghi đè (project thường tuỳ biến).
  reportOnlyPaths: ['opencode.jsonc', '.claude/settings.json'],
}

const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined }

if (has('-h') || has('--help')) { usage(); process.exit(0) }

const dryRun = has('--dry-run')
const prune = has('--prune')
const noConfig = has('--no-config')

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const inferredRoot = path.resolve(scriptDir, '..')
const ROOT = opt('--project') ? path.resolve(opt('--project')) : inferredRoot

function usage() {
  console.log(`template-sync — đồng bộ project với template mới nhất

  node scripts/template-sync.mjs [--project DIR] [--dry-run] [--prune] [--template URL] [--no-config]

  --project DIR   project đích (mặc định: thư mục cha của scripts/)
  --dry-run       chỉ liệt kê thay đổi, KHÔNG ghi
  --prune         xoá file template đã bỏ khỏi các managedPaths
  --template URL  nguồn template khác (mặc định: ${TEMPLATE_REPO})
  --no-config     bỏ qua <project>/.template-sync.json`)
}

function die(msg) { console.error('\n❌ ' + msg); process.exit(1) }
function sh(cmd, a, opts = {}) { return execFileSync(cmd, a, { encoding: 'utf8', ...opts }) }

// ---- 0. sanity ----
if (!fs.existsSync(ROOT) || !fs.existsSync(path.join(ROOT, 'AGENTS.md'))) {
  die(`Không thấy "${path.join(ROOT, 'AGENTS.md')}" — không giống project từ template.\n   Dùng --project <dir> để chỉ đúng project.`)
}

// ---- resolve config ----
let cfg = {}
if (!noConfig) {
  const p = path.join(ROOT, '.template-sync.json')
  if (fs.existsSync(p)) {
    try { cfg = JSON.parse(fs.readFileSync(p, 'utf8')) }
    catch (e) { die(`.template-sync.json không hợp lệ: ${e.message}`) }
  }
}
const managed = cfg.managedPaths || DEFAULTS.managedPaths
const reportOnly = cfg.reportOnlyPaths || DEFAULTS.reportOnlyPaths
const repoUrl = opt('--template') || cfg.templateRepo || TEMPLATE_REPO
const NAME = path.basename(repoUrl.replace(/\.git$/, '').replace(/\/$/, ''))

// ---- 1. lấy template mới nhất vào cache ----
const cache = path.join(os.homedir(), '.cache', 'opencode-template-sync', NAME)
fs.mkdirSync(path.dirname(cache), { recursive: true })
if (!fs.existsSync(path.join(cache, '.git'))) {
  console.log(`⬇️  Clone template (lần đầu) → ${cache}`)
  sh('git', ['clone', '--quiet', '--branch', BRANCH, repoUrl, cache], { stdio: 'inherit' })
} else {
  console.log('🔄 Fetch template…')
  try {
    sh('git', ['-C', cache, 'remote', 'set-url', 'origin', repoUrl])
    sh('git', ['-C', cache, 'fetch', '--quiet', 'origin', BRANCH])
    sh('git', ['-C', cache, 'reset', '--hard', '--quiet', `origin/${BRANCH}`])
  } catch (e) {
    die(`Không fetch được template (${repoUrl}). Kiểm tra SSH/network.\n   ${String(e.stderr || e.message).trim()}`)
  }
}
const sha = sh('git', ['-C', cache, 'rev-parse', '--short', 'HEAD']).trim()
const when = sh('git', ['-C', cache, 'log', '-1', '--format=%cd', '--date=short']).trim()
console.log(`📌 Template @ ${sha} (${when}) · nguồn: ${NAME}`)

// ---- 2. guard: managedPaths không được dirty ----
const isGit = fs.existsSync(path.join(ROOT, '.git'))
if (isGit) {
  const dirty = managed.filter((p) => {
    try { return sh('git', ['-C', ROOT, 'status', '--porcelain', '--', p]).trim().length > 0 }
    catch { return false }
  })
  if (dirty.length) {
    console.error('\n❌ Các path template-managed đang có thay đổi CHƯA COMMIT:')
    dirty.forEach((d) => console.error('   - ' + d))
    die('Commit hoặc stash trước rồi chạy lại (dùng --dry-run để xem trước).')
  }
}

// ---- 3. rsync managedPaths (fallback copy bằng Node khi máy không có rsync, vd Windows) ----
const HAS_RSYNC = spawnSync('rsync', ['--version'], { encoding: 'utf8' }).status === 0
if (!HAS_RSYNC) console.log('ℹ️  Không có rsync — dùng copy Node (so nội dung từng file).')

// Trả về dòng log cùng format rsync -i: `>f+++++++++ file` (thêm), `>f.c....... file` (sửa), `*deleting file`.
function syncFile(src, dst, label) {
  const exists = fs.existsSync(dst)
  if (exists && fs.readFileSync(src).equals(fs.readFileSync(dst))) return []
  if (!dryRun) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst) }
  return [`${exists ? '>f.c.......' : '>f+++++++++'} ${label}`]
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { recursive: true }).map(String)
    .filter((rel) => fs.statSync(path.join(dir, rel)).isFile())
}

function syncDir(srcDir, dstDir) {
  const srcFiles = listFiles(srcDir)
  const lines = srcFiles.flatMap((rel) => syncFile(path.join(srcDir, rel), path.join(dstDir, rel), rel.replace(/\\/g, '/')))
  if (!prune) return lines
  const keep = new Set(srcFiles)
  for (const rel of listFiles(dstDir).filter((r) => !keep.has(r))) {
    if (!dryRun) fs.rmSync(path.join(dstDir, rel))
    lines.push(`*deleting ${rel.replace(/\\/g, '/')}`)
  }
  return lines
}

let nAdd = 0, nUpd = 0, nDel = 0
for (const p of managed) {
  const srcPath = path.join(cache, p)
  if (!fs.existsSync(srcPath)) { console.log(`⚠️  Template không có "${p}" — bỏ qua.`); continue }
  const isDir = fs.statSync(srcPath).isDirectory()
  const src = isDir ? srcPath + path.sep : srcPath
  const dst = isDir ? path.join(ROOT, p) + path.sep : path.join(ROOT, p)
  let lines
  if (HAS_RSYNC) {
    const a = ['-a', '--checksum', '-i']
    if (isDir && prune) a.push('--delete')
    if (dryRun) a.push('-n')
    const r = spawnSync('rsync', [...a, src, dst], { encoding: 'utf8' })
    if (r.status !== 0) die(`rsync "${p}" lỗi: ${(r.stderr || '').trim()}`)
    lines = (r.stdout || '').split('\n').filter((l) => /^[>*]/.test(l))
  } else {
    lines = isDir ? syncDir(srcPath, path.join(ROOT, p)) : syncFile(srcPath, dst, path.basename(p))
  }
  if (!lines.length) continue
  console.log(`\n📦 ${p}${isDir ? '/' : ''}`)
  for (const l of lines) {
    const sp = l.search(/\s/)
    const flags = l.slice(0, sp)
    const file = l.slice(sp).trim()
    if (flags.startsWith('*deleting')) { nDel++; console.log('   🗑  ' + file) }
    else if (flags.includes('+++++++++')) { nAdd++; console.log('   ➕ ' + file) }
    else { nUpd++; console.log('   ✏️  ' + file) }
  }
}

// ---- 4. report-only drift (không tự đổi) ----
for (const p of reportOnly) {
  const src = path.join(cache, p), dst = path.join(ROOT, p)
  if (!fs.existsSync(src) || !fs.existsSync(dst)) continue
  if (!fs.readFileSync(src).equals(fs.readFileSync(dst))) console.log(`\n⚠️  "${p}" khác template — KHÔNG tự đổi. Review tay nếu cần (vd merge gate bảo mật mới).`)
}

// ---- 5. summary ----
console.log(`\n${dryRun ? '🧪 DRY-RUN —' : '✅'} ${nAdd} thêm · ${nUpd} sửa · ${nDel} xoá`)
if (!dryRun) {
  if (isGit) {
    console.log('\nXem   :  git status --short && git diff')
    console.log('Undo  :  git checkout -- <path>   (mọi thay đổi đều nằm trong git)')
    console.log('Xong  :  commit như bình thường.')
  } else {
    console.log('\n⚠️  Project KHÔNG phải git repo — hãy backup/commit thủ công để hoàn tác được.')
  }
}
