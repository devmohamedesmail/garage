// This is a server component file that exports the generateStaticParams function
// It's separated from the client component to avoid the build error

export async function generateStaticParams() {
  // This is a placeholder that will generate an empty params at build time
  return [{ id: '1' }, { id: '2' }]; // Placeholder IDs for build
}