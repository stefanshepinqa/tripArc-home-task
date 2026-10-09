import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { browser } from '@wdio/globals';
import { CatalogPage } from '../pages/CatalogPage.js';
import { ArtifactHelper } from './ArtifactHelper.js';
import { ApiSetupHelper } from './ApiSetupHelper.js';

export class SessionHelper {
  private static api = new ApiSetupHelper();

  static jobName(test: { title: string; parent?: string }): string {
    const title = test.title.trim();
    const parent = test.parent?.trim();
    const name = parent && parent !== title ? `${parent}: ${title}` : title;
    return name.replace(/[\r\n]+/g, ' ').slice(0, 255);
  }

  /** Sauce records the job name at session creation, before Mocha loads the test. */
  static jobNameFromSpec(spec: string): string {
    const path = spec.startsWith('file:') ? fileURLToPath(spec) : spec;
    const source = readFileSync(path, 'utf8');
    const quoted = (keyword: string) => source.match(new RegExp(`\\b${keyword}\\(\\s*(['"])([^'"]*)\\1`))?.[2];
    const title = quoted('it');
    if (!title) throw new Error(`No test title found in ${path}`);
    return this.jobName({ parent: quoted('describe'), title });
  }

  static async beforeScenario(name: string): Promise<void> {
    // Exactly one scenario per spec: WDIO creates a fresh session per spec.
    await browser.setTimeout({ implicit: 0 });
    if (process.env.EXECUTION_TARGET === 'saucelabs') {
      // The session starts before Mocha has a title, so rename it here.
      try { await browser.execute(`sauce:job-name=${name}`); }
      catch (error) { console.warn('Could not set cloud job name:', error); }
    }
    await this.api.setup({ scenario: name, runId: browser.sessionId });
    await new CatalogPage().waitUntilReady();
  }

  static async afterScenario(name: string, passed: boolean): Promise<void> {
    if (!passed) {
      try { await ArtifactHelper.capture(name); }
      catch (error) { console.warn('Failure artifacts unavailable:', error); }
    }
    await this.api.cleanup();
    if (process.env.EXECUTION_TARGET === 'saucelabs') {
      // Metadata failure must not replace the business test outcome.
      try {
        await browser.execute(`sauce:job-result=${passed ? 'passed' : 'failed'}`);
      } catch (error) { console.warn('Could not update cloud session status:', error); }
    }
  }
}
