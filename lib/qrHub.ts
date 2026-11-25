// The "QR codes" section: QR tools live in different categories (Share, Utility…), this groups them in one place.
export const QR_SLUGS = ["qr-code-generator", "picture-qr-code", "door-hanger-maker", "qr-studio", "product-qr", "upi-qr-generator", "wifi-qr-generator", "whatsapp-link-generator", "contact-qr-generator", "barcode-generator"];

/** "Which one do I need?" in plain words. */
export const QR_GUIDE: [string, string, string][] = [
  ["A link, text, Wi-Fi, WhatsApp, call, SMS, email or map", "QR Code Generator", "qr-code-generator"],
  ["A QR code made from your photo or artwork", "Picture QR Code", "picture-qr-code"],
  ["A printable hanger or card with your offer and a QR code", "Door Hanger Maker", "door-hanger-maker"],
  ["A restaurant menu, coupon, event, business card or feedback form you can change later", "QR Code Studio", "qr-studio"],
  ["A product with photo, price and a WhatsApp order button", "Shop Product QR", "product-qr"],
  ["Getting paid by UPI (GPay, PhonePe, Paytm)", "UPI QR Generator", "upi-qr-generator"],
  ["Letting guests join your Wi-Fi", "WiFi QR Code Generator", "wifi-qr-generator"],
  ["A barcode for products or stock", "Barcode Generator", "barcode-generator"],
];
