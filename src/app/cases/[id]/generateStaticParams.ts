// This is a server component file that exports the generateStaticParams function
// It's separated from the client component to avoid the build error

export async function generateStaticParams() {
  // This is a placeholder that will generate an empty array at build time
  // In a real app, you would fetch case IDs from your API
  return [{ id: '1' }, { id: '2' }]; // Placeholder IDs for build
}