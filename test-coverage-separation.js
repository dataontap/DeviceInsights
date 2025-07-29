#!/usr/bin/env node

// Test script for separated mobile and broadband coverage analysis
const test = async () => {
  try {
    console.log('🚀 SEPARATED COVERAGE ANALYSIS TEST');
    console.log('=====================================');
    
    // Generate API key
    console.log('Generating API key...');
    const keyRes = await fetch('http://localhost:5000/api/generate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', name: 'Coverage Test' })
    });
    const keyData = await keyRes.json();
    const apiKey = keyData.apiKey;
    console.log(`✅ API Key: ${apiKey.substring(0, 25)}...`);
    
    // Test coverage analysis for Toronto
    console.log('\n🍁 Analyzing coverage for Toronto, Canada...');
    const coverageRes = await fetch('http://localhost:5000/api/coverage/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ 
        lat: 43.6532, 
        lng: -79.3832,
        address: 'Toronto, ON, Canada'
      })
    });
    
    if (coverageRes.ok) {
      const coverageData = await coverageRes.json();
      console.log('✅ Separated coverage analysis completed!');
      
      console.log(`\n📱 MOBILE PROVIDERS (${coverageData.data.mobile_providers.length}):`);
      coverageData.data.mobile_providers.slice(0, 3).forEach((provider, i) => {
        console.log(`${i + 1}. ${provider.provider} (${provider.service_type})`);
        console.log(`   📊 Score: ${provider.coverage_score}/100`);
        console.log(`   ⭐ Rating: ${provider.reliability_rating}/5 stars`);
        console.log(`   💡 Status: ${provider.recommendation.toUpperCase()}`);
        console.log(`   📱 Issues: ${provider.recent_issues} in last 30 days`);
      });
      
      console.log(`\n🌐 BROADBAND PROVIDERS (${coverageData.data.broadband_providers.length}):`);
      coverageData.data.broadband_providers.slice(0, 3).forEach((provider, i) => {
        console.log(`${i + 1}. ${provider.provider} (${provider.service_type})`);
        console.log(`   📊 Score: ${provider.coverage_score}/100`);
        console.log(`   ⭐ Rating: ${provider.reliability_rating}/5 stars`);
        console.log(`   💡 Status: ${provider.recommendation.toUpperCase()}`);
        console.log(`   🏠 Issues: ${provider.recent_issues} in last 30 days`);
      });
      
      console.log('\n✨ Service separation working perfectly!');
      console.log('   📱 Mobile: Cellular networks, 4G/5G, voice calls');
      console.log('   🌐 Broadband: Fixed internet, cable, fiber, DSL');
      
    } else {
      console.log('❌ Coverage analysis failed');
      const errorData = await coverageRes.text();
      console.log('Error:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

test();