/**
 * Home Page - NodeSH Example Next.js App
 */
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🚀 NodeSH Example - Next.js</h1>
      <p>
        This is an example Next.js application demonstrating NodeSH integration.
      </p>

      <h2>Features</h2>
      <ul>
        <li>✅ MongoDB with Mongoose</li>
        <li>✅ Redis caching</li>
        <li>✅ REST API with App Router</li>
        <li>✅ TypeScript</li>
        <li>✅ NodeSH REPL integration</li>
      </ul>

      <h2>API Endpoints</h2>
      <ul>
        <li>
          <code>GET /api/users</code> - List all users
        </li>
        <li>
          <code>POST /api/users</code> - Create a user
        </li>
        <li>
          <code>GET /api/users/:id</code> - Get user by ID
        </li>
        <li>
          <code>PATCH /api/users/:id</code> - Update user
        </li>
        <li>
          <code>DELETE /api/users/:id</code> - Deactivate user
        </li>
        <li>
          <code>GET /api/stats</code> - Get app statistics
        </li>
      </ul>

      <h2>Quick Start</h2>
      <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
        {`# Start infrastructure (MongoDB, Redis)
npm run docker:up

# Install dependencies
npm install

# Start development server
npm run dev

# Launch NodeSH console
npm run console`}
      </pre>

      <h2>NodeSH Console Examples</h2>
      <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
        {`# Create a user
next> await UserService.create({
  email: 'john@example.com',
  password: 'password123',
  name: { first: 'John', last: 'Doe' }
})

# Find all users
next> await UserService.findAll()

# Get user stats
next> await UserService.getStats()

# Check database connection
next> await getDBStats()`}
      </pre>

      <p>
        <Link href="/api/users" style={{ color: 'blue' }}>
          Try API: GET /api/users →
        </Link>
      </p>
    </main>
  );
}
