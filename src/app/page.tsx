import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0f1c] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">年調チェック</h1>
        <p className="text-slate-400 mb-8">年末調整PDF解析アプリ</p>
        <Link
          href="/tax"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-colors"
        >
          アプリを開く
        </Link>
      </div>
    </main>
  );
}
