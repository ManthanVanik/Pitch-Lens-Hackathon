import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import Pitch from '../app/Pitch.png'
import Image from "next/image";

export default function Header() {
  return (
    <header className="py-4 px-4 md:px-6 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          {/* <div className="bg-primary p-2 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-primary-foreground" />
          </div> */}
          <Image src={Pitch} alt="Pitch Logo" width={100} height={100} />
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-foreground">
            Pitch Lens
          </h1>
        </Link>
      </div>
    </header>
  );
}
