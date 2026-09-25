import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { BurgerExperience } from "@/components/home/BurgerExperience";
import { Story } from "@/components/home/Story";
import { CtaBand } from "@/components/home/CtaBand";

export default function Home() {
  return (
    <>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <BurgerExperience />
      <Story />
      <CtaBand />
    </>
  );
}
