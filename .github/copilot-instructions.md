# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

**PID Controller Adapter**: This adapter implements configurable PID (Proportional-Integral-Derivative) controllers for automation systems. It provides real-time control capabilities for managing setpoints, actual values, and outputs in control loops. The adapter supports multiple controller instances with individual parameter configurations including Kp (proportional gain), Tn (integral time), Tv (derivative time), min/max limits, and operational modes like manual override and controller suspend functionality.

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

**PID Controller Testing**: Focus on mathematical accuracy of PID calculations, parameter validation (ensure Kp > 0, Tn >= 0, Tv >= 0), limit handling (min/max output constraints), and state management for control modes. Test edge cases like division by zero in integral calculations, controller reset functionality, and proper handling of manual mode transitions.

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', () => new Promise(async (resolve) => {
                // Get adapter object and configure
                harness.objects.getObject('system.adapter.brightsky.0', async (err, obj) => {
                    if (err) {
                        console.error('Error getting adapter object:', err);
                        resolve();
                        return;
                    }

                    // Configure adapter properties
                    obj.native.position = TEST_COORDINATES;
                    obj.native.createCurrently = true;
                    obj.native.createHourly = true;
                    obj.native.createDaily = true;
                    // ... other configuration

                    // Set the updated configuration
                    harness.objects.setObject(obj._id, obj);

                    // Start adapter and wait
                    await harness.startAdapterAndWait();

                    // Wait for adapter to process data
                    setTimeout(() => {
                        // Verify states were created
                        harness.states.getState('brightsky.0.info.connection', (err, state) => {
                            if (state && state.val === true) {
                                console.log('✅ Adapter started successfully');
                            }
                            resolve();
                        });
                    }, 15000); // Allow time for API calls
                });
            })).timeout(30000);
        });
    }
});
```

**PID Controller Integration Testing**: Create test scenarios with known PID parameters and input sequences to verify mathematical correctness. Test controller startup with various configurations, state creation for all controller folders (cfg, in, out, para, xtra), and proper handling of controller cycles. Verify that manual mode overrides work correctly and that controller reset functionality properly clears integral accumulator.

#### Testing Both Success AND Failure Scenarios

**IMPORTANT**: For every "it works" test, implement corresponding "it doesn't work and fails" tests. This ensures proper error handling and validates that your adapter fails gracefully when expected.

```javascript
// Example: Testing successful configuration
it('should accept valid configuration', async () => {
    // Test with proper values
    const config = { /* valid config */ };
    await harness.changeAdapterConfig('adapter-name', config);
    const result = await harness.startAdapter();
    expect(result).toBe(true);
});

// Example: Testing invalid configuration
it('should reject invalid configuration and log errors', async () => {
    // Test with invalid values that should cause graceful failure
    const invalidConfig = { /* invalid config */ };
    await harness.changeAdapterConfig('adapter-name', invalidConfig);
    
    // Expect adapter to handle gracefully, not crash
    const result = await harness.startAdapter();
    // Could be true (handled gracefully) or false (rejected properly)
    expect(typeof result).toBe('boolean');
    
    // Check that appropriate error was logged
    const logs = harness.getLogMessages();
    expect(logs.some(log => log.level === 'error' && log.message.includes('configuration'))).toBe(true);
});
```

**PID Controller Error Testing**: Test invalid parameter combinations (negative Kp, cycle time < 100ms, invalid min/max ranges), missing state inputs, and controller behavior when actual value inputs are unavailable. Verify graceful handling of mathematical edge cases like integral windup scenarios.

## TypeScript Support

This adapter uses TypeScript for enhanced type safety and better development experience.

### Type Definitions
- Use proper TypeScript interfaces for configuration objects
- Define types for state objects and controller parameters
- Implement proper type checking for all public methods
- Example adapter configuration typing:
  ```typescript
  interface AdapterConfig {
    ctrlMode: number;
    ctrlActDiff: boolean;
    // Add other config properties
  }
  ```

**PID Controller Types**: Define interfaces for PidController parameters including kp, tn, tv, min, max, off, sup values. Create types for controller states (running, manual, hold), and define enums for controller operational modes. Ensure proper typing for mathematical operations to prevent runtime errors in control calculations.

### TSConfig Setup
- Use `@tsconfig/node14` for proper Node.js compatibility
- Configure proper type checking with strict mode enabled
- Include proper path mapping for lib directory imports

## ioBroker Adapter Patterns

### Adapter Lifecycle
```javascript
class AdapterName extends utils.Adapter {
  constructor(options) {
    super({ ...options, name: 'adapter-name' });
    this.on('ready', this.onReady.bind(this));
    this.on('stateChange', this.onStateChange.bind(this));
    this.on('unload', this.onUnload.bind(this));
  }

