import { getImage } from "astro:assets";

export function getProductCardImage(src: string) {
  return getImage({
    src,
    width: 500,
    height: 500,
    fit: "cover",
  });
}
