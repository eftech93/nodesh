#!/usr/bin/env node

/**
 * Generate a Docsify-compatible test report from Jest results
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_FILE = path.join(__dirname, '../docs/test-report.md');

function runTests() {
  try {
    const result = execSync(
      'npx jest --json --silent --testLocationInResults',
      { encoding: 'utf-8', cwd: path.join(__dirname, '..') }
    );
    return JSON.parse(result);
  } catch (error) {
    // Jest returns non-zero exit code when tests fail, but still outputs JSON
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        console.error('Failed to parse test results');
        process.exit(1);
      }
    }
    throw error;
  }
}

function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function generateReport(data) {
  const { numTotalTestSuites, numPassedTestSuites, numFailedTestSuites, numPendingTestSuites, numTotalTests, numPassedTests, numFailedTests, numPendingTests, testResults } = data;
  
  const successRate = ((numPassedTests / numTotalTests) * 100).toFixed(1);
  const suiteSuccessRate = ((numPassedTestSuites / numTotalTestSuites) * 100).toFixed(1);
  
  let report = `# Test Report

> Generated: ${new Date().toISOString()}

📈 [View Coverage Report](coverage-report.md)

## Summary

| Metric | Value |
|--------|-------|
| **Test Suites** | ${numPassedTestSuites} passed, ${numFailedTestSuites} failed, ${numPendingTestSuites} pending (total: ${numTotalTestSuites}) |
| **Tests** | ${numPassedTests} passed, ${numFailedTests} failed, ${numPendingTests} pending (total: ${numTotalTests}) |
| **Suite Success Rate** | ${suiteSuccessRate}% |
| **Test Success Rate** | ${successRate}% |

## Progress Bar

<div style="margin: 20px 0;">
  <div style="background: #e0e0e0; border-radius: 4px; height: 24px; overflow: hidden; font-size: 12px; line-height: 24px; text-align: center; color: white;">
    <div style="background: #4caf50; height: 100%; width: ${successRate}%; float: left;">${numPassedTests} passed</div>
    ${numFailedTests > 0 ? `<div style="background: #f44336; height: 100%; width: ${(numFailedTests / numTotalTests) * 100}%; float: left;">${numFailedTests} failed</div>` : ''}
    ${numPendingTests > 0 ? `<div style="background: #ff9800; height: 100%; width: ${(numPendingTests / numTotalTests) * 100}%; float: left;">${numPendingTests} pending</div>` : ''}
  </div>
</div>

## Test Suites

`;

  // Group by status
  const passedSuites = [];
  const failedSuites = [];
  const pendingSuites = [];

  for (const suite of testResults) {
    if (suite.status === 'failed') {
      failedSuites.push(suite);
    } else if (suite.status === 'pending') {
      pendingSuites.push(suite);
    } else {
      passedSuites.push(suite);
    }
  }

  // Failed suites first
  if (failedSuites.length > 0) {
    report += `### ❌ Failed (${failedSuites.length})\n\n`;
    for (const suite of failedSuites) {
      report += generateSuiteReport(suite);
    }
  }

  // Pending suites
  if (pendingSuites.length > 0) {
    report += `### ⏸️ Pending (${pendingSuites.length})\n\n`;
    for (const suite of pendingSuites) {
      report += generateSuiteReport(suite);
    }
  }

  // Passed suites
  if (passedSuites.length > 0) {
    report += `### ✅ Passed (${passedSuites.length})\n\n<details>\n<summary>Click to expand passed test suites</summary>\n\n`;
    for (const suite of passedSuites) {
      report += generateSuiteReport(suite);
    }
    report += `</details>\n\n`;
  }

  return report;
}

function generateSuiteReport(suite) {
  const { name, status, assertionResults, perfStats } = suite;
  const relativePath = name.replace(process.cwd(), '').replace(/^\//, '');
  
  const passed = assertionResults.filter(t => t.status === 'passed').length;
  const failed = assertionResults.filter(t => t.status === 'failed').length;
  const pending = assertionResults.filter(t => t.status === 'pending').length;
  
  const icon = status === 'failed' ? '❌' : status === 'pending' ? '⏸️' : '✅';
  const duration = perfStats ? formatDuration(perfStats.runtime) : 'N/A';
  
  let report = `#### ${icon} ${relativePath}\n\n`;
  report += `- **Status**: ${status}  \n`;
  report += `- **Duration**: ${duration}  \n`;
  report += `- **Tests**: ${passed} passed, ${failed} failed, ${pending} pending  \n\n`;
  
  // List failed tests
  const failedTests = assertionResults.filter(t => t.status === 'failed');
  if (failedTests.length > 0) {
    report += `**Failed Tests:**\n\n`;
    for (const test of failedTests) {
      report += `- ❌ ${test.ancestorTitles.join(' › ')}${test.ancestorTitles.length ? ' › ' : ''}${test.title}\n`;
      if (test.failureMessages && test.failureMessages.length > 0) {
        const errorMessage = test.failureMessages[0].split('\n').slice(0, 5).join('\n  ');
        report += `  \`\`\`\n  ${errorMessage}\n  \`\`\`\n`;
      }
    }
    report += '\n';
  }
  
  return report;
}

function main() {
  console.log('Running tests and generating report...');
  
  const data = runTests();
  const report = generateReport(data);
  
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`Test report generated: ${OUTPUT_FILE}`);
  
  // Print summary
  console.log(`\nSummary: ${data.numPassedTests}/${data.numTotalTests} tests passed (${((data.numPassedTests / data.numTotalTests) * 100).toFixed(1)}%)`);
  
  if (data.numFailedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTests, generateReport };
