export const BACKGROUNDS = [
  "Anime-Girl-Night-Sky.jpg",
  "Anime-Girl5.png",
  "Balcony-ja.png",
  "Bonsai-Plant.png",
  "Celestial-Samurai.jpg",
  "City-Night.png",
  "City-Rain.png",
  "Concept-Japanese house.png",
  "Dark-Anime-Girl-Wallpaper.png",
  "Dark_Nature.png",
  "Dreamscape-Wanderer.jpg",
  "Dreamy-Aesthetic-Home-Under-Moonlight.png",
  "Fantasy - Sunset.png",
  "Fantasy-Hongkong.png",
  "Nightfall-by-the-Lake.jpg",
  "Nix Silk 02.png",
  "Nix Silk 06.png",
  "Nix Silk 10.png"
].map(filename => ({
  id: filename,
  name: filename.replace(/\.(png|jpg|jpeg)$/i, "").replace(/[-_]/g, " "),
  type: 'image',
  paths: {
    thumb: `/backgrounds/thumbs/${filename}`,
    mobile: `/backgrounds/mobile/${filename}`,
    desktop: `/backgrounds/desktop/${filename}`,
    xl: `/backgrounds/xl/${filename}`,
    original: `/backgrounds/original/${filename}`
  }
}));
