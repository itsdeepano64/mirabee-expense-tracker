import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mirabee Expenses",
    short_name: "Mirabee",
    description: "Expense tracking for Mirabee Flowers",
    start_url: "/",
    display: "standalone",
    background_color: "#FDF8F3",
    theme_color: "#6BA8BA",
    icons: [
      {
        src: "/mirabee-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}