import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mirabee Expenses",
    short_name: "Mirabee",
    description: "Expense tracking for Mirabee Flowers",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF5EC",
    theme_color: "#4AACC4",
    icons: [
      {
        src: "/mirabee-flowers-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}