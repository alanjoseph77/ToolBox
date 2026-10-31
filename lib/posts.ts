export interface Post { slug: string; title: string; description: string; date: string; tool: string; body: { h?: string; p?: string; ul?: string[] }[] }

export const posts: Post[] = [
  {
    slug: "compress-image-to-50kb", date: "2026-10-31", tool: "compress-image",
    title: "How to compress a photo to 50 KB (or 100 KB) for online forms",
    description: "Exam and job portals often demand a photo under 50 KB or 100 KB. Here is how to hit the exact size without ruining the picture.",
    body: [
      { p: "Many government exam, job and scholarship portals reject a photo or signature unless it is under a set size, often 20 KB, 50 KB or 100 KB. Here is the quick way to get there without losing the picture." },
      { h: "Steps", ul: ["Open Compress Image and add your photo. It stays on your device.", "Pick the target size, such as 50 KB.", "Download the result and check that the face is still clear."] },
      { h: "If it is still too big", p: "Resize the photo first. A 4000 pixel wide phone photo is far larger than any form needs. Use Resize Image with the passport or exam preset, then compress. On ToolBox you can go straight from Resize Image to Compress Image without uploading the file again." },
      { h: "Tips", ul: ["Use JPG for photos. PNG files are larger.", "Crop out extra background before you compress.", "Read the portal's rules for the exact pixel size as well as the file size."] },
    ],
  },
  {
    slug: "mask-aadhaar-before-sharing", date: "2026-10-31", tool: "mask-aadhaar",
    title: "How to mask your Aadhaar before you share it",
    description: "Only share a masked Aadhaar when you can. Here is how to hide the first 8 digits on your own device without uploading the card anywhere.",
    body: [
      { p: "A masked Aadhaar shows only the last 4 digits of the number. When a business or institution accepts a masked copy, sharing that instead of the full card is the safer choice." },
      { h: "Steps", ul: ["Open Mask Aadhaar and add a photo, scan or PDF of the card.", "The tool reads the number on your device and covers the first 8 digits.", "If a number is missed, drag a box over it yourself.", "Check the result carefully, then download it."] },
      { h: "Good to know", ul: ["The card is never uploaded. The reading happens in your browser.", "Blurry or tilted photos are the most common reason a number is missed.", "Some places need the full number. Mask it only where a masked copy is accepted."] },
    ],
  },
  {
    slug: "passport-photo-size-online", date: "2026-10-31", tool: "passport-photo",
    title: "Passport photo size for online applications: pixels, KB and print sheets",
    description: "A quick guide to common passport photo sizes in pixels and millimetres, and how to make an online-ready photo and a printable sheet.",
    body: [
      { p: "Different applications ask for different sizes. A common Indian passport-style size is 35 × 45 mm, which is about 413 × 531 pixels at 300 dpi. Always check the exact size your form asks for." },
      { h: "Steps", ul: ["Open Passport Photo and add a clear, front-facing picture with a plain background.", "Choose the size that matches your form.", "Download the single photo for online forms, or the print sheet to get several copies on one page."] },
      { h: "Tips", ul: ["Use even light and keep your face straight on to the camera.", "Many portals also set a file size limit. Compress the photo afterwards if needed.", "Use Background Remover first if the background is not plain."] },
    ],
  },
];

export const postBySlug = (s: string) => posts.find((p) => p.slug === s);
