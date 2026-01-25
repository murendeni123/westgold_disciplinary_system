# Platform Admin API Audit

## Frontend API Calls vs Backend Routes

### ✅ WORKING ENDPOINTS

| Frontend Call | Backend Route | Status |
|--------------|---------------|--------|
| `api.platformLogin()` | `POST /platform/login` | ✅ Working |
| `api.getPlatformSettings()` | `GET /platform/settings` | ✅ Working |
| `api.updatePlatformSettings()` | `PUT /platform/settings` | ✅ Working |
| `api.getPlatformPlans()` | `GET /platform/plans` | ✅ Working |
| `api.createPlatformPlan()` | `POST /platform/plans` | ✅ Working |
| `api.updatePlatformPlan()` | `PUT /platform/plans/:id` | ✅ Working |
| `api.getPlatformSchools()` | `GET /platform/schools` | ✅ Working |
| `api.getPlatformSchool()` | `GET /platform/schools/:id` | ✅ Working |
| `api.getPlatformSchoolStats()` | `GET /platform/schools/:id/stats` | ✅ Working |
| `api.getPlatformSchoolAnalytics()` | `GET /platform/schools/:id/analytics` | ✅ Working |
| `api.createPlatformSchool()` | `POST /platform/schools` | ✅ Working |
| `api.onboardSchool()` | `POST /platform/schools/onboard` | ✅ Working |
| `api.updatePlatformSchool()` | `PUT /platform/schools/:id` | ✅ Working |
| `api.deletePlatformSchool()` | `DELETE /platform/schools/:id` | ✅ Working |
| `api.bulkUpdateSchoolStatus()` | `PUT /platform/schools/bulk/status` | ✅ Working |
| `api.updateSchoolBranding()` | `PUT /platform/schools/:id/branding` | ✅ Working |
| `api.getSchoolBrandingHistory()` | `GET /platform/schools/:id/branding/history` | ✅ Working |
| `api.revertSchoolBranding()` | `POST /platform/schools/:id/branding/revert` | ✅ Working |
| `api.getPlatformAnalytics()` | `GET /platform/analytics` | ✅ Working |
| `api.getPlatformBilling()` | `GET /platform/billing` | ✅ Working |
| `api.getPlatformLogs()` | `GET /platform/logs` | ✅ Working |
| `api.getPlatformUsers()` | `GET /platform/users` | ✅ Working |
| `api.createPlatformUser()` | `POST /platform/users` | ✅ Working |
| `api.updatePlatformUser()` | `PUT /platform/users/:id` | ✅ Working |
| `api.deletePlatformUser()` | `DELETE /platform/users/:id` | ✅ Working |

### ❌ MISSING BACKEND ROUTES

| Frontend Call | Expected Route | Issue |
|--------------|----------------|-------|
| `api.deletePlatformPlan()` | `DELETE /platform/plans/:id` | ❌ Not implemented |
| `api.getAllFeatureFlags()` | `GET /platform/feature-flags` | ❌ Not implemented |
| `api.toggleFeatureFlag()` | `PUT /platform/feature-flags/:schoolId/:feature` | ❌ Not implemented |
| `api.bulkToggleFeatureFlag()` | `PUT /platform/feature-flags/bulk` | ❌ Not implemented |
| `api.getSchoolCustomizations()` | `GET /platform/schools/:id/customizations` | ❌ Not implemented |
| `api.uploadSchoolLogo()` | `POST /platform/schools/:id/logo` | ❌ Not implemented |
| `api.uploadSchoolFavicon()` | `POST /platform/schools/:id/favicon` | ❌ Not implemented |
| `api.uploadLoginBackground()` | `POST /platform/schools/:id/login-background` | ❌ Not implemented |
| `api.uploadDashboardBackground()` | `POST /platform/schools/:id/dashboard-background` | ❌ Not implemented |
| `api.deleteSchoolLogo()` | `DELETE /platform/schools/:id/logo` | ❌ Not implemented |
| `api.deleteSchoolFavicon()` | `DELETE /platform/schools/:id/favicon` | ❌ Not implemented |

### ⚠️ POTENTIAL ISSUES

1. **Feature Flags Management** - Entire feature not implemented in backend
2. **School Customizations** - File upload endpoints missing
3. **Plan Deletion** - Frontend has UI but backend route missing
4. **Refund Transaction** - Commented out in frontend, not implemented

## Required Actions

### High Priority
1. Implement feature flags backend routes
2. Implement school customization/branding file upload routes
3. Add plan deletion route

### Medium Priority
1. Implement refund transaction endpoint
2. Add validation for all platform routes
3. Add rate limiting for platform admin routes

### Low Priority
1. Add audit logging for all platform admin actions
2. Implement platform admin activity tracking
