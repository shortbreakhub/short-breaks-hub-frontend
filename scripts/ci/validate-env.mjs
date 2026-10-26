import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEnv} from 'vite';

export const REQUIRED_ENV = {
  VITE_GOOGLE_MAP_GEOCODING_API_KEY: /^AIza[A-Za-z0-9_-]{35}$/,
  VITE_GOOGLE_MAP_MAP_ID: /^[a-f0-9]{8,64}$/i,
  VITE_EXCHANGERATE_API_KEY: /^[a-f0-9]{24}$/i,
};

export function validateEnvironment(env) {
  const errors = [];
  try {
    const url = new URL(env.VITE_API_BASE);
    if (url.origin !== 'https://api.shortbreakhub.com' || url.pathname.replace(/\/$/, '') !== '/api' || url.search || url.hash || url.username || url.password) throw new Error();
  } catch { errors.push('VITE_API_BASE must identify the existing HTTPS production API at /api'); }
  for (const [name, pattern] of Object.entries(REQUIRED_ENV)) {
    if (typeof env[name] !== 'string' || !pattern.test(env[name])) errors.push(`${name} is absent or has an invalid provider format`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  // Abstract geolocation helpers are not imported by any production entrypoint.
  // Do not turn an unused legacy setting into a deployment prerequisite.
  return {required: ['VITE_API_BASE', ...Object.keys(REQUIRED_ENV)], analyticsConfigured: /^G-[A-Z0-9]+$/.test(env.VITE_GA_MEASUREMENT_ID?.trim() || '')};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    // Use precisely Vite's production .env precedence, including Actions env overrides.
    const result = validateEnvironment(loadEnv('production', process.cwd(), 'VITE_'));
    console.log(`Production environment validated: ${result.required.join(', ')}. Optional analytics ${result.analyticsConfigured ? 'configured' : 'disabled'}. Values are never logged.`);
  } catch (error) {
    // Only our field-level errors are safe to report; never dump dotenv/provider values.
    const message = error.message.startsWith('VITE_') ? error.message : 'Unable to load production environment configuration';
    console.error(message);
    process.exitCode = 1;
  }
}
