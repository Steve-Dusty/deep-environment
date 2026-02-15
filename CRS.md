- **Use Cases**: KYC compliance, identity verification, fraud prevention
#### **FraudFinder (AtData)**
- **Endpoint**: `POST /fraud-finder/{config}`
- **Purpose**: Email/phone fraud risk analysis
- **Response**: Risk score (0-10), email validation, phone verification, IP analysis
- **Use Cases**: Signup fraud detection, transaction risk scoring
---
## 💡 Common Use Cases
### 1. **Tenant Screening Platform**
**Products**: Criminal + Eviction + Any Credit Bureau
Build a comprehensive tenant screening tool that combines:
- Criminal background checks
- Eviction history
- Credit reports
**How AI Helps:**
```
You: "Help me build a tenant screening API that pulls criminal, eviction, and Equifax reports"
Claude:
  1. Uses get_api_schema to understand all three APIs
  2. Uses get_test_data to get test personas
  3. Writes the integration code for you
  4. Creates a combined risk scoring algorithm
  5. Generates PDF reports
```
---
### 2. **Lending Pre-Qualification Engine**
**Products**: Experian + TransUnion + Equifax
Build a multi-bureau credit comparison system:
- Pull reports from all three bureaus
- Compare credit scores side-by-side
- Analyze tradeline differences
- Generate pre-qualification letters
**How AI Helps:**
```
You: "Create a function that pulls credit reports from all three bureaus and compares scores"
Claude:
  1. Uses get_api_schema for all three bureaus
  2. Shows you the CRS Standard Format (same for all)
  3. Writes parallel API calls
  4. Creates comparison logic
  5. Handles errors gracefully
```
---
### 3. **Identity Verification Flow**
**Products**: FlexID + FraudFinder
Build a secure user onboarding pipeline:
- Verify identity through FlexID
- Check fraud signals via FraudFinder
- Score based on combined risk factors
**How AI Helps:**
```
You: "Build an identity verification system with fraud detection"
Claude:
  1. Uses get_api_schema for FlexID and FraudFinder
  2. Designs verification flow
  3. Implements CVI score thresholds
  4. Adds fraud risk scoring
  5. Creates approval/denial logic