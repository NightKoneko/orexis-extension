import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '..')

const packageJsonPath = resolve(rootDir, 'package.json')
const firefoxManifestPath = resolve(rootDir, 'manifest.firefox.json')
const outDir = resolve(rootDir, process.env.UPDATE_MANIFEST_OUT_DIR || 'artifacts')
const repository = process.env.UPDATE_REPOSITORY || process.env.GITHUB_REPOSITORY || 'NightKoneko/orexis-extension'
const chromiumExtensionId = process.env.CHROMIUM_EXTENSION_ID

if (!chromiumExtensionId) {
  throw new Error('Missing CHROMIUM_EXTENSION_ID env var. This is required for chromium-updates.xml generation.')
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const firefoxManifest = JSON.parse(readFileSync(firefoxManifestPath, 'utf8'))

const version = packageJson.version
const firefoxAddonId = firefoxManifest?.browser_specific_settings?.gecko?.id

if (!version) {
  throw new Error('Could not read version from package.json')
}

if (!firefoxAddonId) {
  throw new Error('Could not read browser_specific_settings.gecko.id from manifest.firefox.json')
}

const releaseDownloadBase = `https://github.com/${repository}/releases/latest/download`
const chromiumCrxUrl = `${releaseDownloadBase}/orexis-chromium.crx`
const firefoxXpiUrl = `${releaseDownloadBase}/orexis-firefox.xpi`

mkdirSync(outDir, { recursive: true })

const chromiumXml = `<?xml version="1.0" encoding="UTF-8"?>
<gupdate xmlns="http://www.google.com/update2/response" protocol="2.0">
  <app appid="${chromiumExtensionId}">
    <updatecheck codebase="${chromiumCrxUrl}" version="${version}" />
  </app>
</gupdate>
`

const firefoxJson = JSON.stringify(
  {
    addons: {
      [firefoxAddonId]: {
        updates: [
          {
            version,
            update_link: firefoxXpiUrl,
          },
        ],
      },
    },
  },
  null,
  2,
)

writeFileSync(resolve(outDir, 'chromium-updates.xml'), chromiumXml, 'utf8')
writeFileSync(resolve(outDir, 'firefox-updates.json'), `${firefoxJson}\n`, 'utf8')

console.log(`Generated update manifests in ${outDir}`)
console.log(`- chromium-updates.xml for extension id: ${chromiumExtensionId}`)
console.log(`- firefox-updates.json for addon id: ${firefoxAddonId}`)
console.log(`- version: ${version}`)
console.log(`- repository: ${repository}`)
