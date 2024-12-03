import ReactMarkdown from "react-markdown";
import { Finding } from "../services/types";

export default function FindingItem({ finding }: { finding: Finding }) {
  return (
    <div key={finding.finding} className="mb-4">
      <div className="font-bold">Findings</div>
      <ReactMarkdown>{finding.finding}</ReactMarkdown>
      <div className="font-bold">Reasoning</div>
      <ReactMarkdown>{finding.reasoning}</ReactMarkdown>
    </div>
  );
}
