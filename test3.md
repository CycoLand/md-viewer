 Excellent question! Let me create a comprehensive manual testing checklist. The integration tests focus on **API endpoints**, but there are several **browser-based and end-to-end flows** that need manual verification:

## 🧪 Manual Testing Checklist for Staging

### 1. **SSL Certificate Verification** ✅
```bash
# Test HTTPS is working
curl -I https://auth.cycodev.dev/health

# Check certificate details
curl -vI https://auth.cycodev.dev/health 2>&1 | grep -i "subject\|issuer\|expire"
```

**In Browser:**
- [ ] Visit `https://auth.cycodev.dev` - No SSL warnings
- [ ] Click padlock icon - Certificate is from "Let's Encrypt"
- [ ] Certificate is valid for `auth.cycodev.dev`
- [ ] Certificate expiration is ~90 days from now

### 2. **Web UI Pages** (Integration tests don't cover HTML/JavaScript)

**Registration Flow:**
- [ ] `https://auth.cycodev.dev/register.html` - Page loads
- [ ] Fill out form: email, password, confirm password
- [ ] Submit form - Should redirect to success page
- [ ] `https://auth.cycodev.dev/register-success.html` - Shows confirmation

**Login Flow:**
- [ ] `https://auth.cycodev.dev/login.html` - Page loads
- [ ] Enter email/password from registration
- [ ] Submit - Should redirect to dashboard
- [ ] `https://auth.cycodev.dev/dashboard.html` - Shows user info

**Device Flow:**
- [ ] `https://auth.cycodev.dev/verify.html` - Page loads
- [ ] CLI: `cd src/Cycodum.Console && dotnet run device-login --api-url https://auth.cycodev.dev`
- [ ] Enter device code in browser
- [ ] Should show success message
- [ ] CLI should receive tokens

### 3. **GitHub OAuth Flow** 🔥 (CRITICAL - New Callback URL!)

**Before testing:** Update GitHub OAuth App callback URL:
```
Go to: https://github.com/organizations/CycoAi/settings/applications
Click: Staging OAuth App
Update Authorization callback URL: https://auth.cycodev.dev/signin-github
Save
```

**Then test:**
- [ ] Visit `https://auth.cycodev.dev/login.html`
- [ ] Click "Login with GitHub" button
- [ ] Redirects to GitHub authorization page
- [ ] Click "Authorize" (or already authorized)
- [ ] Redirects back to `https://auth.cycodev.dev/github-complete.html`
- [ ] Shows success message with user info
- [ ] Can access dashboard

**CLI GitHub Login:**
- [ ] `dotnet run login --github --api-url https://auth.cycodev.dev`
- [ ] Opens browser to GitHub
- [ ] Authorize
- [ ] CLI receives tokens
- [ ] `dotnet run whoami --api-url https://auth.cycodev.dev` - Shows GitHub user

### 4. **Domain and Redirect Behavior**

- [ ] Test old Azure URL still works (or redirects):
  ```bash
  curl -I https://identity-service.blackglacier-53bfbb77.westus2.azurecontainerapps.io/health
  ```
- [ ] Test HTTP → HTTPS redirect (if configured):
  ```bash
  curl -I http://auth.cycodev.dev/health
  ```

### 5. **CLI Commands Against Staging** (Beyond Integration Tests)

```bash
cd src/Cycodum.Console

# Test full workflow
dotnet run register --email staging-test@example.com --password Test123!@# --api-url https://auth.cycodev.dev
dotnet run login --email staging-test@example.com --password Test123!@# --api-url https://auth.cycodev.dev
dotnet run whoami --api-url https://auth.cycodev.dev
dotnet run status --api-url https://auth.cycodev.dev
dotnet run logout --api-url https://auth.cycodev.dev

# Test device flow
dotnet run device-login --api-url https://auth.cycodev.dev
# (Complete in browser)
dotnet run whoami --api-url https://auth.cycodev.dev

# Test profile management
dotnet run tokens list --api-url https://auth.cycodev.dev
dotnet run tokens switch staging-test@example.com --api-url https://auth.cycodev.dev
```

### 6. **Error Handling**

- [ ] Visit `https://auth.cycodev.dev/nonexistent` - Should show 404
- [ ] Login with wrong password - Should show error message
- [ ] Register with existing email - Should show error
- [ ] Visit dashboard without logging in - Should redirect or show error

### 7. **Cross-Browser Testing** (If time permits)

Test in at least 2 browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## 🎯 Priority Order

**Must Test (P0):**
1. ✅ SSL Certificate working
2. 🔥 GitHub OAuth with new callback URL (most likely to break)
3. Web UI login/register flows
4. Device flow end-to-end

**Should Test (P1):**
5. CLI commands against staging
6. Dashboard displays correct user info
7. Error pages

**Nice to Test (P2):**
8. Cross-browser compatibility
9. HTTP → HTTPS redirect
10. Old Azure URL behavior

---

## 🚨 Most Important: GitHub OAuth Callback

**Before any browser testing, update the GitHub OAuth App:**

1. Go to: https://github.com/organizations/CycoAi/settings/applications
2. Find your **Staging** OAuth App
3. Update:
   - **Homepage URL**: `https://auth.cycodev.dev`
   - **Authorization callback URL**: `https://auth.cycodev.dev/signin-github`
4. Save changes

**Then test the GitHub login flow - this is the most likely thing to break with a domain change!**

---

Would you like me to create a simple test script that automates some of these checks, or are you good to test manually?