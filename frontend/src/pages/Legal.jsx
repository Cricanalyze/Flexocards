const PRIVACY = [
  ["What we collect", "Without an account: nothing personal. We count anonymous events (which sport and template was used, and when a card was downloaded) to improve the product. With an account: your email address, name, saved card text details, a private preview image of each saved card, plan, payment and invoice records."],
  ["Your photos", "Photos are processed in your browser to render your card. The original photo you upload is not stored on our servers. When you save a card, a preview image of the finished card is stored privately in your account so you can see it on your dashboard; only you can view it, and it is never made public unless you create a share link. If you choose AI photo art (paid plans), that photo is sent securely to our AI image provider only to create the artwork and is not stored by FlexoCards."],
  ["We don't read your content", "We do not review, read or edit the photos, names, stats or other content you put on your cards. Your content is processed automatically to create the card, and you alone are responsible for it."],
  ["Minors", "If you are under 18, use FlexoCards with a parent or guardian's permission. Do not upload photos of other minors without their guardian's consent."],
  ["Other people's photos", "Only use photos you own or have permission to use. Do not use official team logos, league marks or copyrighted game artwork."],
  ["Sign-in", "You sign in with a one-time 6-digit code sent to your email, or with your Google account. We never ask for, see or store a password. One-time codes expire after 10 minutes and are stored only in a scrambled (hashed) form. When you use Google, we receive only your name, email address and whether that email is verified. Your signed-in session is kept in a secure, browser-only cookie for up to 30 days, and you can sign out at any time."],
  ["Emails", "We email you sign-in codes, a welcome message, receipts and invoices for every payment, and important account notices. Emails are sent from noreply@cricanalyze.in."],
  ["Payments", "Payments are handled by Razorpay, a certified payment gateway. We never see or store your card, UPI or bank details. We keep the payment ID, amount, items bought and the billing details you enter, to issue your invoice."],
  ["Deleting your data", "From your dashboard you can delete your saved cards and close your FlexoCards profile at any time. Payment and invoice records are kept as required by law. Contact support for full removal."],
  ["Security", "Admin actions are permission-checked on our server and recorded in an audit log. Saved card previews are private to your account."],
];

const TERMS = [
  ["Using FlexoCards", "You may create cards for personal, team and non-commercial promotional use. You are fully responsible for everything you add to a card: photos, names, logos, stats and text."],
  ["Your content & copyright", "FlexoCards does not read, review or check the content users upload. You confirm that you own, or have permission to use, every photo, name, logo and artwork you add. FlexoCards is not responsible for any copyright, trademark, privacy or image-rights issue arising from content added by users; any such claim is the sole responsibility of the user who added the content. We may remove content or suspend accounts when we receive a valid complaint."],
  ["Self-reported information", "Stats, ratings, rankings and achievements on cards are entered by users and are not verified by FlexoCards."],
  ["Intellectual property", "FlexoCards templates are original artwork. You may share cards you create. Do not resell templates or remove the watermark from free exports."],
  ["Prohibited content", "No hateful, sexual, violent or impersonating content, and no content that infringes others' rights. We may suspend accounts that break these rules."],
  ["Plans & payments", "Prices are shown on the Pricing page and in the store at the time of purchase. Every payment, including small purchases such as extra cards or watermark passes, comes with an invoice by email and in your dashboard."],
  ["No cancellation, no refund", "All purchases are final. Once a payment is completed, no cancellation or refund will be given, for any plan, card pack, watermark pass, storybook or other digital item. Please check your order before paying. If you were charged but did not receive what you bought, contact support with your payment ID and we will make sure it is delivered."],
  ["Changes", "We may update these terms. Material changes will be announced on the website."],
];

export default function Legal({ kind }) {
  const items = kind === "privacy" ? PRIVACY : TERMS;
  return (
    <div className="container-x py-12 max-w-3xl" data-testid={`legal-${kind}-page`}>
      <p className="eyebrow">Legal</p>
      <h1 className="font-display font-black uppercase text-4xl sm:text-5xl">{kind === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</h1>
      <p className="text-sm text-muted-foreground mt-2">FlexoCards is operated by Buddy Innovations and Technologies Private Limited. Plain-language summary — have this reviewed by a lawyer before a commercial launch.</p>
      <div className="mt-10 space-y-8">
        {items.map(([t, d]) => <section key={t} data-testid={`legal-section-${t.toLowerCase().replace(/[^a-z]+/g, "-")}`}><h2 className="font-display font-bold uppercase text-xl">{t}</h2><p className="text-muted-foreground mt-2">{d}</p></section>)}
      </div>
    </div>
  );
}
