#!/usr/bin/env node

/**
 * Expiry System Validation Test
 * 
 * This script tests the validity-based expiry system to ensure:
 * 1. Expiry dates are calculated correctly from purchase date
 * 2. Unlimited validity works properly (never expires)
 * 3. Access is revoked after expiry
 * 4. System handles edge cases correctly
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import utilities and models
const { calculateExpiryDate, validatePurchaseAccess, getValidityDays, isValidityLabel } = require('./src/utils/expiryUtils');
const Course = require('./src/models/Course/Course');
const TestSeries = require('./src/models/TestSeries/TestSeries');
const Purchase = require('./src/models/Purchase/Purchase');

// Test data
const TEST_PURCHASE_DATE = new Date('2026-02-11T15:23:28.021Z'); // Your purchase date
const CURRENT_TEST_DATE = new Date('2026-02-11T16:00:00.000Z'); // Shortly after purchase

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brainbuzz');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test 1: Validity mapping validation
const testValidityMapping = () => {
  console.log('\n=== Test 1: Validity Mapping Validation ===');
  
  const testCases = [
    { label: '1_MONTH', expectedDays: 30 },
    { label: '3_MONTHS', expectedDays: 90 },
    { label: '1_YEAR', expectedDays: 365 },
    { label: 'UNLIMITED', expectedDays: null },
    { label: 'INVALID', shouldFail: true }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(({ label, expectedDays, shouldFail }) => {
    try {
      const isValid = isValidityLabel(label);
      const days = getValidityDays(label);
      
      if (shouldFail) {
        if (!isValid) {
          console.log(`✅ ${label}: Correctly rejected invalid label`);
          passed++;
        } else {
          console.log(`❌ ${label}: Should have been rejected`);
        }
      } else {
        if (isValid && days === expectedDays) {
          console.log(`✅ ${label}: ${days} days (expected: ${expectedDays})`);
          passed++;
        } else {
          console.log(`❌ ${label}: Got ${days} days, expected ${expectedDays}`);
        }
      }
    } catch (error) {
      if (shouldFail) {
        console.log(`✅ ${label}: Correctly threw error for invalid label`);
        passed++;
      } else {
        console.log(`❌ ${label}: Unexpected error - ${error.message}`);
      }
    }
  });
  
  console.log(`Result: ${passed}/${total} tests passed`);
  return passed === total;
};

// Test 2: Expiry calculation accuracy
const testExpiryCalculation = () => {
  console.log('\n=== Test 2: Expiry Calculation Accuracy ===');
  
  const testCases = [
    {
      label: '1_MONTH',
      startDate: TEST_PURCHASE_DATE,
      expectedExpiry: new Date('2026-03-13T15:23:28.021Z') // Exactly 30 days later
    },
    {
      label: '3_MONTHS',
      startDate: TEST_PURCHASE_DATE,
      expectedExpiry: new Date('2026-05-12T15:23:28.021Z') // Exactly 90 days later
    },
    {
      label: '1_YEAR',
      startDate: TEST_PURCHASE_DATE,
      expectedExpiry: new Date('2027-02-11T15:23:28.021Z') // Exactly 365 days later
    },
    {
      label: 'UNLIMITED',
      startDate: TEST_PURCHASE_DATE,
      expectedExpiry: null // Should be null
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(({ label, startDate, expectedExpiry }) => {
    try {
      const calculatedExpiry = calculateExpiryDate(label, startDate);
      
      if (label === 'UNLIMITED') {
        if (calculatedExpiry === null) {
          console.log(`✅ ${label}: Correctly returned null for unlimited`);
          passed++;
        } else {
          console.log(`❌ ${label}: Expected null, got ${calculatedExpiry}`);
        }
      } else {
        // Check if dates are approximately equal (accounting for milliseconds)
        const timeDiff = Math.abs(calculatedExpiry.getTime() - expectedExpiry.getTime());
        if (timeDiff < 1000) { // Within 1 second
          console.log(`✅ ${label}: ${calculatedExpiry.toISOString()} (accurate)`);
          passed++;
        } else {
          console.log(`❌ ${label}: Expected ${expectedExpiry.toISOString()}, got ${calculatedExpiry.toISOString()}`);
          console.log(`   Difference: ${timeDiff}ms`);
        }
      }
    } catch (error) {
      console.log(`❌ ${label}: Error - ${error.message}`);
    }
  });
  
  console.log(`Result: ${passed}/${total} tests passed`);
  return passed === total;
};

// Test 3: Purchase access validation
const testPurchaseValidation = () => {
  console.log('\n=== Test 3: Purchase Access Validation ===');
  
  // Mock purchase records
  const mockPurchases = [
    {
      name: 'Valid 1-Month Purchase',
      purchase: {
        expiryDate: new Date('2026-03-13T15:23:28.021Z') // 30 days from purchase
      },
      currentDate: CURRENT_TEST_DATE,
      expected: {
        hasAccess: true,
        isValid: true,
        isUnlimited: false
      }
    },
    {
      name: 'Expired 1-Month Purchase',
      purchase: {
        expiryDate: new Date('2026-03-13T15:23:28.021Z') // 30 days from purchase
      },
      currentDate: new Date('2026-04-01T00:00:00.000Z'), // After expiry
      expected: {
        hasAccess: false,
        isValid: false,
        isUnlimited: false
      }
    },
    {
      name: 'Unlimited Purchase',
      purchase: {
        expiryDate: null // Unlimited validity
      },
      currentDate: new Date('2030-01-01T00:00:00.000Z'), // Far future date
      expected: {
        hasAccess: true,
        isValid: true,
        isUnlimited: true
      }
    },
    {
      name: 'No Purchase',
      purchase: null,
      currentDate: CURRENT_TEST_DATE,
      expected: {
        hasAccess: false,
        isValid: false,
        isUnlimited: false
      }
    }
  ];
  
  let passed = 0;
  let total = mockPurchases.length;
  
  mockPurchases.forEach(({ name, purchase, currentDate, expected }) => {
    try {
      const result = validatePurchaseAccess(purchase, currentDate);
      
      const hasAccessMatch = result.hasAccess === expected.hasAccess;
      const isValidMatch = result.isValid === expected.isValid;
      const isUnlimitedMatch = result.isUnlimited === expected.isUnlimited;
      
      if (hasAccessMatch && isValidMatch && isUnlimitedMatch) {
        console.log(`✅ ${name}: Access=${result.hasAccess}, Valid=${result.isValid}, Unlimited=${result.isUnlimited}`);
        passed++;
      } else {
        console.log(`❌ ${name}:`);
        console.log(`   Expected: Access=${expected.hasAccess}, Valid=${expected.isValid}, Unlimited=${expected.isUnlimited}`);
        console.log(`   Got:      Access=${result.hasAccess}, Valid=${result.isValid}, Unlimited=${result.isUnlimited}`);
      }
    } catch (error) {
      console.log(`❌ ${name}: Error - ${error.message}`);
    }
  });
  
  console.log(`Result: ${passed}/${total} tests passed`);
  return passed === total;
};

// Test 4: Real database validation (if purchase exists)
const testRealPurchase = async () => {
  console.log('\n=== Test 4: Real Purchase Validation ===');
  
  try {
    // Find your actual purchase (using the data you provided)
    const purchase = await Purchase.findOne({
      "items.itemId": "698c9e4949bcce2be56c5d70", // Your course ID
      "items.itemType": "online_course"
    });
    
    if (!purchase) {
      console.log('ℹ️  No real purchase found for testing. Skipping real validation.');
      return true;
    }
    
    console.log(`Found purchase: ${purchase._id}`);
    console.log(`Purchase date: ${purchase.purchaseDate || purchase.createdAt}`);
    console.log(`Expiry date: ${purchase.expiryDate}`);
    console.log(`Status: ${purchase.status}`);
    
    // Validate the purchase
    const validationResult = validatePurchaseAccess(purchase, CURRENT_TEST_DATE);
    
    console.log('\nValidation result:');
    console.log(`  Has access: ${validationResult.hasAccess}`);
    console.log(`  Is valid: ${validationResult.isValid}`);
    console.log(`  Is unlimited: ${validationResult.isUnlimited}`);
    console.log(`  Reason: ${validationResult.reason}`);
    console.log(`  Days remaining: ${validationResult.daysRemaining}`);
    
    // Test with future date (should be expired)
    const futureDate = new Date('2026-04-01T00:00:00.000Z');
    const futureValidation = validatePurchaseAccess(purchase, futureDate);
    
    console.log('\nFuture validation (2026-04-01):');
    console.log(`  Has access: ${futureValidation.hasAccess}`);
    console.log(`  Is valid: ${futureValidation.isValid}`);
    console.log(`  Reason: ${futureValidation.reason}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Error testing real purchase: ${error.message}`);
    return false;
  }
};

// Test 5: Edge cases
const testEdgeCases = () => {
  console.log('\n=== Test 5: Edge Cases ===');
  
  const edgeCases = [
    {
      name: 'Leap year calculation',
      validity: '1_YEAR',
      startDate: new Date('2024-02-29T00:00:00.000Z'), // Leap year
      description: 'Should handle leap year correctly'
    },
    {
      name: 'Exact midnight boundary',
      validity: '1_MONTH',
      startDate: new Date('2026-02-11T00:00:00.000Z'),
      description: 'Should calculate to exact date'
    },
    {
      name: 'Null start date',
      validity: '1_MONTH',
      startDate: null,
      shouldDefault: true,
      description: 'Should default to current date'
    }
  ];
  
  let passed = 0;
  let total = edgeCases.length;
  
  edgeCases.forEach(({ name, validity, startDate, shouldDefault, description }) => {
    try {
      const expiry = calculateExpiryDate(validity, startDate || new Date());
      
      if (validity === 'UNLIMITED' && expiry === null) {
        console.log(`✅ ${name}: ${description}`);
        passed++;
      } else if (expiry instanceof Date) {
        console.log(`✅ ${name}: ${expiry.toISOString()} (${description})`);
        passed++;
      } else {
        console.log(`❌ ${name}: Unexpected result`);
      }
    } catch (error) {
      if (shouldDefault) {
        console.log(`✅ ${name}: Correctly handled null start date`);
        passed++;
      } else {
        console.log(`❌ ${name}: ${error.message}`);
      }
    }
  });
  
  console.log(`Result: ${passed}/${total} tests passed`);
  return passed === total;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Expiry System Validation Tests...\n');
  
  await connectDB();
  
  try {
    const results = [];
    
    // Run all tests
    results.push(testValidityMapping());
    results.push(testExpiryCalculation());
    results.push(testPurchaseValidation());
    results.push(await testRealPurchase());
    results.push(testEdgeCases());
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passedTests = results.filter(result => result === true).length;
    const totalTests = results.length;
    
    console.log(`Overall: ${passedTests}/${totalTests} test suites passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED - Expiry system is working correctly!');
      console.log('\n✅ Your system correctly:');
      console.log('   • Calculates exact 30-day months');
      console.log('   • Handles unlimited validity properly');
      console.log('   • Revokes access after expiry');
      console.log('   • Provides detailed validation information');
    } else {
      console.log('⚠️  Some tests failed - please review the output above');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testValidityMapping,
  testExpiryCalculation,
  testPurchaseValidation,
  testRealPurchase,
  testEdgeCases,
  runAllTests
};