  async onReady() {
    // Initialize adapter
    await this.initStateObjects();
    // Start main functionality
  }

  async onStateChange(id, state) {
    if (state && !state.ack) {
      // Handle state changes
    }
  }

  onUnload(callback) {
    try {
      // Cleanup resources
      callback();
    } catch (e) {
      callback();
    }
  }
}
```

**PID Controller Lifecycle**: Initialize controller instances in onReady(), create state objects for each configured controller with proper folder structure, set up timer-based calculation cycles, and implement proper state change handlers for input parameters (act, set, man_inp) and control parameters (kp, tn, tv). Ensure all timers are cleared in onUnload() to prevent memory leaks.

### State Management
- Use `setState()` with proper acknowledge flags
- Implement proper state object creation with `setObjectNotExists()`
- Handle state changes with proper validation
- Use proper roles and types for different state categories

**PID Controller States**: Create organized state structure with folders: cfg (read-only configuration), in (input values like act, set, man_inp), out (output values like y), para (tunable parameters like kp, tn, tv), and xtra (operational states like run). Implement proper acknowledgment handling for control inputs and ensure mathematical calculations update output states with ack=true.

### Error Handling
```javascript
try {
  // Main functionality
} catch (error) {
  this.log.error(`Error in functionality: ${error.message}`);
  // Handle gracefully without crashing
}
```

**PID Controller Error Handling**: Implement robust error handling for mathematical operations (check for division by zero in derivative calculations), validate parameter ranges before applying to control algorithm, handle missing or invalid input states gracefully, and provide clear error messages for configuration issues like invalid cycle times or parameter conflicts.

## Configuration and Setup

### io-package.json Structure
```json
{
  "common": {
    "name": "adapter-name",
    "version": "1.0.0",
    "title": "Adapter Title",
    "desc": {
      "en": "Description in English",
      "de": "Beschreibung auf Deutsch"
    },
    "authors": ["Author Name <email@example.com>"],
    "keywords": ["keyword1", "keyword2"],
    "license": "MIT",
    "platform": "Javascript/Node.js",
    "main": "main.js",
    "icon": "adapter.png",
    "enabled": true,
    "mode": "daemon",
    "type": "general",
    "compact": true
  },
  "native": {
    // Default configuration
  }
}
```

**PID Controller Configuration**: Define native configuration for controller mode (ctrlMode) and actual value differential option (ctrlActDiff). Support multiple controller instances with individual configuration including cycle times, parameter values, and operational limits. Implement configuration validation to ensure mathematical stability and proper parameter ranges.

### Admin Interface
- Use JSON configuration for simpler setup
- Implement proper form validation
- Provide helpful descriptions and tooltips
- Support multiple languages where applicable

**PID Controller Admin**: Design configuration interface for multiple PID controllers with intuitive parameter input fields, validation feedback for parameter ranges, and clear explanations of PID tuning concepts. Include preset configurations for common control applications and provide calculation helpers for parameter conversion between Kp/Tn/Tv and alternative formats.

## Performance and Resource Management

### Memory Management
- Clean up timers and intervals in `onUnload()`
- Avoid memory leaks by properly removing event listeners
- Use appropriate data structures for state storage

**PID Controller Performance**: Optimize calculation cycles to prevent excessive CPU usage, implement efficient state updates only when values change significantly, and use appropriate numerical precision for control calculations. Consider implementing anti-windup measures for integral calculations to prevent performance degradation during sustained limit conditions.

### Logging Best Practices
```javascript
this.log.debug('Debug information for development');
this.log.info('Important operational information');
this.log.warn('Warning about potential issues');
this.log.error('Error that needs attention');
```

**PID Controller Logging**: Log controller initialization with parameter summary, provide debug output for calculation steps during development, warn about parameter changes that might affect stability, and log error conditions like invalid inputs or mathematical issues. Use appropriate log levels to avoid flooding logs during normal operation.

## Libraries and Dependencies

### Core Dependencies
- `@iobroker/adapter-core`: Essential adapter framework
- `@iobroker/testing`: Official testing framework for integration tests

**PID Controller Libraries**: Utilize the `@mcm1957/iobroker.library` for common ioBroker utilities and state management helpers. Implement the PID control algorithm using the custom `./lib/pid.js` module for mathematical calculations and control logic separation.

### Development Dependencies
- `@types/node`: TypeScript definitions for Node.js
- `eslint`: Code linting and style enforcement
- `prettier`: Code formatting
- `typescript`: TypeScript compiler support

## Unload and Cleanup

The `onUnload` method is crucial for proper adapter shutdown:

```javascript
onUnload(callback) {
  try {
    // Clear all timers
    if (this.connectionTimer) {
      clearInterval(this.connectionTimer);
      this.connectionTimer = undefined;
    }
    // Close connections, clean up resources
    callback();
  } catch (e) {
    callback();
  }
}
```

**PID Controller Cleanup**: Clear all controller calculation timers, reset any active control outputs to safe states if required, and ensure proper cleanup of controller instances and their associated resources. Handle cleanup gracefully even if controllers are in active calculation cycles.

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods

**PID Controller Standards**: Follow mathematical precision standards for control calculations, use consistent parameter naming conventions (kp for proportional gain, tn for integral time, tv for derivative time), implement proper bounds checking for all control parameters, and maintain clear separation between control algorithm logic and ioBroker state management.

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

**PID Controller CI/CD**: Focus on mathematical accuracy testing with known input/output sequences, validate parameter boundary conditions, and test controller behavior under various load conditions. Since this is a computational adapter without external API dependencies, concentrate on algorithm verification and performance testing rather than connectivity tests.

### Practical Example: Complete API Testing Implementation
Here's a complete example based on lessons learned from the Discovergy adapter:

#### test/integration-demo.js
```javascript
const path = require("path");
const { tests } = require("@iobroker/testing");

