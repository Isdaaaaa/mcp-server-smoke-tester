import type { SmokeProbeResult } from '@/lib/probe/types';

export interface SmokeBadgePayload {
  label: string;
  message: string;
  color: string;
  altText: string;
  badgeUrl: string;
  markdownSnippet: string;
  htmlSnippet: string;
}

function encodeToken(value: string): string {
  return encodeURIComponent(value.trim()).replace(/%20/g, '_');
}

function getBadgeColor(result: SmokeProbeResult): string {
  if (result.summary.totalCount === 0) {
    return 'lightgrey';
  }

  if (result.summary.passCount === result.summary.totalCount) {
    return 'brightgreen';
  }

  if (result.summary.passCount === 0) {
    return 'red';
  }

  return 'yellow';
}

export function buildSmokeBadge(result: SmokeProbeResult): SmokeBadgePayload {
  const label = 'MCP smoke';
  const message = `${result.summary.passCount}/${result.summary.totalCount} pass`;
  const color = getBadgeColor(result);
  const altText = `MCP smoke status: ${message}`;

  const badgeUrl = `https://img.shields.io/static/v1?label=${encodeToken(label)}&message=${encodeToken(message)}&color=${encodeToken(color)}&style=flat-square`;

  return {
    label,
    message,
    color,
    altText,
    badgeUrl,
    markdownSnippet: `![${altText}](${badgeUrl})`,
    htmlSnippet: `<img src="${badgeUrl}" alt="${altText}" />`,
  };
}
