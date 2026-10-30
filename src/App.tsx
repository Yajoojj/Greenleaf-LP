import { useLanguage } from './content/Language';
import { Header } from './components/Header';
import { useMotion } from './hooks/useMotion';
import { AppShowcase } from './sections/AppShowcase';
import { Architecture } from './sections/Architecture';
import { Contact } from './sections/Contact';
import { Explorer } from './sections/Explorer';
import { Faq } from './sections/Faq';
import { FinalCta } from './sections/FinalCta';
import { Flow } from './sections/Flow';
import { Footer } from './sections/Footer';
import { Goals } from './sections/Goals';
import { Hero } from './sections/Hero';
import { Numbers } from './sections/Numbers';
import { Pitch } from './sections/Pitch';
import { Problem } from './sections/Problem';
import { Team } from './sections/Team';
import { Vision } from './sections/Vision';

export default function App() {
  const { content: { ui } } = useLanguage();
  useMotion();
  return (
    <>
      <a className="skip-link" href="#conteudo">{ui.skip}</a>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Numbers />
        <Problem />
        <Explorer />
        <Flow />
        <Vision />
        <AppShowcase />
        <Architecture />
        <Goals />
        <Pitch />
        <Team />
        <Faq />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
