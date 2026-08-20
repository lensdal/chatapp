// Turn a free-text address into map links for both major platforms.
export function mapsLinks(address: string): { google: string; apple: string } {
  const q = encodeURIComponent(address.trim())
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    apple: `https://maps.apple.com/?q=${q}`,
  }
}
