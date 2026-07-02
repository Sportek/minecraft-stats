const fs = require('fs')
const path = require('path')
const mjml = require('mjml')

const SAMPLES = {
  verify_email_html: {
    verify_url: 'https://minecraft-stats.fr/verify-email/sample-token',
    title: 'Confirmez votre inscription à Minecraft-Stats.fr',
    greeting: 'Bonjour Sportek,',
    intro:
      "Il ne reste qu'une étape pour vous inscrire à nos services : vous devez confirmer votre adresse e-mail en cliquant sur le bouton ci-dessous.",
    cta: 'Confirmer mon inscription',
    footerReason: 'Vous recevez cet e-mail car vous vous êtes inscrit sur Minecraft-Stats.fr.',
    copyright: '© Minecraft-Stats.fr, Tous droits réservés.',
  },
  reset_password_html: {
    reset_url: 'https://minecraft-stats.fr/reset-password/sample-token',
    title: 'Réinitialisez votre mot de passe Minecraft-Stats.fr',
    greeting: 'Bonjour Sportek,',
    intro:
      'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
    cta: 'Réinitialiser mon mot de passe',
    expiry: 'Ce lien expirera dans 1 heure pour votre sécurité.',
    ignore:
      "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail : votre mot de passe ne sera pas modifié.",
    footerReason:
      'Vous recevez cet e-mail car une réinitialisation de mot de passe a été demandée pour votre compte Minecraft-Stats.fr.',
    copyright: '© Minecraft-Stats.fr, Tous droits réservés.',
  },
}

const outDir = process.argv[2] || '.'
for (const [name, vars] of Object.entries(SAMPLES)) {
  const raw = fs.readFileSync(`resources/views/emails/${name}.edge`, 'utf8')
  let src = raw.slice(raw.indexOf('<mjml>'), raw.indexOf('</mjml>') + 7)
  // Substitute Edge {{ var }} with the sample values before compiling.
  src = src.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] ?? `[missing:${key}]`)
  const result = mjml(src, { validationLevel: 'strict' })
  const html = result.html || ''
  const out = path.join(outDir, `preview-${name}.html`)
  fs.writeFileSync(out, html)
  console.log(name, '| errors:', result.errors.length, '| html:', html.length, '→', out)
}
