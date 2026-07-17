import Link from 'next/link';
import { Fredoka, Nunito } from 'next/font/google';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'] });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '500', '700', '800'] });

export default function NotFound() {
  return (
    <div 
      className={`w-full h-screen flex justify-center items-center flex-col bg-center bg-no-repeat relative overflow-hidden bg-white ${nunito.className}`}
      style={{ backgroundImage: 'url(/404-error.gif)' }}
    >
      <p className={`absolute top-12 text-[7rem] md:text-[9rem] font-black text-black/10 tracking-widest ${fredoka.className} drop-shadow-md`}>
        404
      </p>
      
      <h2 className={`absolute bottom-32 text-[30px] md:text-[34px] font-black text-black text-center px-4 ${fredoka.className}`}>
        Parece que te has perdido
      </h2>
      
      <h5 className="absolute bottom-24 text-[#9c9c9c] text-base md:text-lg text-center px-4 font-bold">
        la página que estás buscando no está disponible
      </h5>
      
      <Link 
        href="/"
        className="absolute bottom-6 md:bottom-10 bg-gradient-to-tr from-[#ff0034] to-[#ffbc00] px-8 py-3 text-white text-[20px] md:text-[23px] rounded-2xl font-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:scale-105 hover:translate-y-[-2px] transition-all"
      >
        Ir al Inicio
      </Link>
    </div>
  );
}
