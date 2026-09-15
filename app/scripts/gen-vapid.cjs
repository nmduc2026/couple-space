const fs = require('fs')
const c = require('crypto')
const { publicKey, privateKey } = c.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1',
})
const pub = publicKey.export({ type: 'spki', format: 'der' }).subarray(-65)
const lines = [
  'VAPID_PUBLIC_KEY=' + Buffer.from(pub).toString('base64url'),
  'VAPID_PRIVATE_KEY=' + privateKey.export({ format: 'jwk' }).d,
  'CRON_SECRET=' + c.randomBytes(32).toString('base64url'),
  '',
].join('\n')

// Ghi UTF-8 (không BOM). Trên PowerShell, `> .vapid.env` ghi UTF-16
// → `supabase secrets set --env-file` báo "No arguments found".
fs.writeFileSync('.vapid.env', lines, 'utf8')
process.stdout.write(lines)
