import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`
const REPORTS_DIR = path.resolve(process.env.LIGHTHOUSE_REPORTS_DIR || path.join(process.cwd(), 'lighthouse-reports'))

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
}

function median(values) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const half = Math.floor(sorted.length / 2)
  if (sorted.length % 2) return sorted[half]
  return (sorted[half - 1] + sorted[half]) / 2.0
}

async function startServer() {
  console.log('Iniciando Vite Preview na porta', PORT)
  const proc = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host'], {
    stdio: 'pipe',
  })

  await new Promise((resolve) => setTimeout(resolve, 2500))
  return proc
}

async function runAudit() {
  const server = await startServer()
  let chrome

  try {
    console.log('Iniciando Chrome Headless para auditoria Lighthouse...')
    const customChromePath = path.join(
      process.env.HOME || '/Users/jclf',
      'Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
    )
    chrome = await chromeLauncher.launch({
      chromePath: fs.existsSync(customChromePath) ? customChromePath : undefined,
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    })

    const configs = [
      { name: 'Home_Mobile', url: `${BASE_URL}/`, mode: 'mobile' },
      { name: 'Home_Desktop', url: `${BASE_URL}/`, mode: 'desktop' },
      { name: 'Detail_Mobile', url: `${BASE_URL}/nft/bored-ape-7090`, mode: 'mobile' },
      { name: 'Detail_Desktop', url: `${BASE_URL}/nft/bored-ape-7090`, mode: 'desktop' },
    ]

    const allResults = {}

    for (const cfg of configs) {
      console.log(`\n========================================`)
      console.log(`Auditando: ${cfg.name} (3 medições)...`)
      console.log(`========================================`)

      const runs = []

      for (let i = 1; i <= 3; i++) {
        console.log(`  Execução ${i}/3...`)
        const options = {
          logLevel: 'silent',
          output: ['html', 'json'],
          onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          port: chrome.port,
          formFactor: cfg.mode,
          screenEmulation:
            cfg.mode === 'desktop'
              ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
              : { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false },
          throttling:
            cfg.mode === 'desktop'
              ? { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 }
              : undefined,
        }

        const runnerResult = await lighthouse(cfg.url, options)
        const categories = runnerResult.lhr.categories
        const audits = runnerResult.lhr.audits

        const score = {
          performance: Math.round(categories.performance.score * 100),
          accessibility: Math.round(categories.accessibility.score * 100),
          bestPractices: Math.round(categories['best-practices'].score * 100),
          seo: Math.round(categories.seo.score * 100),
          lcp: audits['largest-contentful-paint']?.numericValue || 0,
          cls: audits['cumulative-layout-shift']?.numericValue || 0,
          tbt: audits['total-blocking-time']?.numericValue || 0,
        }

        runs.push(score)

        // Save last run HTML and JSON
        if (i === 3) {
          const htmlReport = runnerResult.report[0]
          const jsonReport = runnerResult.report[1]
          fs.writeFileSync(path.join(REPORTS_DIR, `${cfg.name}.html`), htmlReport)
          fs.writeFileSync(path.join(REPORTS_DIR, `${cfg.name}.json`), jsonReport)
        }
      }

      const medScore = {
        performance: median(runs.map((r) => r.performance)),
        accessibility: median(runs.map((r) => r.accessibility)),
        bestPractices: median(runs.map((r) => r.bestPractices)),
        seo: median(runs.map((r) => r.seo)),
        lcp: Math.round(median(runs.map((r) => r.lcp))),
        cls: parseFloat(median(runs.map((r) => r.cls)).toFixed(3)),
        tbt: Math.round(median(runs.map((r) => r.tbt))),
      }

      allResults[cfg.name] = medScore

      console.log(`  Mediana para ${cfg.name}:`)
      console.log(`    Performance:    ${medScore.performance} (Meta: ≥90)`)
      console.log(`    Acessibilidade: ${medScore.accessibility} (Meta: ≥95)`)
      console.log(`    Boas Práticas:  ${medScore.bestPractices} (Meta: ≥95)`)
      console.log(`    SEO:            ${medScore.seo} (Meta: ≥90)`)
      console.log(`    LCP:            ${medScore.lcp}ms`)
      console.log(`    CLS:            ${medScore.cls}`)
      console.log(`    TBT:            ${medScore.tbt}ms`)
    }

    fs.writeFileSync(
      path.join(REPORTS_DIR, 'lighthouse-summary.json'),
      JSON.stringify(allResults, null, 2)
    )
    console.log('\nRelatórios Lighthouse salvos em:', REPORTS_DIR)
  } finally {
    if (chrome) await chrome.kill()
    if (server) server.kill()
  }
}

runAudit().catch((err) => {
  console.error('Falha na auditoria Lighthouse:', err)
  process.exit(1)
})
