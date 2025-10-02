# Sign in with GLIN - Next.js Example

This example demonstrates how to integrate "Sign in with GLIN" authentication in a Next.js application, similar to "Sign in with Google" or "Sign in with GitHub".

## Use Case: v-lawyer App

This is modeled after a real-world scenario where v-lawyer (a legal services app) wants to add GLIN wallet authentication as a login option.

## How It Works

1. **User clicks "Sign in with GLIN"**
   - SDK detects GLIN browser extension
   - If not found, shows install link

2. **Extension popup opens**
   - User reviews sign-in message
   - User approves signature (no gas fees)

3. **App receives authentication**
   - Gets wallet address + signature
   - Sends to backend for verification

4. **Backend creates session**
   - Verifies signature on-chain
   - Creates user session with wallet address as ID

## Running the Example

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Integration Steps

### 1. Install SDK

```bash
npm install @glin-ai/sdk
# or
pnpm add @glin-ai/sdk
```

### 2. Frontend Integration

```typescript
import { GlinAuth } from '@glin-ai/sdk';

const auth = new GlinAuth();

// Authenticate user
const { address, signature, message } = await auth.authenticate('Your App Name');

// Send to backend
await fetch('/api/auth/glin', {
  method: 'POST',
  body: JSON.stringify({ address, signature, message })
});
```

### 3. Backend Verification

```typescript
import { GlinAuth } from '@glin-ai/sdk';

// In your API route
const { address, signature, message } = req.body;

const isValid = GlinAuth.verifySignature(address, message, signature);

if (isValid) {
  // Create session with address as user ID
  req.session.userId = address;
}
```

## File Structure

```
nextjs-auth/
├── app/
│   ├── page.tsx          # Home page with auth demo
│   └── layout.tsx        # Root layout
├── components/
│   └── GlinAuthButton.tsx # Reusable auth button
└── package.json
```

## Next Steps

- Add backend API route for session management
- Implement session persistence (JWT, cookies, etc.)
- Add user profile management
- Handle multi-account scenarios

## Notes

- Requires GLIN browser extension to be installed
- Works with Substrate/Polkadot signatures (sr25519)
- No blockchain transaction required for login
- Signature verification can be done server-side
