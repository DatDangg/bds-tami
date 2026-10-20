import { Fragment } from "react";
import type { HomeBlockView, HomeView } from "@/lib/home/home-view";
import { AboutBlock } from "./AboutBlock";
import { CtaBanner } from "./CtaBanner";
import { FeaturedOffers } from "./FeaturedOffers";
import { FeaturedProjects } from "./FeaturedProjects";
import { HeroSearch } from "./HeroSearch";
import { HeroSlider } from "./HeroSlider";
import { HomeNews } from "./HomeNews";
import { HomeRentals } from "./HomeRentals";
import { ServicesBento } from "./ServicesBento";
import { StrengthsBlock } from "./StrengthsBlock";

function renderBlock(block: HomeBlockView) {
  switch (block.kind) {
    case "strengths":
      return <StrengthsBlock block={block} />;
    case "about":
      return <AboutBlock block={block} />;
    case "featuredProjects":
      return <FeaturedProjects title={block.title} slides={block.slides} />;
    case "services":
      return <ServicesBento title={block.title} items={block.items} />;
    case "featuredOffers":
      return <FeaturedOffers title={block.title} cards={block.cards} />;
    case "ctaBanner":
      return <CtaBanner block={block} />;
    case "rentals":
      return <HomeRentals title={block.title} tabs={block.tabs} />;
    case "news":
      return <HomeNews block={block} />;
  }
}

/**
 * Thân trang chủ: hero rồi các khối theo thứ tự của view model (đã lọc bật/tắt/EN ở `buildHomeView`). Trang luôn có đúng một `h1`,
 * ẩn (`sr-only`) mang tiêu đề slide 1 (cả hai dòng: `title` + `titleAccent`, BL-044) theo ngôn ngữ, không có thì tên site (design-spec S01), và nằm NGOÀI carousel:
 * nếu nằm trong slide 1 thì `aria-hidden`/`inert` của slide giấu nó khỏi trình đọc màn hình khi slide khác hiện.
 */
export function HomeBlocks({ view, siteName }: { view: HomeView; siteName: string }) {
  const first = view.hero[0];
  const heading = [first?.title, first?.titleAccent].filter(Boolean).join(" ");
  return (
    <>
      <h1 className="sr-only">{heading || siteName}</h1>
      {view.hero.length > 0 && (
        <HeroSlider slides={view.hero} eyebrow={view.heroEyebrow} caption={view.heroCaption} overlapsSearch={view.heroSearch !== null} />
      )}
      {view.hero.length > 0 && view.heroSearch && <HeroSearch {...view.heroSearch} />}
      {view.blocks.map((block) => (
        <Fragment key={block.kind}>{renderBlock(block)}</Fragment>
      ))}
    </>
  );
}
