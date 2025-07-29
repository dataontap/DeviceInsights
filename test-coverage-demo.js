#!/usr/bin/env node

// Simple demo script for coverage analysis
const test = async () => {
  try {
    console.log('🗺️ COVERAGE ANALYSIS DEMO');
    console.log('==========================');
    
    // Generate API key
    console.log('Generating API key...');
    const keyRes = await fetch('http://localhost:5000/api/generate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', name: 'Coverage Demo' })
    });
    const keyData = await keyRes.json();
    const apiKey = keyData.apiKey;
    console.log(`✅ API Key: ${apiKey.substring(0, 25)}...`);
    
    // Test coverage analysis for New York City
    console.log('\n🏙️ Analyzing coverage for New York City...');
    const coverageRes = await fetch('http://localhost:5000/api/coverage/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ 
        lat: 40.7128, 
        lng: -74.0060,
        address: 'New York City, NY'
      })
    });
    
    if (coverageRes.ok) {
      const coverageData = await coverageRes.json();
      console.log('✅ Coverage analysis completed!');
      console.log(`📊 Analyzed ${coverageData.data.providers.length} providers`);
      
      console.log('\n🏆 TOP PROVIDERS:');
      coverageData.data.providers.slice(0, 3).forEach((provider, i) => {
        console.log(`${i + 1}. ${provider.provider}`);
        console.log(`   📊 Score: ${provider.coverage_score}/100`);
        console.log(`   ⭐ Rating: ${provider.reliability_rating}/5 stars`);
        console.log(`   💡 Status: ${provider.recommendation.toUpperCase()}`);
        console.log(`   📱 Issues: ${provider.recent_issues} in last 30 days`);
      });
      
      console.log('\n🌐 Frontend demo available at:');
      console.log('   http://localhost:5000/coverage-maps');
      
    } else {
      console.log('❌ Coverage analysis failed');
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
};

test();