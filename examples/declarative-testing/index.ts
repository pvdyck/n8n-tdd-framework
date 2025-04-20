import { DeclarativeTestRunner } from 'n8n-tdd-framework';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Example of using the n8n-tdd-framework for declarative testing
 */
async function runTests() {
  console.log('n8n Declarative Testing Example');
  console.log('--------------------------------');
  
  // Create a test runner
  const runner = new DeclarativeTestRunner({
    // You can provide options here, or use environment variables
    // apiUrl: 'http://localhost:5678/api/v1',
    // apiKey: 'your-api-key',
    templatesDir: path.resolve(__dirname, 'templates'),
    testsDir: path.resolve(__dirname, 'tests'),
    reporter: 'console',
    cleanupAfterTests: true,
    continueOnFailure: true
  });
  
  try {
    // Run tests from a file
    console.log('\nRunning tests from example-test.json...');
    const testFile = path.resolve(__dirname, 'tests/example-test.json');
    const results = await runner.runTestsFromFile(testFile);
    
    // Print summary
    console.log('\nTest Run Summary:');
    console.log(`Total: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    console.log(`Duration: ${results.duration}ms`);
    
    // Print detailed results
    console.log('\nDetailed Results:');
    results.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.name}`);
      
      if (result.assertions) {
        result.assertions.forEach(assertion => {
          const assertionStatus = assertion.passed ? '✓' : '✗';
          console.log(`  ${assertionStatus} ${assertion.description}`);
        });
      }
    });
    
    // Exit with appropriate code
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});