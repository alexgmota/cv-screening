import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">LeadTech CV Screening</h1>
        <p className="text-lg text-gray-600 mb-8">
          AI-powered tool to screen and search candidate CVs
        </p>
        <Link
          href="/chat"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Chatting
        </Link>
      </div>
    </main>
  );
}
