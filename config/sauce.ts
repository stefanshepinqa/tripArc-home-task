import { required } from './environment.js';

const regions = ['us-west-1', 'us-east-4', 'eu-central-1'] as const;

export function sauceRegion(env: NodeJS.ProcessEnv = process.env): string {
  const region = (env.SAUCE_REGION || 'us-west-1').trim();
  if (!regions.includes(region as typeof regions[number])) {
    throw new Error(`SAUCE_REGION must be one of ${regions.join(', ')}`);
  }
  return region;
}

export function sauceConnection(env: NodeJS.ProcessEnv = process.env) {
  const region = sauceRegion(env);
  return {
    hostname: `ondemand.${region}.saucelabs.com`,
    port: 443,
    protocol: 'https' as const,
    path: '/wd/hub',
    user: required('SAUCE_USERNAME', env),
    key: required('SAUCE_ACCESS_KEY', env),
  };
}
