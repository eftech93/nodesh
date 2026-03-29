/**
 * Root Layout
 */
export const metadata = {
  title: 'NodeSH Example - Next.js',
  description: 'Next.js example for NodeSH interactive shell',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
