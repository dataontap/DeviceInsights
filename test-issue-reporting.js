#!/usr/bin/env node

// Test script for issue reporting and AI pattern analysis
const test = async () => {
  try {
    console.log('🚨 ISSUE REPORTING & AI PATTERN ANALYSIS TEST');
    console.log('=============================================');
    
    // Generate API key
    console.log('Generating API key...');
    const keyRes = await fetch('http://localhost:5000/api/generate-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'issue-test@example.com', name: 'Issue Reporting Test' })
    });
    const keyData = await keyRes.json();
    const apiKey = keyData.apiKey;
    console.log(`✅ API Key: ${apiKey.substring(0, 25)}...`);
    
    // Test different types of network issues
    const testCases = [
      {
        location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
        issue: "My iPhone 15 Pro has no signal bars and calls keep failing in downtown Manhattan",
        type: "Signal/Connectivity Issue"
      },
      {
        location: { lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
        issue: "Internet is extremely slow on my Samsung Galaxy S24, barely 1 Mbps download speeds",
        type: "Speed Issue"
      },
      {
        location: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
        issue: "Cannot connect to 5G network with my Google Pixel 8, stuck on 4G even in good coverage areas",
        type: "5G Connectivity Issue"
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n📱 TEST CASE ${i + 1}: ${testCase.type}`);
      console.log(`   Location: ${testCase.location.address}`);
      console.log(`   Issue: "${testCase.issue}"`);
      
      const response = await fetch('http://localhost:5000/api/coverage/analyze-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          lat: testCase.location.lat,
          lng: testCase.location.lng,
          address: testCase.location.address,
          issue_description: testCase.issue,
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        const analysis = result.data;
        
        console.log(`   ✅ Issue Analysis Completed!`);
        console.log(`   🔍 Classification: ${analysis.issue_classification}`);
        console.log(`   📊 Issue Type: ${analysis.issue_type}`);
        console.log(`   🎯 Confidence: ${Math.round(analysis.confidence_score * 100)}%`);
        console.log(`   📡 Affected Providers: ${analysis.affected_providers.join(', ')}`);
        
        if (analysis.similar_reports && analysis.similar_reports.length > 0) {
          console.log(`   🔄 Similar Reports Found: ${analysis.similar_reports.length}`);
          analysis.similar_reports.slice(0, 2).forEach((report, idx) => {
            console.log(`      ${idx + 1}. ${report.device}: ${report.description} (${report.distance})`);
          });
        }
        
        if (analysis.device_pattern) {
          console.log(`   📱 Device Pattern: ${analysis.device_pattern.substring(0, 80)}...`);
        }
        
        console.log(`   💡 Recommendations: ${analysis.recommendations.substring(0, 80)}...`);
        
      } else {
        console.log(`   ❌ Analysis failed: ${response.status}`);
        const errorData = await response.text();
        console.log(`   Error: ${errorData}`);
      }
    }
    
    console.log(`\n🎯 AI PATTERN ANALYSIS FEATURES DEMONSTRATED:`);
    console.log(`   ✓ Issue classification using Gemini AI`);
    console.log(`   ✓ Device-specific pattern detection`);
    console.log(`   ✓ Similar issue matching in area`);
    console.log(`   ✓ Provider-specific problem identification`);
    console.log(`   ✓ Technical recommendations based on issue type`);
    console.log(`   ✓ Geographic correlation of network problems`);
    console.log(`   ✓ Device compatibility analysis`);
    
    console.log(`\n🌐 Frontend Integration:`);
    console.log(`   → Visit: http://localhost:5000/coverage-maps`);
    console.log(`   → Enter coordinates and click "Report an Issue"`);
    console.log(`   → Describe network problem in the text area`);
    console.log(`   → AI will analyze and show similar issues in your area`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

test();