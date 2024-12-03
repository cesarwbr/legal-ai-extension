import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import ReactMarkdown from "react-markdown";
import { LightbulbIcon } from "lucide-react";
import { getPageContent, getPageUrl } from "./services/page-content";
import HtmlToMarkdownConverter from "./services/markdown-converter";
import { Chunker } from "./services/chunker";
import { AnalyzerAI } from "./services/analyzer-ai";
import { RISK_LEVELS } from "./services/types";
import { Finding } from "./services/types";
import { Categories } from "./components/categories";
import { Player } from "@lottiefiles/react-lottie-player";

export default function App() {
  const [findingsSortedByRiskLevel, setFindingsSortedByRiskLevel] = useState<
    Finding[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceName, setServiceName] = useState("");
  const [downloadingModel, setDownloadingModel] = useState(false);
  const [downloadingModelProgress, setDownloadingModelProgress] = useState(0);
  const [conclusion, setConclusion] = useState<{
    priority: string;
    conclusion: string;
    action: string;
  } | null>(null);
  const [pageFavicon, setPageFavicon] = useState("");

  useEffect(() => {
    getPageUrl().then((url) => {
      const urlDomain = new URL(url).hostname;

      setPageFavicon(`https://icons.duckduckgo.com/ip3/${urlDomain}.ico`);
    });
  }, []);

  // Sort findings by risk level, first HIGH, then MEDIUM, then LOW
  const sortFindingsByRiskLevel = (findings: Finding[]) => {
    return findings.sort((a, b) => {
      return (
        Object.values(RISK_LEVELS).indexOf(b.riskLevel) -
        Object.values(RISK_LEVELS).indexOf(a.riskLevel)
      );
    });
  };

  const initDefaults = useCallback(async () => {
    if (!("aiOriginTrial" in chrome)) {
      setError("Error: chrome.aiOriginTrial not supported in this browser");
      return "not-supported";
    }

    // @ts-ignore
    const defaults = await chrome.aiOriginTrial.languageModel.capabilities();
    console.log("Model default:", defaults);

    if (defaults.available === "no") {
      setError("Error: chrome.aiOriginTrial not supported in this browser");
      return "not-supported";
    }

    if (defaults.available === "after-download") {
      return "downloading";
    }

    return "ready";
  }, []);

  const downloadModelProgress = useCallback(() => {
    return new Promise((resolve) => {
      // @ts-ignore
      ai.languageModel.create({
        monitor(m: {
          addEventListener: (event: string, callback: (e: any) => void) => void;
        }) {
          m.addEventListener(
            "downloadprogress",
            (e: { loaded: number; total: number }) => {
              console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
              setDownloadingModelProgress(e.loaded / e.total);
              if (e.loaded === e.total) {
                resolve(true);
              }
            }
          );
        },
      });
    });
  }, []);

  const analyzePage = useCallback(async () => {
    setLoading(true);
    getPageContent().then(async (content) => {
      const markdown = HtmlToMarkdownConverter(content);
      const chunks = Chunker.chunk(markdown);
      const result = await AnalyzerAI.analyze(chunks);

      setFindingsSortedByRiskLevel(
        sortFindingsByRiskLevel(result.analyses.allFindings)
      );
      setConclusion(result.conclusion);
      setServiceName(result.serviceName || "");
      setLoading(false);
    });
  }, [initDefaults]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const isModelReady = await initDefaults();
      if (isModelReady === "not-supported") {
        setError("Error: chrome.aiOriginTrial not supported in this browser");
        return;
      }

      if (isModelReady === "downloading") {
        await downloadModelProgress();
      }

      analyzePage();
    }
    init();
  }, [analyzePage]);

  const animationUrl = useMemo(() => {
    const animationPoll = [
      "https://lottie.host/1f5629f4-6960-4a8c-ae2c-0908e6b560e9/zRdPnQ6Vxe.json",
      "https://assets1.lottiefiles.com/packages/lf20_3vbOcw.json",
      "https://lottie.host/18324c11-7139-46d7-bcf2-67cc0790316f/rSJhtHtkKv.json",
      "https://lottie.host/fe024d55-bd8a-45de-a4fd-110df5c24584/QMLNO8MtNq.json",
    ];
    return animationPoll[Math.floor(Math.random() * animationPoll.length)];
  }, [loading]);

  return (
    <div className="p-4">
      {error && <div className="text-red-500">{error}</div>}

      {downloadingModelProgress > 0 && (
        <div className="flex flex-col justify-center items-center h-full gap-4">
          <span className="text-sm text-slate-500 max-w-[300px] text-center font-bold">
            Downloading model...
            <span className="text-slate-400">
              {downloadingModelProgress.toFixed(2)}%
            </span>
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center h-full gap-4">
          {/* @ts-ignore */}
          <Player
            autoplay
            loop
            src={animationUrl}
            style={{ height: "300px", width: "300px" }}
          />
          <span className="text-sm text-slate-500 max-w-[300px] text-center font-bold">
            I'm analyzing this website's privacy policy and generating a
            report...
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <img src={pageFavicon} alt="Page favicon" className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold">{serviceName}</h1>
              <span className="text-sm text-slate-500">
                Privacy Policy analysis generated by Legal AI
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-4">
            <ReactMarkdown>{conclusion?.conclusion}</ReactMarkdown>
          </p>
          {conclusion?.action && (
            <div className="mt-4 bg-slate-100 p-4 rounded-md">
              <div className="flex items-center gap-2 font-bold text-base mb-2 text-slate-800">
                <LightbulbIcon className="w-6 h-6" />
                Suggested Actions
              </div>
              <p className="text-sm text-slate-600 mb-4">
                <ReactMarkdown>{conclusion?.action}</ReactMarkdown>
              </p>
            </div>
          )}
          <hr className="my-4" />
          <div id="content" className="mt-4">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Analysis</h2>
            <Categories findings={findingsSortedByRiskLevel} />
          </div>
          <div className="mt-4 bg-slate-100 p-2 rounded-md">
            <span className="text-sm text-slate-500">
              <span className="font-bold">Disclaimer:</span> This is not legal
              advice. This is a tool to help you understand your privacy policy.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
