import { ChevronDown } from "lucide-react";

interface ProcessStep {
  titleTr: string;
  titleEn: string;
  descTr?: string | null;
  descEn?: string | null;
  position: number;
}

interface FaqItem {
  questionTr: string;
  questionEn: string;
  answerTr: string;
  answerEn: string;
  position: number;
}

interface Inclusion {
  titleTr: string;
  titleEn?: string | null;
  type: string;
}

interface Props {
  locale: string;
  inclusions?: Inclusion[];
  processSteps?: ProcessStep[];
  faqItems?: FaqItem[];
  reassuranceText?: string | null;
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-border last:border-0">
      <summary className="flex items-center justify-between py-3 cursor-pointer text-sm font-medium text-foreground hover:text-primary transition-colors list-none">
        <span>{question}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <p className="pb-3 text-sm text-muted-foreground leading-relaxed">{answer}</p>
    </details>
  );
}

export function ApplyPageContext({ locale, inclusions = [], processSteps = [], faqItems = [], reassuranceText }: Props) {
  const isTr = locale === "tr";
  const hasAny = inclusions.length > 0 || processSteps.length > 0 || faqItems.length > 0 || reassuranceText;
  if (!hasAny) return null;

  return (
    <div className="space-y-8 text-sm">
      {inclusions.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {isTr ? "Programda Neler Var?" : "What's Included"}
          </h3>
          <ul className="space-y-2.5">
            {inclusions.map((inc, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground">
                <span className="mt-0.5 shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                  </svg>
                </span>
                <span className="leading-snug">{isTr ? inc.titleTr : (inc.titleEn || inc.titleTr)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {processSteps.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {isTr ? "Süreç Nasıl İşliyor?" : "What Happens Next?"}
          </h3>
          <ol className="space-y-4">
            {processSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px] font-bold text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-foreground leading-snug">
                    {isTr ? step.titleTr : (step.titleEn || step.titleTr)}
                  </p>
                  {(isTr ? step.descTr : (step.descEn || step.descTr)) && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {isTr ? step.descTr : (step.descEn || step.descTr)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {faqItems.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {isTr ? "Sık Sorulan Sorular" : "FAQ"}
          </h3>
          <div className="rounded-xl border border-border px-4">
            {faqItems.map((item, i) => (
              <FAQItem
                key={i}
                question={isTr ? item.questionTr : (item.questionEn || item.questionTr)}
                answer={isTr ? item.answerTr : (item.answerEn || item.answerTr)}
              />
            ))}
          </div>
        </section>
      )}

      {reassuranceText && (
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-4">
          {reassuranceText}
        </p>
      )}
    </div>
  );
}
