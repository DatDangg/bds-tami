import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import en from "@/i18n/messages/en.json";
import vi from "@/i18n/messages/vi.json";
import type { MediaImage } from "./ResponsiveImage";

const messages = { vi, en };

export function renderWithIntl(ui: ReactElement, locale: "vi" | "en" = "vi") {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {ui}
    </NextIntlClientProvider>,
  );
}

/** Doc media giả với đủ cỡ đã sinh (ERD §4.12). */
export function fakeMedia(name: string, alt = `Ảnh ${name}`): MediaImage {
  return {
    url: `/api/media/file/${name}.jpg`,
    alt,
    width: 3000,
    sizes: {
      thumb: { url: `/api/media/file/${name}-400.webp`, width: 400 },
      card: { url: `/api/media/file/${name}-800.webp`, width: 800 },
      large: { url: `/api/media/file/${name}-1600.webp`, width: 1600 },
    },
  };
}
