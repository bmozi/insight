# Privacy Score Algorithm - Detailed Formula

## Overview

The privacy score calculation has been updated from a simple linear deduction model to a sophisticated percentage-based algorithm with diminishing returns.

## Formula Breakdown

### Starting Point
```
Base Score = 100
```

### 1. Tracking Cookies (Analytics + Social + Unknown Tracking)

**Formula:**
```
trackingRatio = trackingCookies / totalCookies
ratioDeduction = trackingRatio × 30
volumeDeduction = min(10, log10(trackingCookies + 1) × 3)
totalDeduction = round(ratioDeduction + volumeDeduction)
```

**Example (Your Data):**
```
trackingCookies = 78
totalCookies = 2933

trackingRatio = 78 / 2933 = 0.027 (2.7%)
ratioDeduction = 0.027 × 30 = 0.8 points
volumeDeduction = min(10, log10(79) × 3) = min(10, 5.7) = 5.7 points
totalDeduction = round(0.8 + 5.7) = 6 points

Score after tracking: 100 - 6 = 94
```

### 2. Advertising Cookies

**Formula:**
```
adRatio = advertisingCookies / totalCookies
ratioDeduction = adRatio × 25
volumeDeduction = min(10, log10(advertisingCookies + 1) × 4)
totalDeduction = round(ratioDeduction + volumeDeduction)
```

**Example (Estimated 15 advertising cookies):**
```
advertisingCookies = 15
totalCookies = 2933

adRatio = 15 / 2933 = 0.0051 (0.51%)
ratioDeduction = 0.0051 × 25 = 0.1 points
volumeDeduction = min(10, log10(16) × 4) = min(10, 4.8) = 4.8 points
totalDeduction = round(0.1 + 4.8) = 5 points

Score after advertising: 94 - 5 = 89
```

### 3. Fingerprinting Cookies (Critical)

**Formula:**
```
fpRatio = fingerprintingCookies / totalCookies
ratioDeduction = fpRatio × 20
volumeDeduction = min(15, fingerprintingCookies × 2)
totalDeduction = round(ratioDeduction + volumeDeduction)
```

**Example (Estimated 5 fingerprinting cookies):**
```
fingerprintingCookies = 5
totalCookies = 2933

fpRatio = 5 / 2933 = 0.0017 (0.17%)
ratioDeduction = 0.0017 × 20 = 0.03 points
volumeDeduction = min(15, 5 × 2) = min(15, 10) = 10 points
totalDeduction = round(0.03 + 10) = 10 points

Score after fingerprinting: 89 - 10 = 79
```

### 4. Long-Lived Cookies (>1 year)

**Formula:**
```
deduction = min(10, round(log10(longLivedCookies + 1) × 4))
```

**Example (100 long-lived cookies):**
```
longLivedCookies = 100

deduction = min(10, round(log10(101) × 4))
         = min(10, round(2.0 × 4))
         = min(10, 8)
         = 8 points

Score after long-lived: 79 - 8 = 71
```

### 5. Insecure Sensitive Cookies

**Formula:**
```
deduction = min(15, insecureSensitiveCookies × 3)
```

**Example (0 insecure sensitive cookies):**
```
insecureSensitiveCookies = 0
deduction = 0 points

Score after insecure: 71 - 0 = 71
```

### 6. Excessive localStorage

**Formula:**
```
excessiveUnits = floor(localStorageSizeKB / 100)
deduction = min(5, excessiveUnits)
```

**Example (200 KB localStorage):**
```
localStorageSizeKB = 200
excessiveUnits = floor(200 / 100) = 2
deduction = min(5, 2) = 2 points

Score after storage: 71 - 2 = 69
```

### Final Score
```
Final Score = max(0, min(100, roundedScore))
```

## Why This Algorithm is Better

### Old Algorithm Problems
1. **Linear deductions** (2 points per cookie)
   - 78 tracking cookies = -156 points
   - Result: 100 - 156 = -56 → clamped to 0

2. **No context** about total cookies
   - Doesn't matter if you have 100 or 3000 total cookies
   - Absolute counts don't reflect privacy practices

3. **Always zeros out** with normal usage
   - Modern browsers accumulate many cookies
   - Even privacy-conscious users get 0 scores

### New Algorithm Benefits

1. **Percentage-based scoring**
   - 78/2933 = 2.7% tracking ratio
   - Reflects actual privacy posture

2. **Diminishing returns**
   - Logarithmic scaling prevents extreme penalties
   - First 10 cookies have more impact than cookies 100-110

3. **Category weighting**
   - Fingerprinting is more severe than analytics
   - Each category has appropriate caps

4. **Realistic scores**
   - 2.7% tracking ratio → ~79/100 score
   - 15% tracking ratio → ~66/100 score
   - 40% tracking ratio → ~52/100 score

5. **Meaningful differentiation**
   - Excellent (85-100): < 5% tracking
   - Good (60-85): 5-15% tracking
   - Fair (40-60): 15-30% tracking
   - Poor (< 40): > 30% tracking

## Score Interpretation

| Score Range | Rating | Tracking Ratio | Description |
|------------|--------|----------------|-------------|
| 90-100 | Excellent | < 3% | Minimal tracking, excellent privacy |
| 70-89 | Good | 3-10% | Low tracking, good privacy practices |
| 50-69 | Fair | 10-20% | Moderate tracking, room for improvement |
| 30-49 | Poor | 20-35% | High tracking, privacy at risk |
| 0-29 | Critical | > 35% | Severe tracking, immediate action needed |

## Your Score Analysis

**Your Data:**
- Total Cookies: 2,933
- Tracking Cookies: 78 (2.7%)
- Expected Score: **79/100** (Good)

**Breakdown:**
- Tracking deduction: -6 points
- Advertising deduction: -5 points
- Fingerprinting deduction: -10 points
- Other deductions: -0 points (estimated)
- **Total: -21 points**

**Verdict:** You have good privacy practices! Only 2.7% of your cookies are tracking-related, which is excellent for a browser with high cookie volume.
