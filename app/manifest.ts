import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mirabee Expenses",
    short_name: "Mirabee",
    description: "Expense tracking for Mirabee Flowers",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf8f6",
    theme_color: "#e8a0b4",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}