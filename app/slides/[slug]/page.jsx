import slides from "../../../content/slides.json";
import SlideRenderer from "../../../components/SlideRenderer";

export function generateStaticParams() {
  return slides.map((s) => ({ slug: s.slug }));
}

export default function SlidePage({ params }) {
  const index = slides.findIndex((s) => s.slug === params.slug);
  const slide = slides[index] || slides[0];
  return (
    <main className="relative min-h-screen">
      <SlideRenderer slide={slide} />
    </main>
  );
}


