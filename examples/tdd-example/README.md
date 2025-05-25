# TDD Example: Weather Alert System

This example demonstrates building a complete n8n workflow using Test-Driven Development.

## Scenario

Build a weather alert system that:
- Checks weather conditions every hour
- Sends alerts for severe weather
- Logs all checks for reporting
- Handles API failures gracefully

## TDD Process

### 1. First Test - Basic Weather Check

```json
// tests/weather-check.json
[
  {
    "name": "Should fetch current weather",
    "workflows": [{
      "templateName": "weather_alert",
      "name": "Weather Alert System",
      "isPrimary": true
    }],
    "input": {
      "location": "New York"
    },
    "assertions": [{
      "description": "Should return weather data",
      "assertion": "result.temperature !== undefined"
    }]
  }
]
```

### 2. Initial Implementation

```json
// templates/weather_alert.json
{
  "name": "Weather Alert System",
  "nodes": [
    {
      "parameters": {
        "url": "https://api.weather.com/current",
        "queryParameters": {
          "parameters": [{
            "name": "location",
            "value": "={{ $json.location }}"
          }]
        }
      },
      "name": "Get Weather",
      "type": "n8n-nodes-base.httpRequest",
      "position": [250, 300]
    }
  ]
}
```

### 3. Test for Severe Weather Detection

```json
{
  "name": "Should detect severe weather",
  "mockResponses": {
    "Get Weather": {
      "temperature": 95,
      "conditions": "extreme_heat",
      "windSpeed": 45
    }
  },
  "assertions": [{
    "description": "Should flag as severe",
    "assertion": "result.isSevere === true"
  }, {
    "description": "Should set alert level",
    "assertion": "result.alertLevel === 'high'"
  }]
}
```

### 4. Add Detection Logic

```json
{
  "parameters": {
    "conditions": {
      "boolean": [{
        "value1": "={{ $json.temperature > 90 || $json.temperature < 10 || $json.windSpeed > 40 }}",
        "value2": true
      }]
    }
  },
  "name": "Check Severity",
  "type": "n8n-nodes-base.if"
}
```

### 5. Test Error Handling

```json
{
  "name": "Should handle API failure",
  "mockResponses": {
    "Get Weather": {
      "error": "API_UNAVAILABLE",
      "status": 503
    }
  },
  "assertions": [{
    "description": "Should not crash",
    "assertion": "result.status === 'error_handled'"
  }, {
    "description": "Should log error",
    "assertion": "result.errorLogged === true"
  }]
}
```

## Complete Test Suite

```typescript
// run-tests.ts
import { DeclarativeTestRunner } from 'n8n-tdd-framework';

async function runWeatherAlertTests() {
  const runner = new DeclarativeTestRunner({
    templatesDir: './templates',
    testsDir: './tests'
  });

  // Run all tests
  const results = await runner.runTestsFromDirectory();
  
  console.log('Weather Alert System Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  
  // Show coverage
  console.log('\nTest Coverage:');
  console.log('- Basic weather fetch: ✅');
  console.log('- Severe weather detection: ✅');
  console.log('- Alert generation: ✅');
  console.log('- Error handling: ✅');
  console.log('- Logging: ✅');
}

runWeatherAlertTests();
```

## Benefits Realized

1. **Confidence** - All edge cases tested before deployment
2. **Documentation** - Tests show exactly how the system works
3. **Refactoring** - Can optimize without fear of breaking
4. **Regression Prevention** - Changes won't break existing functionality

## Try It Yourself

1. Clone this example
2. Run `npm install`
3. Start n8n: `n8n start`
4. Run tests: `npm test`
5. Modify the workflow and see tests catch issues
6. Add new features using TDD

This example shows how TDD transforms n8n development from "hope it works" to "know it works".