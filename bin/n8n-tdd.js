#!/usr/bin/env node

const { WorkflowCLI } = require('../dist');
const { DeclarativeTestRunner } = require('../dist');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command) {
    showHelp();
    return;
  }

  try {
    if (command === 'test') {
      // Run tests
      await runTests(args.slice(1));
    } else {
      // Run workflow CLI commands
      const cli = new WorkflowCLI();
      await cli.run(args);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log('n8n-tdd-framework CLI');
  console.log('--------------------');
  console.log('');
  console.log('Usage:');
  console.log('  n8n-tdd <command> [options]');
  console.log('');
  console.log('Workflow Commands:');
  console.log('  list                           List all workflows');
  console.log('  get <id>                       Get workflow details');
  console.log('  create <name> [template]       Create a new workflow');
  console.log('  delete <id>                    Delete a workflow');
  console.log('  activate <id>                  Activate a workflow');
  console.log('  deactivate <id>                Deactivate a workflow');
  console.log('  execute <id> [data]            Execute a workflow');
  console.log('  export <id> [filename]         Export a workflow to a file');
  console.log('  export-all [directory]         Export all workflows to files');
  console.log('  import <filepath>              Import a workflow from a file');
  console.log('  save-template <id> <name>      Save a workflow as a template');
  console.log('  list-templates                 List all workflow templates');
  console.log('');
  console.log('Test Commands:');
  console.log('  test <file>                    Run tests from a file');
  console.log('  test:dir <directory>           Run tests from a directory');
  console.log('');
  console.log('Options:');
  console.log('  --help                         Show this help message');
  console.log('  --version                      Show version information');
}

async function runTests(args) {
  if (args.length === 0) {
    console.error('Error: Test file or directory is required');
    process.exit(1);
  }

  const testPath = args[0];
  const options = {
    reporter: 'console',
    cleanupAfterTests: true,
    continueOnFailure: true
  };

  // Parse additional options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--reporter' && args[i + 1]) {
      options.reporter = args[i + 1];
      i++;
    } else if (args[i] === '--no-cleanup') {
      options.cleanupAfterTests = false;
    } else if (args[i] === '--stop-on-failure') {
      options.continueOnFailure = false;
    }
  }

  const runner = new DeclarativeTestRunner(options);

  try {
    let results;

    if (args[0] === 'dir') {
      // Run tests from a directory
      const dirPath = args[1] || './tests';
      console.log(`Running tests from directory: ${dirPath}`);
      results = await runner.runTestsFromDirectory(dirPath);
    } else {
      // Run tests from a file
      console.log(`Running tests from file: ${testPath}`);
      results = await runner.runTestsFromFile(testPath);
    }

    // Exit with appropriate code
    if (results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error running tests: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});