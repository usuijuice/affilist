#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Generate comprehensive test coverage report
 */
class CoverageReportGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.coverageDir = path.join(this.projectRoot, 'coverage');
    this.reportsDir = path.join(this.projectRoot, 'test-reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async generateReport() {
    console.log('🚀 Generating comprehensive test coverage report...');
    
    try {
      // Ensure directories exist
      this.ensureDirectories();
      
      // Run frontend tests with coverage
      console.log('📊 Running frontend tests with coverage...');
      await this.runFrontendTests();
      
      // Run backend tests with coverage
      console.log('📊 Running backend tests with coverage...');
      await this.runBackendTests();
      
      // Run E2E tests
      console.log('🎭 Running E2E tests...');
      await this.runE2ETests();
      
      // Generate combined report
      console.log('📋 Generating combined coverage report...');
      await this.generateCombinedReport();
      
      // Generate summary
      console.log('📈 Generating coverage summary...');
      await this.generateSummary();
      
      console.log('✅ Coverage report generation complete!');
      console.log(`📁 Reports available in: ${this.reportsDir}`);
      
    } catch (error) {
      console.error('❌ Error generating coverage report:', error.message);
      process.exit(1);
    }
  }

  ensureDirectories() {
    const dirs = [this.reportsDir, this.coverageDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runFrontendTests() {
    try {
      execSync('npm run test:run -- --coverage', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });
      
      // Copy frontend coverage to reports
      if (fs.existsSync(this.coverageDir)) {
        const frontendCoverageDir = path.join(this.reportsDir, 'frontend-coverage');
        execSync(`cp -r ${this.coverageDir} ${frontendCoverageDir}`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.warn('⚠️  Frontend tests failed, continuing with partial coverage');
    }
  }

  async runBackendTests() {
    const serverDir = path.join(this.projectRoot, 'server');
    if (!fs.existsSync(serverDir)) {
      console.log('⏭️  No server directory found, skipping backend tests');
      return;
    }

    try {
      execSync('npm run test:coverage', {
        stdio: 'inherit',
        cwd: serverDir
      });
      
      // Copy backend coverage to reports
      const backendCoverageDir = path.join(serverDir, 'coverage');
      if (fs.existsSync(backendCoverageDir)) {
        const targetDir = path.join(this.reportsDir, 'backend-coverage');
        execSync(`cp -r ${backendCoverageDir} ${targetDir}`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.warn('⚠️  Backend tests failed, continuing with partial coverage');
    }
  }

  async runE2ETests() {
    try {
      // Check if servers are running
      const isServerRunning = await this.checkServerHealth();
      if (!isServerRunning) {
        console.log('⚠️  Servers not running, skipping E2E tests');
        return;
      }

      execSync('npx playwright test --reporter=html', {
        stdio: 'inherit',
        cwd: this.projectRoot
      });
      
      // Copy E2E report
      const e2eReportDir = path.join(this.projectRoot, 'playwright-report');
      if (fs.existsSync(e2eReportDir)) {
        const targetDir = path.join(this.reportsDir, 'e2e-report');
        execSync(`cp -r ${e2eReportDir} ${targetDir}`, { stdio: 'inherit' });
      }
    } catch (error) {
      console.warn('⚠️  E2E tests failed, continuing without E2E coverage');
    }
  }

  async checkServerHealth() {
    try {
      const response = await fetch('http://localhost:5173');
      const apiResponse = await fetch('http://localhost:3000/api/health');
      return response.ok && apiResponse.ok;
    } catch {
      return false;
    }
  }

  async generateCombinedReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      project: 'Affilist - Affiliate Link Aggregator',
      version: this.getProjectVersion(),
      coverage: {
        frontend: this.parseCoverageData('frontend-coverage'),
        backend: this.parseCoverageData('backend-coverage'),
      },
      testResults: {
        frontend: this.parseTestResults('frontend'),
        backend: this.parseTestResults('backend'),
        e2e: this.parseE2EResults(),
      }
    };

    const reportPath = path.join(this.reportsDir, `coverage-report-${this.timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    this.generateHTMLReport(reportData);
  }

  parseCoverageData(type) {
    const coverageFile = path.join(this.reportsDir, type, 'coverage-summary.json');
    if (!fs.existsSync(coverageFile)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      return {
        lines: data.total.lines,
        functions: data.total.functions,
        branches: data.total.branches,
        statements: data.total.statements,
      };
    } catch {
      return null;
    }
  }

  parseTestResults(type) {
    const resultsFile = path.join(this.reportsDir, `${type}-test-results.json`);
    if (!fs.existsSync(resultsFile)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch {
      return null;
    }
  }

  parseE2EResults() {
    const resultsFile = path.join(this.reportsDir, 'e2e-report', 'results.json');
    if (!fs.existsSync(resultsFile)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    } catch {
      return null;
    }
  }

  generateHTMLReport(data) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Coverage Report - ${data.project}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; }
        .metric-title { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 8px; }
        .metric-value { font-size: 24px; font-weight: 700; color: #1e293b; }
        .coverage-bar { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; margin-top: 8px; overflow: hidden; }
        .coverage-fill { height: 100%; transition: width 0.3s ease; }
        .good { background: #10b981; }
        .warning { background: #f59e0b; }
        .poor { background: #ef4444; }
        .section { margin: 30px 0; }
        .section-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .timestamp { color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${data.project}</h1>
            <p>Test Coverage Report</p>
            <p class="timestamp">Generated: ${new Date(data.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="content">
            ${this.generateCoverageSection(data.coverage)}
            ${this.generateTestResultsSection(data.testResults)}
        </div>
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.reportsDir, `coverage-report-${this.timestamp}.html`);
    fs.writeFileSync(htmlPath, html);
  }

  generateCoverageSection(coverage) {
    if (!coverage.frontend && !coverage.backend) {
      return '<div class="section"><h2>No coverage data available</h2></div>';
    }

    let html = '<div class="section"><h2 class="section-title">Code Coverage</h2><div class="metric-grid">';
    
    if (coverage.frontend) {
      html += this.generateCoverageCards('Frontend', coverage.frontend);
    }
    
    if (coverage.backend) {
      html += this.generateCoverageCards('Backend', coverage.backend);
    }
    
    html += '</div></div>';
    return html;
  }

  generateCoverageCards(title, coverage) {
    const metrics = ['lines', 'functions', 'branches', 'statements'];
    return metrics.map(metric => {
      const pct = coverage[metric]?.pct || 0;
      const covered = coverage[metric]?.covered || 0;
      const total = coverage[metric]?.total || 0;
      const className = pct >= 80 ? 'good' : pct >= 60 ? 'warning' : 'poor';
      
      return `
        <div class="metric-card">
            <div class="metric-title">${title} ${metric.charAt(0).toUpperCase() + metric.slice(1)}</div>
            <div class="metric-value">${pct.toFixed(1)}%</div>
            <div>${covered}/${total}</div>
            <div class="coverage-bar">
                <div class="coverage-fill ${className}" style="width: ${pct}%"></div>
            </div>
        </div>`;
    }).join('');
  }

  generateTestResultsSection(testResults) {
    let html = '<div class="section"><h2 class="section-title">Test Results</h2>';
    
    if (testResults.frontend) {
      html += '<h3>Frontend Tests</h3>';
      html += `<p>Passed: ${testResults.frontend.passed || 0}, Failed: ${testResults.frontend.failed || 0}</p>`;
    }
    
    if (testResults.backend) {
      html += '<h3>Backend Tests</h3>';
      html += `<p>Passed: ${testResults.backend.passed || 0}, Failed: ${testResults.backend.failed || 0}</p>`;
    }
    
    if (testResults.e2e) {
      html += '<h3>E2E Tests</h3>';
      html += `<p>Passed: ${testResults.e2e.passed || 0}, Failed: ${testResults.e2e.failed || 0}</p>`;
    }
    
    html += '</div>';
    return html;
  }

  async generateSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      project: 'Affilist',
      version: this.getProjectVersion(),
      summary: 'Test coverage report generated successfully',
      reports: {
        html: `coverage-report-${this.timestamp}.html`,
        json: `coverage-report-${this.timestamp}.json`,
        frontend: 'frontend-coverage/index.html',
        backend: 'backend-coverage/index.html',
        e2e: 'e2e-report/index.html',
      }
    };

    const summaryPath = path.join(this.reportsDir, 'latest-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n📊 Coverage Report Summary:');
    console.log(`📁 Reports directory: ${this.reportsDir}`);
    console.log(`🌐 HTML Report: ${summary.reports.html}`);
    console.log(`📄 JSON Report: ${summary.reports.json}`);
    
    if (fs.existsSync(path.join(this.reportsDir, 'frontend-coverage'))) {
      console.log(`🎨 Frontend Coverage: ${summary.reports.frontend}`);
    }
    
    if (fs.existsSync(path.join(this.reportsDir, 'backend-coverage'))) {
      console.log(`⚙️  Backend Coverage: ${summary.reports.backend}`);
    }
    
    if (fs.existsSync(path.join(this.reportsDir, 'e2e-report'))) {
      console.log(`🎭 E2E Report: ${summary.reports.e2e}`);
    }
  }

  getProjectVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
}

// Run the coverage report generator
if (require.main === module) {
  const generator = new CoverageReportGenerator();
  generator.generateReport().catch(console.error);
}

module.exports = CoverageReportGenerator;