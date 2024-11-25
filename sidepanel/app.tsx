import { useEffect, useState } from "preact/hooks";
import { getPageContent } from "./services/page-content";
import HtmlToMarkdownConverter from "./services/markdown-converter";
import { Chunker } from "./services/chunker";
import { AnalyzerAI } from "./services/analyzer-ai";

export default function App() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPageContent().then(async (content) => {
      console.log("content", content);
      const markdown = HtmlToMarkdownConverter(content);
      console.log("markdown", markdown);
      const chunks = Chunker.chunk(markdown);
      console.log("chunks", chunks);
      const analyses = await AnalyzerAI.analyze(chunks);
      console.log("analyses", analyses);
      const flattenedAnalyses = Object.keys(
        analyses.findings_by_category
      ).flatMap((category) => analyses.findings_by_category[category]);
      console.log("flattenedAnalyses", flattenedAnalyses);
      setContent(JSON.stringify(flattenedAnalyses, null, 2));
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1>Page Content</h1>
      {loading ? <div>Loading...</div> : <div id="content">{content}</div>}
    </div>
  );
}
