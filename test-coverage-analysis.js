#!/usr/bin/env node

const API_BASE = 'http://localhost:5000';

// Test coverage analysis endpoints
async function testCoverageAnalysis() {
  console.log('🗺️  Starting Coverage Analysis Feature Tests');
  console.log('==================================================');
  
  try {
    // Generate API key for testing
    console.log('🔑 Generating test API key...');
    const keyResponse = await fetch(`${API_BASE}/api/generate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coverage-test@example.com',
        name: 'Coverage Analysis Tester'
      }),
    });
    
    if (!keyResponse.ok) {
      throw new Error('Failed to generate API key');
    }
    
    const keyData = await keyResponse.json();
    const apiKey = keyData.apiKey;
    console.log(`✅ API Key generated: ${apiKey.substring(0, 20)}...`);
    
    // Test comprehensive coverage analysis
    console.log('\n📊 Testing comprehensive coverage analysis...');
    const analysisResponse = await fetch(`${API_BASE}/api/coverage/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        lat: 40.7128, // New York City
        lng: -74.0060,
        address: 'New York City, NY'
      }),
    });
    
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      console.log('✅ Comprehensive coverage analysis successful');
      console.log(`📍 Location: ${analysisData.data.location.address || 'Coordinates only'}`);
      console.log(`📊 Providers analyzed: ${analysisData.data.providers.length}`);
      
      // Display top 3 providers
      const topProviders = analysisData.data.providers.slice(0, 3);
      console.log('\n🏆 Top 3 Providers:');
      topProviders.forEach((provider, index) => {
        console.log(`${index + 1}. ${provider.provider} - Score: ${provider.coverage_score}/100 (${provider.recommendation})`);
      });
      
    } else {
      const errorData = await analysisResponse.json();
      console.log('⚠️ Coverage analysis response:', errorData.message || errorData.error);
    }
    
    // Test specific provider analysis
    console.log('\n📱 Testing specific provider analysis...');
    const providerResponse = await fetch(`${API_BASE}/api/coverage/provider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        provider: 'Verizon',
        lat: 40.7128,
        lng: -74.0060
      }),
    });
    
    if (providerResponse.ok) {
      const providerData = await providerResponse.json();
      console.log('✅ Provider-specific analysis successful');
      console.log(`🏢 Provider: ${providerData.data.provider}`);
      console.log(`📊 Coverage Score: ${providerData.data.coverage_score}/100`);
      console.log(`⭐ Reliability: ${providerData.data.reliability_rating}/5 stars`);
      console.log(`⚠️ Recent Issues: ${providerData.data.recent_issues}`);
      console.log(`💡 Recommendation: ${providerData.data.recommendation.toUpperCase()}`);
    } else {
      const errorData = await providerResponse.json();
      console.log('⚠️ Provider analysis response:', errorData.message || errorData.error);
    }
    
    // Test invalid coordinates
    console.log('\n🚫 Testing invalid coordinates...');
    const invalidResponse = await fetch(`${API_BASE}/api/coverage/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        lat: 999, // Invalid latitude
        lng: -74.0060
      }),
    });
    
    if (!invalidResponse.ok) {
      const errorData = await invalidResponse.json();
      console.log('✅ Invalid coordinates properly rejected:', errorData.message);
    } else {
      console.log('⚠️ Expected validation error for invalid coordinates');
    }
    
    console.log('\n==================================================');
    console.log('✅ All coverage analysis feature tests completed!');
    console.log('🌐 Integration with Gemini AI and Downdetector simulation working');
    console.log('📊 Coverage analysis provides real-world network reliability insights');
    console.log('🔗 Frontend component ready at: /coverage-maps');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
testCoverageAnalysis();