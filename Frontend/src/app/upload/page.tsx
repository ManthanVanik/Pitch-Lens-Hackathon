'use client';

import FileUpload from '@/components/file-upload';
import Header from '@/components/header';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();

  const handleGenerate = () => {
    // This would ideally be a real navigation after a real analysis is created.
    // For now, it just navigates to the first mock startup.
    router.push('/startup/sia');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        <div className="w-full">
            <FileUpload onGenerate={handleGenerate} />
        </div>
      </main>
    </div>
  );
}
