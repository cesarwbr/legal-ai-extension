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
  title: string;
  finding: string;
  risk_level: RiskLevel;
  why_risky: string;
  category: string;
};

export type Finding = {
  title: string;
  finding: string;
  riskExplanation: string;
  riskLevel: RiskLevel;
  category: string;
};

export const RISK_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
