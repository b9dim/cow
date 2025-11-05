import { redirect } from "next/navigation";
import slides from "../../content/slides.json";

export default function SlidesIndex() {
  redirect(`/slides/${slides[0].slug}`);
}


