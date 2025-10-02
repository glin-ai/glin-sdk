import GlinAuthButton from '@/components/GlinAuthButton';

export default function Home() {
  return (
    <main style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>v-lawyer Demo App</h1>
      <p>Example integration of "Sign in with GLIN" authentication</p>

      <div style={{ marginTop: '2rem' }}>
        <GlinAuthButton />
      </div>

      <div style={{ marginTop: '3rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>How it works:</h2>
        <ol>
          <li>User clicks "Sign in with GLIN"</li>
          <li>SDK detects GLIN browser extension</li>
          <li>Extension popup asks user to sign message</li>
          <li>App receives signature and address</li>
          <li>Backend verifies signature and creates session</li>
        </ol>
      </div>
    </main>
  );
}
