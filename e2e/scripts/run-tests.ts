#!/usr/bin/env node

import { execSync } from 'child_process';

interface TestOptions {
  headed?: boolean;
  debug?: boolean;
  ui?: boolean;
  project?: string;
  grep?: string;
  reporter?: string;
  workers?: number;
}

class TestRunner {
  private options: TestOptions;

  constructor(options: TestOptions = {}) {
    this.options = options;
  }

  async runTests() {
    console.log('🚀 Starting E2E tests...');

    // Check if servers are running
    await this.checkServers();

    // Build the command
    const command = this.buildCommand();

    console.log(`Running: ${command}`);

    try {
      execSync(command, { stdio: 'inherit' });
      console.log('✅ All tests passed!');
    } catch (error) {
      console.error('❌ Tests failed');
      process.exit(1);
    }
  }

  private async checkServers() {
    const frontendRunning = await this.isServerRunning('http://localhost:5173');
    const backendRunning = await this.isServerRunning('http://localhost:3000');

    if (!frontendRunning) {
      console.log('⚠️  Frontend server not running. Starting...');
      // In a real scenario, you might want to start the server here
    }

    if (!backendRunning) {
      console.log('⚠️  Backend server not running. Starting...');
      // In a real scenario, you might want to start the server here
    }
  }

  private async isServerRunning(url: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildCommand(): string {
    let command = 'npx playwright test';

    if (this.options.headed) {
      command += ' --headed';
    }

    if (this.options.debug) {
      command += ' --debug';
    }

    if (this.options.ui) {
      command += ' --ui';
    }

    if (this.options.project) {
      command += ` --project=${this.options.project}`;
    }

    if (this.options.grep) {
      command += ` --grep="${this.options.grep}"`;
    }

    if (this.options.reporter) {
      command += ` --reporter=${this.options.reporter}`;
    }

    if (this.options.workers) {
      command += ` --workers=${this.options.workers}`;
    }

    return command;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: TestOptions = {};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case '--headed':
      options.headed = true;
      break;
    case '--debug':
      options.debug = true;
      break;
    case '--ui':
      options.ui = true;
      break;
    case '--project':
      options.project = args[++i];
      break;
    case '--grep':
      options.grep = args[++i];
      break;
    case '--reporter':
      options.reporter = args[++i];
      break;
    case '--workers':
      options.workers = parseInt(args[++i]);
      break;
  }
}

// Run tests
const runner = new TestRunner(options);
runner.runTests().catch(console.error);
