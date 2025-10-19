# Google OAuth Setup Guide

This project has been configured to use Google authentication instead of GitHub. Follow these steps to set up Google OAuth:

## 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

## 2. Configure OAuth Consent Screen

1. In the Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required fields:
   - App name: Your app name
   - User support email: Your email
   - Developer contact information: Your email
4. Add your domain to authorized domains if needed
5. Save and continue through the scopes and test users sections

## 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://yourdomain.com/api/auth/callback/google`
5. Copy the Client ID and Client Secret

## 4. Environment Variables

1. Copy `.dev.vars.example` to `.dev.vars`
2. Fill in your Google OAuth credentials:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id-here
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   ```
3. Generate a secure secret for Better Auth:
   ```
   BETTER_AUTH_SECRET=your-secure-random-string-here
   ```

## 5. Production Deployment

For production deployment with Cloudflare Workers:

1. Set the secrets using Wrangler CLI:
   ```bash
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put BETTER_AUTH_SECRET
   ```

2. Update your production domain in the Google OAuth configuration

## 6. Testing

1. Start the development server: `pnpm dev`
2. Navigate to `/login`
3. Click "Continue with Google"
4. Complete the OAuth flow

## Troubleshooting

- Make sure your redirect URIs match exactly (including trailing slashes)
- Check that the OAuth consent screen is properly configured
- Verify that the Google+ API is enabled
- Ensure your domain is added to authorized domains if using a custom domain
