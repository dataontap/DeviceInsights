// Test script to demonstrate Firebase messaging features
const API_BASE = 'http://localhost:5000';

// First, let's generate an API key for testing
async function generateTestApiKey() {
  console.log('🔑 Generating test API key...');
  
  const response = await fetch(`${API_BASE}/api/generate-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test-messaging@example.com',
      name: 'Firebase Messaging Test'
    }),
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log('✅ API Key generated:', result.apiKey.substring(0, 20) + '...');
    return result.apiKey;
  } else {
    console.error('❌ Failed to generate API key:', result);
    return null;
  }
}

// Test SMS messaging endpoint
async function testSMSMessaging(apiKey) {
  console.log('\n📱 Testing SMS messaging...');
  
  const response = await fetch(`${API_BASE}/api/messaging/sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      phoneNumber: '+1234567890',
      message: 'Test SMS from IMEI Device Checker! 🚀'
    }),
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log('✅ SMS endpoint responded:', result.message);
  } else {
    console.log('⚠️ SMS endpoint response:', result.message || result.error);
  }
}

// Test email messaging endpoint  
async function testEmailMessaging(apiKey) {
  console.log('\n📧 Testing email messaging...');
  
  const response = await fetch(`${API_BASE}/api/messaging/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      email: 'test@example.com',
      subject: 'IMEI Device Analysis Complete',
      body: '<h2>Your device analysis is ready!</h2><p>Your device is compatible with the OXIO network.</p>'
    }),
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log('✅ Email endpoint responded:', result.message);
  } else {
    console.log('⚠️ Email endpoint response:', result.message || result.error);
  }
}

// Test push notification endpoint
async function testPushMessaging(apiKey) {
  console.log('\n🔔 Testing push notification...');
  
  // Using a mock FCM token for testing
  const mockFcmToken = 'dGVzdC1mY20tdG9rZW4tZm9yLWRlbW9uc3RyYXRpb24';
  
  const response = await fetch(`${API_BASE}/api/messaging/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      token: mockFcmToken,
      title: 'IMEI Analysis Complete',
      body: 'Your device compatibility check is ready to view!',
      data: {
        deviceMake: 'Apple',
        deviceModel: 'iPhone 14 Pro',
        compatible: 'true'
      }
    }),
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log('✅ Push notification endpoint responded:', result.message);
  } else {
    console.log('⚠️ Push notification response:', result.message || result.error);
  }
}

// Test regular IMEI check to ensure basic functionality still works
async function testImeiCheck(apiKey) {
  console.log('\n🔍 Testing IMEI device check...');
  
  const response = await fetch(`${API_BASE}/api/v1/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      imei: '355965230012345',
      location: 'New York, NY',
      network: 'OXIO'
    }),
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log('✅ IMEI check successful:', result.device?.make, result.device?.model);
  } else {
    console.log('⚠️ IMEI check response:', result.message || result.error);
  }
}

// Main test function
async function runMessagingTests() {
  console.log('🚀 Starting Firebase Messaging Feature Tests');
  console.log('='.repeat(50));
  
  try {
    // Generate API key
    const apiKey = await generateTestApiKey();
    if (!apiKey) {
      console.log('❌ Cannot proceed without API key');
      return;
    }
    
    // Test all messaging features
    await testSMSMessaging(apiKey);
    await testEmailMessaging(apiKey);
    await testPushMessaging(apiKey);
    await testImeiCheck(apiKey);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All messaging feature tests completed!');
    console.log('📊 Check the admin dashboard to see the Firebase Messaging Center');
    console.log('🔗 Admin login: http://localhost:5000/admin');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  }
}

// Run the tests
runMessagingTests();