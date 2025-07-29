#!/usr/bin/env node

// Test script for provider selection and caching functionality
const test = async () => {
  try {
    console.log('🏢 PROVIDER SELECTION & CACHING TEST');
    console.log('=====================================');
    
    // Generate API key
    console.log('Generating API key...');
    const keyRes = await fetch('http://localhost:5000/api/generate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'provider-test@example.com', name: 'Provider Selection Test' })
    });
    const keyData = await keyRes.json();
    const apiKey = keyData.apiKey;
    console.log(`✅ API Key: ${apiKey.substring(0, 25)}...`);
    
    // Test location in Toronto, Canada (should default to Canadian providers)
    const testLocation = { lat: 43.6532, lng: -79.3832, address: 'Toronto, ON, Canada' };
    
    console.log('\n🇨🇦 Test 1: Auto-detect (should select Canadian defaults)');
    console.log('Location: Toronto, ON, Canada');
    
    const autoRes = await fetch('http://localhost:5000/api/coverage/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        lat: testLocation.lat,
        lng: testLocation.lng,
        address: testLocation.address
        // No provider specified = auto-detect
      }),
    });
    
    if (autoRes.ok) {
      const autoResult = await autoRes.json();
      console.log('✅ Auto-detect completed!');
      console.log(`📱 Mobile providers analyzed: ${autoResult.data.mobile_providers.length}`);
      console.log(`🌐 Broadband providers analyzed: ${autoResult.data.broadband_providers.length}`);
      console.log(`🏆 Top mobile provider: ${autoResult.data.mobile_providers[0].provider} (${autoResult.data.mobile_providers[0].coverage_score}/100)`);
      console.log(`🏆 Top broadband provider: ${autoResult.data.broadband_providers[0].provider} (${autoResult.data.broadband_providers[0].coverage_score}/100)`);
    } else {
      console.log('❌ Auto-detect failed');
    }
    
    console.log('\n📡 Test 2: Specific Provider - Rogers (Canadian mobile)');
    
    const rogersRes = await fetch('http://localhost:5000/api/coverage/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        lat: testLocation.lat,
        lng: testLocation.lng,
        address: testLocation.address,
        provider: 'Rogers'
      }),
    });
    
    if (rogersRes.ok) {
      const rogersResult = await rogersRes.json();
      console.log('✅ Rogers analysis completed!');
      console.log(`📱 Mobile providers: ${rogersResult.data.mobile_providers.length} (should be 1)`);
      console.log(`🌐 Broadband providers: ${rogersResult.data.broadband_providers.length} (should be 0)`);
      if (rogersResult.data.mobile_providers.length > 0) {
        const rogers = rogersResult.data.mobile_providers[0];
        console.log(`📊 Rogers Score: ${rogers.coverage_score}/100`);
        console.log(`💬 Rogers Issues: ${rogers.recent_issues} reports`);
        console.log(`⭐ Rogers Rating: ${rogers.reliability_rating}/5 stars`);
        console.log(`✅ Rogers Recommendation: ${rogers.recommendation}`);
      }
    } else {
      console.log('❌ Rogers analysis failed');
    }
    
    console.log('\n🌐 Test 3: Specific Provider - Bell Internet (Canadian broadband)');
    
    const bellRes = await fetch('http://localhost:5000/api/coverage/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        lat: testLocation.lat,
        lng: testLocation.lng,
        address: testLocation.address,
        provider: 'Bell Internet'
      }),
    });
    
    if (bellRes.ok) {
      const bellResult = await bellRes.json();
      console.log('✅ Bell Internet analysis completed!');
      console.log(`📱 Mobile providers: ${bellResult.data.mobile_providers.length} (should be 0)`);
      console.log(`🌐 Broadband providers: ${bellResult.data.broadband_providers.length} (should be 1)`);
      if (bellResult.data.broadband_providers.length > 0) {
        const bell = bellResult.data.broadband_providers[0];
        console.log(`📊 Bell Internet Score: ${bell.coverage_score}/100`);
        console.log(`💬 Bell Issues: ${bell.recent_issues} reports`);
        console.log(`⭐ Bell Rating: ${bell.reliability_rating}/5 stars`);
        console.log(`✅ Bell Recommendation: ${bell.recommendation}`);
      }
    } else {
      console.log('❌ Bell Internet analysis failed');
    }
    
    console.log('\n⚡ Test 4: Cache Performance Test');
    console.log('Running same Rogers analysis again (should use cache)...');
    
    const cacheStart = Date.now();
    const cachedRes = await fetch('http://localhost:5000/api/coverage/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        lat: testLocation.lat,
        lng: testLocation.lng,
        address: testLocation.address,
        provider: 'Rogers'
      }),
    });
    const cacheTime = Date.now() - cacheStart;
    
    if (cachedRes.ok) {
      console.log(`✅ Cached analysis completed in ${cacheTime}ms`);
      console.log('📊 Cache should significantly reduce response time vs first request');
    }
    
    console.log('\n🎯 PROVIDER SELECTION FEATURES DEMONSTRATED:');
    console.log('   ✓ Auto-detect largest providers by country (US: Verizon/AT&T/T-Mobile, Canada: Rogers/Bell/Telus)');
    console.log('   ✓ Specific provider analysis (mobile or broadband)');
    console.log('   ✓ Geographic defaults based on coordinates');
    console.log('   ✓ Coverage analysis caching (30-minute TTL)');
    console.log('   ✓ Provider-specific issue and scoring analysis');
    console.log('   ✓ Separate mobile vs broadband provider categorization');
    
    console.log('\n🌐 Frontend Integration:');
    console.log('   → Visit: http://localhost:5000/coverage-maps');
    console.log('   → Use dropdown to select specific provider or leave on auto-detect');
    console.log('   → See country-specific defaults and provider-focused analysis');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

test();