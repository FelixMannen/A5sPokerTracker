// One-time migration: Excel → import.json (no native modules)
// Run:  node scripts/migrate-excel.cjs
// Then: npm run dev   ← the app reads import.json and loads it into sessions.db

const path = require('path')
const fs   = require('fs')
const XLSX = require('xlsx')

const EXCEL_PATH = 'C:\\Users\\feyee\\Documents\\NTNU\\Poker\\mtts.xlsx'
const OUT_DIR    = path.join(process.env.APPDATA, 'a5s-poker-tracker')
const OUT_PATH   = path.join(OUT_DIR, 'import.json')

// DD.MM.YYYY → YYYY-MM-DD
function parseDate(value) {
  if (value === null || value === undefined || value === '') return null
  const m = String(value).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

function mapRegTime(value) {
  if (!value) return null
  switch (String(value).trim()) {
    case 'Early':   return 'Early'
    case 'Mid':     return 'Medium'
    case 'Late':    return 'Late'
    case 'MaxLate': return 'Late'
    default:        return null   // Start, N/A, blank → null
  }
}

if (!fs.existsSync(EXCEL_PATH)) {
  console.error(`Excel file not found: ${EXCEL_PATH}`)
  process.exit(1)
}

const workbook = XLSX.readFile(EXCEL_PATH)
const sheet    = workbook.Sheets['MTT Tracker']
if (!sheet) { console.error('Sheet "MTT Tracker" not found'); process.exit(1) }

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true })
console.log(`Read ${rows.length - 1} rows from Excel`)

const sessions = []
let skipped = 0

for (let i = 1; i < rows.length; i++) {
  const row = rows[i]
  if (!row || row.length === 0) { skipped++; continue }

  const buyInRaw = row[3]
  if (buyInRaw === null || buyInRaw === undefined || buyInRaw === '') { skipped++; continue }

  const date = parseDate(row[0])
  if (!date) { skipped++; continue }

  const buyIn   = parseFloat(buyInRaw)
  if (isNaN(buyIn) || buyIn < 0) { skipped++; continue }

  const cashRaw = row[6]
  const cashout = (cashRaw !== null && cashRaw !== undefined && cashRaw !== '')
    ? Math.max(0, parseFloat(cashRaw) || 0)
    : 0

  const name    = row[2] ? String(row[2]).trim() || null : null

  sessions.push({
    tournament_name:   name,
    date,
    buy_in:            buyIn,
    cashout,
    type:              null,
    registration_time: mapRegTime(row[11])
  })
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_PATH, JSON.stringify(sessions, null, 2), 'utf-8')

console.log(`\n✓ ${sessions.length} tournaments written to:`)
console.log(`  ${OUT_PATH}`)
if (skipped > 0) console.log(`  Skipped ${skipped} blank/invalid rows`)
console.log('\nLaunch the app — it will import the data automatically on startup.')
