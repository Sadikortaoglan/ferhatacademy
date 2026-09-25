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

export interface ContextData {
  programName: string;
  programDescription?: string | null;
  programVisualUrl?: string | null;
  motivationText?: string | null;
  processSteps?: ProcessStep[];
  faqItems?: FaqItem[];
  inclusions?: Inclusion[];
  reassuranceText?: string | null;
}

interface Props {
  data: ContextData;
  locale: string;
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

export function ApplicationContextPanel({ data, locale }: Props) {
  const isTr = locale === "tr";
  const hasContent =
    data.programVisualUrl ||
    data.motivationText ||
    (data.inclusions && data.inclusions.length > 0) ||
    (data.processSteps && data.processSteps.length > 0) ||
    (data.faqItems && data.faqItems.length > 0) ||
    data.reassuranceText;

  if (!hasContent) return null;

  return (
    <div className="space-y-8">
      {data.programVisualUrl && (
        <div className="rounded-xl overflow-hidden aspect-video bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.programVisualUrl}
            alt={data.programName}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {data.motivationText && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-foreground leading-relaxed">{data.motivationText}</p>
        </div>
      )}

      {data.inclusions && data.inclusions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            {isTr ? "Program İçeriği" : "What's Included"}
          </h3>
          <ul className="space-y-2">
            {data.inclusions.map((inc, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-0.5 h-4 w-4 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  ✓
                </span>
                <span>{isTr ? inc.titleTr : (inc.titleEn || inc.titleTr)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.processSteps && data.processSteps.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            {isTr ? "Başvurudan Sonra Ne Olacak?" : "What Happens Next?"}
          </h3>
          <ol className="space-y-3">
            {data.processSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isTr ? step.titleTr : (step.titleEn || step.titleTr)}
                  </p>
                  {(isTr ? step.descTr : (step.descEn || step.descTr)) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isTr ? step.descTr : (step.descEn || step.descTr)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {data.faqItems && data.faqItems.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">
            {isTr ? "Sık Sorulan Sorular" : "FAQ"}
          </h3>
          <div className="rounded-xl border border-border overflow-hidden px-4">
            {data.faqItems.map((item, i) => (
              <FAQItem
                key={i}
                question={isTr ? item.questionTr : (item.questionEn || item.questionTr)}
                answer={isTr ? item.answerTr : (item.answerEn || item.answerTr)}
              />
            ))}
          </div>
        </div>
      )}

      {data.reassuranceText && (
        <p className="text-xs text-muted-foreground leading-relaxed text-center px-2 border-t border-border pt-5">
          {data.reassuranceText}
        </p>
      )}
    </div>
  );
}
