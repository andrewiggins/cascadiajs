export async function get({ path }) {
  return {
    json: {
      path,
      sharing: {
        sharingTitle: "CascadiaJS QR Code Generator",
        sharingDescription: "Generate CascadiaJS-branded QR codes.",
        sharingImage: "/_public/images/2026/social/social-sharing-general.png",
      },
    },
  };
}
