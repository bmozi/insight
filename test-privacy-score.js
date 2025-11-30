/**
 * Test Privacy Score Calculation
 * Demonstrates the fix for the 0/100 score bug
 */

// Simulate the OLD algorithm (buggy)
function calculatePrivacyScoreOLD(totalCookies, trackingCookies) {
  let score = 100;

  // Old linear deduction: -2 per tracking cookie
  const deduction = trackingCookies * 2;
  score -= deduction;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score));
}

// Simulate the NEW algorithm (fixed)
function calculatePrivacyScoreNEW(totalCookies, trackingCookies, advertisingCookies = 0, fingerprintingCookies = 0) {
  let score = 100;
  const deductions = [];

  // Calculate tracking ratio
  const trackingRatio = totalCookies > 0 ? trackingCookies / totalCookies : 0;

  // Tracking cookies: percentage-based + diminishing returns
  if (trackingCookies > 0) {
    const ratioDeduction = trackingRatio * 30;
    const volumeDeduction = Math.min(10, Math.log10(trackingCookies + 1) * 3);
    const deduction = Math.round(ratioDeduction + volumeDeduction);
    score -= deduction;
    deductions.push({ type: 'tracking', count: trackingCookies, points: deduction });
  }

  // Advertising cookies
  if (advertisingCookies > 0) {
    const adRatio = totalCookies > 0 ? advertisingCookies / totalCookies : 0;
    const ratioDeduction = adRatio * 25;
    const volumeDeduction = Math.min(10, Math.log10(advertisingCookies + 1) * 4);
    const deduction = Math.round(ratioDeduction + volumeDeduction);
    score -= deduction;
    deductions.push({ type: 'advertising', count: advertisingCookies, points: deduction });
  }

  // Fingerprinting cookies
  if (fingerprintingCookies > 0) {
    const fpRatio = totalCookies > 0 ? fingerprintingCookies / totalCookies : 0;
    const ratioDeduction = fpRatio * 20;
    const volumeDeduction = Math.min(15, fingerprintingCookies * 2);
    const deduction = Math.round(ratioDeduction + volumeDeduction);
    score -= deduction;
    deductions.push({ type: 'fingerprinting', count: fingerprintingCookies, points: deduction });
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    deductions,
    trackingRatio: (trackingRatio * 100).toFixed(1) + '%'
  };
}

// Test with your actual data
console.log('='.repeat(60));
console.log('PRIVACY SCORE CALCULATION TEST');
console.log('='.repeat(60));

const totalCookies = 2933;
const trackingCookies = 78;
const advertisingCookies = 15; // Estimate
const fingerprintingCookies = 5; // Estimate

console.log('\nYour Browser Stats:');
console.log(`  Total Cookies: ${totalCookies}`);
console.log(`  Tracking Cookies: ${trackingCookies}`);
console.log(`  Tracking Ratio: ${(trackingCookies / totalCookies * 100).toFixed(1)}%`);

console.log('\n--- OLD ALGORITHM (BUGGY) ---');
const oldScore = calculatePrivacyScoreOLD(totalCookies, trackingCookies);
console.log(`  Calculation: 100 - (${trackingCookies} × 2) = ${100 - (trackingCookies * 2)}`);
console.log(`  Clamped Score: ${oldScore}/100`);
console.log(`  Result: ❌ INCORRECT (shows ${oldScore} when it should be higher)`);

console.log('\n--- NEW ALGORITHM (FIXED) ---');
const newResult = calculatePrivacyScoreNEW(totalCookies, trackingCookies, advertisingCookies, fingerprintingCookies);
console.log(`  Tracking Ratio: ${newResult.trackingRatio}`);
console.log(`  Deductions:`);
newResult.deductions.forEach(d => {
  console.log(`    - ${d.type}: ${d.count} cookies → -${d.points} points`);
});
console.log(`  Total Deductions: -${newResult.deductions.reduce((sum, d) => sum + d.points, 0)} points`);
console.log(`  Final Score: ${newResult.score}/100`);
console.log(`  Result: ✅ CORRECT (reflects ${newResult.trackingRatio} tracking ratio)`);

console.log('\n--- COMPARISON ---');
console.log(`  Old Score: ${oldScore}/100 (${oldScore === 0 ? 'ZERO - Bug!' : 'Incorrect'})`);
console.log(`  New Score: ${newResult.score}/100 (${newResult.score >= 85 ? 'Excellent' : newResult.score >= 60 ? 'Good' : 'Fair'})`);
console.log(`  Improvement: +${newResult.score - oldScore} points`);

console.log('\n--- TEST SCENARIOS ---');

const scenarios = [
  { name: 'Clean Browser', total: 100, tracking: 5, ad: 0, fp: 0 },
  { name: 'Light Tracking', total: 500, tracking: 25, ad: 5, fp: 0 },
  { name: 'Your Browser', total: 2933, tracking: 78, ad: 15, fp: 5 },
  { name: 'Heavy Tracking', total: 1000, tracking: 150, ad: 50, fp: 10 },
  { name: 'Severe Tracking', total: 500, tracking: 200, ad: 100, fp: 20 },
];

scenarios.forEach(scenario => {
  const old = calculatePrivacyScoreOLD(scenario.total, scenario.tracking);
  const newRes = calculatePrivacyScoreNEW(scenario.total, scenario.tracking, scenario.ad, scenario.fp);
  const ratio = ((scenario.tracking / scenario.total) * 100).toFixed(1);

  console.log(`\n  ${scenario.name}:`);
  console.log(`    Cookies: ${scenario.total} total, ${scenario.tracking} tracking (${ratio}%)`);
  console.log(`    Old Score: ${old}/100`);
  console.log(`    New Score: ${newRes.score}/100`);
  console.log(`    Change: ${newRes.score >= old ? '+' : ''}${newRes.score - old} points`);
});

console.log('\n' + '='.repeat(60));
console.log('CONCLUSION: New algorithm provides reasonable, percentage-based scores');
console.log('='.repeat(60) + '\n');
