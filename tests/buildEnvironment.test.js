import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEnvironment,REQUIRED_ENV} from '../scripts/ci/validate-env.mjs';

const valid = () => ({VITE_API_BASE:'https://api.shortbreakhub.com/api',VITE_GOOGLE_MAP_GEOCODING_API_KEY:'AIza'+'a'.repeat(35),VITE_GOOGLE_MAP_MAP_ID:'a'.repeat(24),VITE_ABSTRACT_GEOLOCATION_API_KEY:'b'.repeat(32),VITE_EXCHANGERATE_API_KEY:'c'.repeat(24)});
test('production requires every consumed provider setting; analytics remains optional', () => {
  assert.equal(validateEnvironment(valid()).analyticsConfigured,false);
  for (const name of ['VITE_API_BASE',...Object.keys(REQUIRED_ENV)]) {
    const env = valid(); delete env[name];
    assert.throws(() => validateEnvironment(env),new RegExp(name));
  }
  assert.equal(validateEnvironment({...valid(),VITE_GA_MEASUREMENT_ID:'G-ABC123'}).analyticsConfigured,true);
  assert.equal(validateEnvironment({...valid(),VITE_GA_MEASUREMENT_ID:'invalid'}).analyticsConfigured,false);
  const noLegacyKey=valid();delete noLegacyKey.VITE_ABSTRACT_GEOLOCATION_API_KEY;
  assert.doesNotThrow(()=>validateEnvironment(noLegacyKey));
});
test('invalid endpoint/key errors identify fields without exposing supplied values', () => {
  for (const [name,value] of Object.entries({VITE_API_BASE:'https://other.example/api?secret=sensitive',VITE_GOOGLE_MAP_GEOCODING_API_KEY:'sensitive-placeholder',VITE_GOOGLE_MAP_MAP_ID:'DEMO_MAP_ID',VITE_EXCHANGERATE_API_KEY:'sensitive-placeholder'})) {
    assert.throws(() => validateEnvironment({...valid(),[name]:value}),error => error.message.includes(name) && !error.message.includes(value));
  }
});
