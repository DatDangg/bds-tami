#!/usr/bin/env node
/**
 * session-handoff.mjs — bản Claude Code của `.opencode/plugins/loop-guard.ts` (AGENTS.md § Session Handoff).
 *
 *   node session-handoff.mjs usage    # PostToolUse(Agent): đo context → chèn dòng `usage:` khi ≥ threshold
 *   node session-handoff.mjs compact  # SessionStart(compact): nhắc re-read Run Journal sau auto-compact
 *
 * Policy: `.context/session-policy.json` → usageGate {enabled, threshold, minStepsLeft, hardThreshold, contextLimit}.
 * Hook phải defensive: mọi lỗi được nuốt (exit 0, không output) để không làm hỏng session.
 */

import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_GATE = { enabled: true, threshold: 0.35, minStepsLeft: 2, hardThreshold: 0.75, contextLimit: 200000 }

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}')
  } catch {
    return {}
  }
}

function readGate(projectDir) {
  try {
    const raw = fs.readFileSync(path.join(projectDir, '.context', 'session-policy.json'), 'utf8')
    return { ...DEFAULT_GATE, ...(JSON.parse(raw).usageGate ?? {}) }
  } catch {
    return DEFAULT_GATE
  }
}

// Occupancy = token của assistant message hoàn tất gần nhất (input + cache + output), giống loop-guard.
function lastOccupancy(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, 'utf8').trimEnd().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    let entry
    try { entry = JSON.parse(lines[i]) } catch { continue }
    const usage = entry?.message?.usage
    if (entry?.type !== 'assistant' || !usage || entry.isSidechain) continue
    const occupancy = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0)
      + (usage.cache_read_input_tokens ?? 0) + (usage.output_tokens ?? 0)
    if (occupancy > 0) return occupancy
  }
  return null
}

function emit(hookEventName, additionalContext) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext } }))
}

function runUsage(input) {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  const gate = readGate(projectDir)
  if (!gate.enabled || !input.transcript_path) return
  const occupancy = lastOccupancy(input.transcript_path)
  if (!occupancy) return
  const percent = occupancy / gate.contextLimit
  if (percent < gate.threshold) return
  const hard = percent >= gate.hardThreshold
  emit('PostToolUse', [
    `usage: occupancy=${occupancy} limit=${gate.contextLimit} percent=${(percent * 100).toFixed(1)}%`,
    `gate(threshold=${gate.threshold}, minStepsLeft=${gate.minStepsLeft}, hard=${gate.hardThreshold}) over=true hard=${hard}`,
    'Usage gate (AGENTS.md § Session Handoff): ở checkpoint kế tiếp, nếu còn ≥ minStepsLeft bước (hoặc hard=true) →',
    'hỏi user bằng AskUserQuestion: [End — mở session mới] / [Làm tiếp] / [Tiếp, đừng hỏi tới hardThreshold].',
  ].join('\n'))
}

function runCompact() {
  emit('SessionStart', [
    '## Session handoff (bắt buộc)',
    'Sau compact PHẢI re-read Run Journal `.context/runs/<type>-<slug>-<phaseTask>.md` từ đĩa',
    'trước khi tiếp tục — đĩa là sự thật, pointer (`progress.json`) chỉ là hint.',
    'Xem `AGENTS.md` § Session Handoff (write-ahead checkpoint, resume matrix, redo policy).',
  ].join('\n'))
}

try {
  const mode = process.argv[2]
  const input = readStdin()
  if (mode === 'usage') runUsage(input)
  else if (mode === 'compact') runCompact()
} catch {
  // defensive: never break the session
}
