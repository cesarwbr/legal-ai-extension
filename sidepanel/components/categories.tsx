import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { Finding } from "@/services/types";
import {
  AlertCircle,
  AlertTriangle,
  CircleCheck,
  Eye,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export function Categories({ findings }: { findings: Finding[] }) {
  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      defaultValue={`item-${findings[0].category}`}
    >
      {findings.map((finding) => (
        <AccordionItem
          key={finding.category}
          value={`item-${finding.category}`}
          className={cn(
            "bg-red-100 px-4 rounded rounded-tl mt-2.5 border-transparent text-base",
            finding.riskLevel === "HIGH" && "bg-red-100",
            finding.riskLevel === "MEDIUM" && "bg-yellow-100",
            finding.riskLevel === "LOW" && "bg-green-100"
          )}
        >
          <AccordionTrigger
            className={cn(
              "decoration-red-800",
              finding.riskLevel === "HIGH" && "text-red-800",
              finding.riskLevel === "MEDIUM" && "text-yellow-800",
              finding.riskLevel === "LOW" && "text-green-800"
            )}
          >
            <div className="flex items-center gap-3 justify-between w-full mr-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex w-5 h-5">
                  {finding.riskLevel === "HIGH" ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : finding.riskLevel === "MEDIUM" ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CircleCheck className="w-5 h-5" />
                  )}
                </span>
                <span className="text-sm font-medium capitalize">
                  {finding.category.replace(/_/g, " ")}
                </span>
              </div>
              <div
                className={cn(
                  "rounded text-white px-1.5 text-xs",
                  finding.riskLevel === "HIGH" && "bg-red-800",
                  finding.riskLevel === "MEDIUM" && "bg-yellow-800",
                  finding.riskLevel === "LOW" && "bg-green-800"
                )}
              >
                {finding.riskLevel}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="mb-4">
              <h3 className="text-base mb-2 font-bold text-slate-800">
                <Sparkles className="w-4 h-4 inline-block mr-1" /> AI Reasoning
              </h3>
              <div className="text-sm text-slate-600 [&>ul]:list-disc [&>ul]:ml-5">
                <ReactMarkdown>{finding.reasoning}</ReactMarkdown>
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-base mb-2 font-bold text-slate-800">
                <Eye className="w-4 h-4 inline-block mr-1" /> Findings
              </h3>
              <div className="text-sm text-slate-600 [&>ul]:list-disc [&>ul]:ml-5">
                <ReactMarkdown>{finding.finding}</ReactMarkdown>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
