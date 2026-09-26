import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface Props {
  locale: string;
  productSlug: string;
  productName: string;
}

export function ConfirmationState({ locale, productSlug }: Props) {
  return (
    <div className="flex flex-col items-center text-center py-10 space-y-5">
      <div className="rounded-full bg-success/10 p-4">
        <CheckCircle className="h-10 w-10 text-success" />
      </div>
      <div>
        <h2 className="text-xl font-black text-foreground">
          {locale === "tr" ? "Başvurunuz Alındı" : "Application Received"}
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          {locale === "tr"
            ? "Başvurunuzu inceleyeceğiz. Sonucu hesabınızdan takip edebilirsiniz."
            : "We'll review your application. You can track the status in your account."}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Link
          href={`/${locale}/dashboard/applications`}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white text-center hover:opacity-90 transition-opacity"
        >
          {locale === "tr" ? "Başvurularım" : "My Applications"}
        </Link>
        <Link
          href={`/${locale}/products/${productSlug}`}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground text-center hover:bg-muted/30 transition-colors"
        >
          {locale === "tr" ? "Programa Dön" : "Back to Program"}
        </Link>
      </div>
    </div>
  );
}