// Helper function to encrypt password using ioBroker's encryption method
async function encryptPassword(harness, password) {
    const systemConfig = await harness.objects.getObjectAsync("system.config");
    
    if (!systemConfig || !systemConfig.native || !systemConfig.native.secret) {
        throw new Error("Could not retrieve system secret for password encryption");
    }
    
    const secret = systemConfig.native.secret;
    let result = '';
    for (let i = 0; i < password.length; ++i) {
        result += String.fromCharCode(secret[i % secret.length].charCodeAt(0) ^ password.charCodeAt(i));
    }
    
    return result;
}

// Run integration tests with demo credentials
tests.integration(path.join(__dirname, ".."), {
    defineAdditionalTests({ suite }) {
        suite("API Testing with Demo Credentials", (getHarness) => {
            let harness;
            
            before(() => {
                harness = getHarness();
            });

            it("Should connect to API and initialize with demo credentials", async () => {
                console.log("Setting up demo credentials...");
                
                if (harness.isAdapterRunning()) {
                    await harness.stopAdapter();
                }
                
                const encryptedPassword = await encryptPassword(harness, "demo_password");
                
                await harness.changeAdapterConfig("your-adapter", {
                    native: {
                        username: "demo@provider.com",
                        password: encryptedPassword,
                        // other config options
                    }
                });

                console.log("Starting adapter with demo credentials...");
                await harness.startAdapter();
                
                // Wait for API calls and initialization
                await new Promise(resolve => setTimeout(resolve, 60000));
                
                const connectionState = await harness.states.getStateAsync("your-adapter.0.info.connection");
                
                if (connectionState && connectionState.val === true) {
                    console.log("✅ SUCCESS: API connection established");
                    return true;
                } else {
                    throw new Error("API Test Failed: Expected API connection to be established with demo credentials. " +
                        "Check logs above for specific API errors (DNS resolution, 401 Unauthorized, network issues, etc.)");
                }
            }).timeout(120000);
        });
    }
});
```

**PID Controller Integration Testing**: Create comprehensive test scenarios with predefined controller configurations, verify mathematical accuracy of PID calculations with known input sequences, test state management for all controller parameters, and validate proper handling of operational modes (manual, automatic, suspended). Focus on algorithmic correctness rather than external connectivity.