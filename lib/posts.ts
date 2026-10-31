export interface Post { slug: string; title: string; metaTitle: string; description: string; date: string; tool: string; body: { h?: string; p?: string; ul?: string[] }[] }

export const posts: Post[] = [
  {
    slug: "compress-image-to-50kb", metaTitle: "Compress Photo to 50 KB for Forms", date: "2026-10-31", tool: "compress-image",
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
    slug: "mask-aadhaar-before-sharing", metaTitle: "How to Mask Aadhaar Before Sharing", date: "2026-10-31", tool: "mask-aadhaar",
    title: "How to mask your Aadhaar before you share it",
    description: "Only share a masked Aadhaar when you can. Here is how to hide the first 8 digits on your own device without uploading the card anywhere.",
    body: [
      { p: "A masked Aadhaar shows only the last 4 digits of the number. When a business or institution accepts a masked copy, sharing that instead of the full card is the safer choice." },
      { h: "Steps", ul: ["Open Mask Aadhaar and add a photo, scan or PDF of the card.", "The tool reads the number on your device and covers the first 8 digits.", "If a number is missed, drag a box over it yourself.", "Check the result carefully, then download it."] },
      { h: "Good to know", ul: ["The card is never uploaded. The reading happens in your browser.", "Blurry or tilted photos are the most common reason a number is missed.", "Some places need the full number. Mask it only where a masked copy is accepted."] },
    ],
  },
  {
    slug: "passport-photo-size-online", metaTitle: "Passport Photo Size for Online Forms", date: "2026-10-31", tool: "passport-photo",
    title: "Passport photo size for online applications: pixels, KB and print sheets",
    description: "A quick guide to common passport photo sizes in pixels and millimetres, and how to make an online-ready photo and a printable sheet.",
    body: [
      { p: "Different applications ask for different sizes. A common Indian passport-style size is 35 × 45 mm, which is about 413 × 531 pixels at 300 dpi. Always check the exact size your form asks for." },
      { h: "Steps", ul: ["Open Passport Photo and add a clear, front-facing picture with a plain background.", "Choose the size that matches your form.", "Download the single photo for online forms, or the print sheet to get several copies on one page."] },
      { h: "Tips", ul: ["Use even light and keep your face straight on to the camera.", "Many portals also set a file size limit. Compress the photo afterwards if needed.", "Use Background Remover first if the background is not plain."] },
    ],
  },
  {
    slug: "convert-heic-to-jpg", metaTitle: "Convert HEIC to JPG for Free", date: "2026-11-01", tool: "heic-to-jpg",
    title: "How to convert HEIC photos to JPG (iPhone photos that will not open)",
    description: "iPhone photos saved as HEIC often will not upload or open on other devices. Here is how to turn them into JPG for free, on your own device.",
    body: [
      { p: "Newer iPhones save photos as HEIC to save space. Many websites, older Windows computers and some phones cannot open them, and form portals often reject them. Converting to JPG fixes that." },
      { h: "Steps", ul: ["Open HEIC to JPG and add one or many HEIC photos.", "Choose JPG (smaller files) or PNG (no quality loss), and the quality.", "Download each file, or all of them as one ZIP."] },
      { h: "Stop it happening again", p: "On an iPhone, open Settings, then Camera, then Formats, and choose Most Compatible. New photos will be saved as JPG." },
      { h: "Good to know", ul: ["The conversion happens in your browser, so your photos are not uploaded.", "Edits from the Photos app are saved into the converted picture.", "Live Photos become a single still image."] },
    ],
  },
  {
    slug: "remove-location-from-photos", metaTitle: "Remove Location Data from Photos", date: "2026-11-01", tool: "remove-photo-details",
    title: "How to remove location and other hidden data from your photos",
    description: "Photos can carry the place and time they were taken. Learn what EXIF data is and how to remove it before you share a picture.",
    body: [
      { p: "Most phone photos store hidden details called EXIF data: the GPS location where the picture was taken, the date and time, and the phone model. If you share the original file, that information can go with it." },
      { h: "Steps", ul: ["Open Remove Photo Details and add your photos.", "See what each photo contains, including any saved location.", "Download the clean copies, or all of them as one ZIP."] },
      { h: "Good to know", ul: ["Many social networks strip this data when you post, but sending a photo as a file, by email or in a listing often keeps it.", "You can also switch off location for the camera in your phone settings.", "Check a clean copy by running it through the tool again. It should show nothing."] },
    ],
  },
  {
    slug: "make-upi-qr-code", metaTitle: "How to Make a UPI QR Code", date: "2026-11-01", tool: "upi-qr-generator",
    title: "How to make a UPI QR code for your shop or payments",
    description: "Create a UPI payment QR with your UPI ID, name and an optional amount, then print it as a card for your counter.",
    body: [
      { p: "A UPI QR lets people pay you by scanning with any UPI app. You can make one with just your UPI ID, with no sign-up." },
      { h: "Steps", ul: ["Open UPI QR Code Generator and enter your UPI ID, for example name@bank.", "Add your name, and an amount and note if you want them filled in for the payer.", "Download the QR, or the printable card for your shop counter."] },
      { h: "Tips", ul: ["Leave the amount empty if customers pay different amounts.", "Scan your own QR with another phone and check that your name shows up before printing.", "Keep the printed card clean and flat so that it scans easily."] },
    ],
  },
  {
    slug: "emi-calculation-formula", metaTitle: "EMI Calculation Formula with Example", date: "2026-11-01", tool: "emi-calculator",
    title: "EMI calculation formula explained, with an example",
    description: "How a loan EMI is calculated, what each part of the formula means, and a worked example you can check with the EMI calculator.",
    body: [
      { p: "EMI stands for equated monthly instalment: the fixed amount you pay each month on a loan. Banks use this formula:" },
      { p: "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1)" },
      { h: "What the letters mean", ul: ["P is the loan amount.", "r is the monthly interest rate, which is the yearly rate divided by 12 and by 100.", "n is the number of monthly payments."] },
      { h: "Example", p: "For a loan of ₹10,00,000 at 8.5% a year for 20 years, r is 0.00708333 and n is 240. The EMI comes to about ₹8,678 a month. Try the same numbers in the EMI Calculator to see the total interest and the month-by-month split." },
      { h: "Tip", p: "A shorter tenure raises the EMI but lowers the total interest. Compare a few tenures before you decide." },
    ],
  },
  {
    slug: "blur-faces-and-number-plates", metaTitle: "Blur Faces and Number Plates in Photos", date: "2026-11-01", tool: "blur-face",
    title: "How to blur faces and number plates in a photo",
    description: "Hide faces, licence plates and private details in a picture before sharing it. A quick guide with blur and pixelate.",
    body: [
      { p: "Before you post a photo of a street, a crowd or a car for sale, you may want to hide faces and number plates." },
      { h: "Steps", ul: ["Open Blur Face and add your photo.", "Drag over each face or plate. In some browsers, Find faces marks faces for you.", "Choose Blur or Pixelate and the strength, then check the preview.", "Download the blurred picture."] },
      { h: "Tips", ul: ["Pixelate hides detail more strongly than blur. Use a high strength on small plates.", "Blurred areas are changed in the saved file, so the detail cannot be brought back from it.", "Keep your original photo in a safe place in case you need it."] },
    ],
  },
];

export const postBySlug = (s: string) => posts.find((p) => p.slug === s);
