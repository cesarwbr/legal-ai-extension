import { Token } from "marked";

export type Section = {
  title: string;
  level: number;
  content: string;
  tokens: Token[];
};

export type Chunk = {
  title: string;
  content: string;
  sections: Section[];
};

export type LLMFinding = {
  finding: string;
  risk_level: RiskLevel;
  reasoning: string;
  category: string;
  confidence: Confidence;
};

export type Finding = {
  finding: string;
  reasoning: string;
  riskLevel: RiskLevel;
  category: string;
  confidence: Confidence;
};

export type InformationGatheringFinding = {
  category: string;
  findings: string;
};

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export const CONFIDENCE = ["COMPLETE", "PARTIAL"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type Confidence = (typeof CONFIDENCE)[number];
