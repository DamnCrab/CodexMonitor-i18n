import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  AccountSnapshot,
  LocalUsageDay,
  LocalUsageSnapshot,
  RateLimitSnapshot,
} from "../../../types";
import { getUsageLabels } from "../../app/utils/usageLabels";

type LatestAgentRun = {
  message: string;
  timestamp: number;
  projectName: string;
  groupName?: string | null;
  workspaceId: string;
  threadId: string;
  isProcessing: boolean;
};

type UsageMetric = "tokens" | "time";

type UsageWorkspaceOption = {
  id: string;
  label: string;
};

type HomeStatCard = {
  label: string;
  value: string;
  suffix?: string | null;
  caption: string;
  compact?: boolean;
};

type HomeProps = {
  onAddWorkspace: () => void;
  onAddWorkspaceFromUrl: () => void;
  latestAgentRuns: LatestAgentRun[];
  isLoadingLatestAgents: boolean;
  localUsageSnapshot: LocalUsageSnapshot | null;
  isLoadingLocalUsage: boolean;
  localUsageError: string | null;
  onRefreshLocalUsage: () => void;
  usageMetric: UsageMetric;
  onUsageMetricChange: (metric: UsageMetric) => void;
  usageWorkspaceId: string | null;
  usageWorkspaceOptions: UsageWorkspaceOption[];
  onUsageWorkspaceChange: (workspaceId: string | null) => void;
  accountRateLimits: RateLimitSnapshot | null;
  usageShowRemaining: boolean;
  accountInfo: AccountSnapshot | null;
  onSelectThread: (workspaceId: string, threadId: string) => void;
};

function formatCompactNumber(value: number | null | undefined, locale?: string) {
  if (value === null || value === undefined) {
    return "--";
  }
  if (value >= 1_000_000_000) {
    const scaled = value / 1_000_000_000;
    return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}b`;
  }
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}m`;
  }
  if (value >= 1_000) {
    const scaled = value / 1_000;
    return `${scaled.toFixed(scaled >= 10 ? 0 : 1)}k`;
  }
  return new Intl.NumberFormat(locale).format(value);
}

function formatCount(value: number | null | undefined, locale?: string) {
  if (value === null || value === undefined) {
    return "--";
  }
  return new Intl.NumberFormat(locale).format(value);
}

function formatDuration(valueMs: number | null | undefined) {
  if (valueMs === null || valueMs === undefined) {
    return "--";
  }
  const totalSeconds = Math.max(0, Math.round(valueMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m`;
  }
  return `${totalSeconds}s`;
}

function formatDurationCompact(valueMs: number | null | undefined) {
  if (valueMs === null || valueMs === undefined) {
    return "--";
  }
  const totalMinutes = Math.max(0, Math.round(valueMs / 60000));
  if (totalMinutes >= 60) {
    const hours = totalMinutes / 60;
    return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
  }
  if (totalMinutes > 0) {
    return `${totalMinutes}m`;
  }
  const seconds = Math.max(0, Math.round(valueMs / 1000));
  return `${seconds}s`;
}

function formatDayLabel(value: string | null | undefined, locale?: string) {
  if (!value) {
    return "--";
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatRelativeTimeLabel(timestamp: number, locale?: string) {
  const now = Date.now();
  const diffSeconds = Math.round((timestamp - now) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const ranges: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 60 * 60 * 24 * 365 },
    { unit: "month", seconds: 60 * 60 * 24 * 30 },
    { unit: "week", seconds: 60 * 60 * 24 * 7 },
    { unit: "day", seconds: 60 * 60 * 24 },
    { unit: "hour", seconds: 60 * 60 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
    style: "short",
  });
  if (absSeconds < 5) {
    return formatter.format(0, "second");
  }
  const range =
    ranges.find((entry) => absSeconds >= entry.seconds) ||
    ranges[ranges.length - 1];
  const value = Math.round(diffSeconds / range.seconds);
  return formatter.format(value, range.unit);
}

function formatWeekRange(
  days: LocalUsageDay[],
  locale: string | undefined,
  formatRange: (start: string, end: string) => string,
  emptyLabel: string,
) {
  if (days.length === 0) {
    return emptyLabel;
  }
  const first = days[0];
  const last = days[days.length - 1];
  const firstLabel = formatDayLabel(first?.day, locale);
  const lastLabel = formatDayLabel(last?.day, locale);
  return first?.day === last?.day ? firstLabel : formatRange(firstLabel, lastLabel);
}

function isUsageDayActive(day: LocalUsageDay) {
  return day.totalTokens > 0 || day.agentTimeMs > 0 || day.agentRuns > 0;
}

function formatPlanType(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatWindowDuration(valueMins: number | null | undefined, dayLabel: string) {
  if (typeof valueMins !== "number" || !Number.isFinite(valueMins) || valueMins <= 0) {
    return null;
  }
  if (valueMins >= 60 * 24) {
    const days = Math.round(valueMins / (60 * 24));
    return `${days} ${dayLabel}`;
  }
  if (valueMins >= 60) {
    const hours = Math.round(valueMins / 60);
    return `${hours}h`;
  }
  return `${Math.round(valueMins)}m`;
}

function buildWindowCaption(
  resetLabel: string | null,
  windowDurationMins: number | null | undefined,
  fallback: string,
  dayLabel: string,
  windowLabel: string,
) {
  const duration = formatWindowDuration(windowDurationMins, dayLabel);
  const durationLabel = duration ? `${duration} ${windowLabel}` : null;
  const parts = [resetLabel, durationLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : fallback;
}

function formatCreditsBalance(value: string | null | undefined, locale?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return trimmed;
  }
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(numeric);
}

function formatDayCount(value: number | null | undefined, dayLabel: string) {
  if (value === null || value === undefined) {
    return "--";
  }
  return `${value} ${dayLabel}`;
}

function formatAccountTypeLabel(
  value: AccountSnapshot["type"] | null | undefined,
  labels: {
    chatgpt: string;
    apikey: string;
    connected: string;
  },
) {
  if (value === "chatgpt") {
    return labels.chatgpt;
  }
  if (value === "apikey") {
    return labels.apikey;
  }
  return labels.connected;
}

export function Home({
  onAddWorkspace,
  onAddWorkspaceFromUrl,
  latestAgentRuns,
  isLoadingLatestAgents,
  localUsageSnapshot,
  isLoadingLocalUsage,
  localUsageError,
  onRefreshLocalUsage,
  usageMetric,
  onUsageMetricChange,
  usageWorkspaceId,
  usageWorkspaceOptions,
  onUsageWorkspaceChange,
  accountRateLimits,
  usageShowRemaining,
  accountInfo,
  onSelectThread,
}: HomeProps) {
  const { t, i18n } = useTranslation();
  const [chartWeekOffset, setChartWeekOffset] = useState(0);
  const locale = i18n.resolvedLanguage || i18n.language || undefined;

  const usageTotals = localUsageSnapshot?.totals ?? null;
  const usageDays = localUsageSnapshot?.days ?? [];
  const latestUsageDay = usageDays[usageDays.length - 1] ?? null;
  const last7Days = usageDays.slice(-7);
  const last7Tokens = last7Days.reduce((total, day) => total + day.totalTokens, 0);
  const last7Input = last7Days.reduce((total, day) => total + day.inputTokens, 0);
  const last7Cached = last7Days.reduce(
    (total, day) => total + day.cachedInputTokens,
    0,
  );
  const last7AgentMs = last7Days.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const last30AgentMs = usageDays.reduce(
    (total, day) => total + (day.agentTimeMs ?? 0),
    0,
  );
  const averageDailyAgentMs =
    last7Days.length > 0 ? Math.round(last7AgentMs / last7Days.length) : 0;
  const last7AgentRuns = last7Days.reduce(
    (total, day) => total + (day.agentRuns ?? 0),
    0,
  );
  const last30AgentRuns = usageDays.reduce(
    (total, day) => total + (day.agentRuns ?? 0),
    0,
  );
  const averageTokensPerRun =
    last7AgentRuns > 0 ? Math.round(last7Tokens / last7AgentRuns) : null;
  const averageRunDurationMs =
    last7AgentRuns > 0 ? Math.round(last7AgentMs / last7AgentRuns) : null;
  const last7ActiveDays = last7Days.filter(isUsageDayActive).length;
  const last30ActiveDays = usageDays.filter(isUsageDayActive).length;
  const averageActiveDayAgentMs =
    last7ActiveDays > 0 ? Math.round(last7AgentMs / last7ActiveDays) : null;
  const peakAgentDay = usageDays.reduce<
    | { day: string; agentTimeMs: number }
    | null
  >((best, day) => {
    const value = day.agentTimeMs ?? 0;
    if (value <= 0) {
      return best;
    }
    if (!best || value > best.agentTimeMs) {
      return { day: day.day, agentTimeMs: value };
    }
    return best;
  }, null);
  const peakAgentDayLabel = peakAgentDay?.day ?? null;
  const peakAgentTimeMs = peakAgentDay?.agentTimeMs ?? 0;
  const maxHistoricalWeekOffset = Math.max(0, Math.ceil(usageDays.length / 7) - 1);
  useEffect(() => {
    setChartWeekOffset((previous) => Math.min(previous, maxHistoricalWeekOffset));
  }, [maxHistoricalWeekOffset]);
  const chartWeekEnd = Math.max(0, usageDays.length - chartWeekOffset * 7);
  const chartWeekStart = Math.max(0, chartWeekEnd - 7);
  const chartDays = usageDays.slice(chartWeekStart, chartWeekEnd);
  const maxUsageValue = Math.max(
    1,
    ...chartDays.map((day) =>
      usageMetric === "tokens" ? day.totalTokens : day.agentTimeMs ?? 0,
    ),
  );
  const canShowOlderWeek = chartWeekOffset < maxHistoricalWeekOffset;
  const canShowNewerWeek = chartWeekOffset > 0;
  const chartRangeLabel = formatWeekRange(
    chartDays,
    locale,
    (start, end) => t("home.weekRange", { start, end }),
    t("home.noUsageData"),
  );
  const chartRangeAriaLabel =
    chartDays.length > 0
      ? t("home.usageWeekAriaLabel", {
          start: chartDays[0]?.day,
          end: chartDays[chartDays.length - 1]?.day,
        })
      : t("home.usageWeekEmptyAriaLabel");
  let longestStreak = 0;
  let runningStreak = 0;
  for (const day of usageDays) {
    if (isUsageDayActive(day)) {
      runningStreak += 1;
      longestStreak = Math.max(longestStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
  }

  const longestStreakCard: HomeStatCard = {
    label: t("home.usageInsights.longestStreak"),
    value: longestStreak > 0 ? formatDayCount(longestStreak, t("home.units.days")) : "--",
    caption:
      longestStreak > 0
        ? t("home.usageInsights.longestStreakCaption")
        : t("home.usageInsights.noActiveStreakYet"),
    compact: true,
  };
  const activeDaysCard: HomeStatCard = {
    label: t("home.usageInsights.activeDays"),
    value: last7Days.length > 0 ? `${last7ActiveDays} / ${last7Days.length}` : "--",
    caption:
      usageDays.length > 0
        ? t("home.usageInsights.activeDaysCaption", {
            activeDays: last30ActiveDays,
            totalDays: usageDays.length,
          })
        : t("home.usageInsights.noActivityYet"),
    compact: true,
  };
  const usageCards: HomeStatCard[] =
    usageMetric === "tokens"
      ? [
          {
            label: t("home.usageCards.today"),
            value: formatCompactNumber(latestUsageDay?.totalTokens ?? 0, locale),
            suffix: t("home.units.tokens"),
            caption: latestUsageDay
              ? t("home.usageCards.todayCaption", {
                  day: formatDayLabel(latestUsageDay.day, locale),
                  input: formatCount(latestUsageDay.inputTokens, locale),
                  output: formatCount(latestUsageDay.outputTokens, locale),
                })
              : t("home.usageCards.latestAvailableDay"),
          },
          {
            label: t("home.usageCards.last7Days"),
            value: formatCompactNumber(usageTotals?.last7DaysTokens ?? last7Tokens, locale),
            suffix: t("home.units.tokens"),
            caption: t("home.usageCards.averagePerDayCaption", {
              value: formatCompactNumber(usageTotals?.averageDailyTokens, locale),
            }),
          },
          {
            label: t("home.usageCards.last30Days"),
            value: formatCompactNumber(usageTotals?.last30DaysTokens ?? last7Tokens, locale),
            suffix: t("home.units.tokens"),
            caption: t("home.usageCards.totalCaption", {
              value: formatCount(usageTotals?.last30DaysTokens ?? last7Tokens, locale),
            }),
          },
          {
            label: t("home.usageCards.cacheHitRate"),
            value: usageTotals
              ? `${usageTotals.cacheHitRatePercent.toFixed(1)}%`
              : "--",
            caption: t("home.usageCards.last7DaysCaption"),
          },
          {
            label: t("home.usageCards.cachedTokens"),
            value: formatCompactNumber(last7Cached, locale),
            suffix: t("home.units.saved"),
            caption:
              last7Input > 0
                ? t("home.usageCards.cachedTokensCaption", {
                    percent: ((last7Cached / last7Input) * 100).toFixed(1),
                  })
                : t("home.usageCards.last7DaysCaption"),
          },
          {
            label: t("home.usageCards.averagePerRun"),
            value:
              averageTokensPerRun === null
                ? "--"
                : formatCompactNumber(averageTokensPerRun, locale),
            suffix: t("home.units.tokens"),
            caption:
              last7AgentRuns > 0
                ? t("home.usageCards.runsInLast7DaysCaption", {
                    count: last7AgentRuns,
                  })
                : t("home.usageCards.noRunsYet"),
          },
          {
            label: t("home.usageCards.peakDay"),
            value: formatDayLabel(usageTotals?.peakDay, locale),
            caption: t("home.usageCards.peakDayTokensCaption", {
              value: formatCompactNumber(usageTotals?.peakDayTokens, locale),
            }),
          },
        ]
      : [
          {
            label: t("home.usageCards.last7Days"),
            value: formatDurationCompact(last7AgentMs),
            suffix: t("home.units.agentTime"),
            caption: t("home.usageCards.averageDurationPerDayCaption", {
              value: formatDurationCompact(averageDailyAgentMs),
            }),
          },
          {
            label: t("home.usageCards.last30Days"),
            value: formatDurationCompact(last30AgentMs),
            suffix: t("home.units.agentTime"),
            caption: t("home.usageCards.totalDurationCaption", {
              value: formatDuration(last30AgentMs),
            }),
          },
          {
            label: t("home.usageCards.runs"),
            value: formatCount(last7AgentRuns, locale),
            suffix: t("home.units.runs"),
            caption: t("home.usageCards.last30DaysRunsCaption", {
              count: last30AgentRuns,
            }),
          },
          {
            label: t("home.usageCards.averagePerRun"),
            value: formatDurationCompact(averageRunDurationMs),
            caption:
              last7AgentRuns > 0
                ? t("home.usageCards.acrossRunsCaption", {
                    count: last7AgentRuns,
                  })
                : t("home.usageCards.noRunsYet"),
          },
          {
            label: t("home.usageCards.averagePerActiveDay"),
            value: formatDurationCompact(averageActiveDayAgentMs),
            caption:
              last7ActiveDays > 0
                ? t("home.usageCards.activeDaysInLast7Caption", {
                    count: last7ActiveDays,
                  })
                : t("home.usageCards.noActiveDaysYet"),
          },
          {
            label: t("home.usageCards.peakDay"),
            value: formatDayLabel(peakAgentDayLabel, locale),
            caption: t("home.usageCards.peakDayAgentTimeCaption", {
              value: formatDurationCompact(peakAgentTimeMs),
            }),
          },
        ];
  const usageInsights = [longestStreakCard, activeDaysCard];
  const usagePercentLabels = getUsageLabels(accountRateLimits, usageShowRemaining);
  const planLabel = formatPlanType(accountRateLimits?.planType ?? accountInfo?.planType);
  const creditsBalance = formatCreditsBalance(accountRateLimits?.credits?.balance, locale);
  const accountCards: HomeStatCard[] = [];
  const accountTypeLabels = {
    chatgpt: t("home.account.chatgptAccount"),
    apikey: t("home.account.apiKey"),
    connected: t("home.account.connectedAccount"),
  };
  const sessionResetLabel =
    typeof accountRateLimits?.primary?.resetsAt === "number"
      ? t("home.account.resets", {
          time: formatRelativeTimeLabel(
            accountRateLimits.primary.resetsAt > 1_000_000_000_000
              ? accountRateLimits.primary.resetsAt
              : accountRateLimits.primary.resetsAt * 1000,
            locale,
          ),
        })
      : null;
  const weeklyResetLabel =
    typeof accountRateLimits?.secondary?.resetsAt === "number"
      ? t("home.account.resets", {
          time: formatRelativeTimeLabel(
            accountRateLimits.secondary.resetsAt > 1_000_000_000_000
              ? accountRateLimits.secondary.resetsAt
              : accountRateLimits.secondary.resetsAt * 1000,
            locale,
          ),
        })
      : null;

  if (usagePercentLabels.sessionPercent !== null) {
    accountCards.push({
      label: usageShowRemaining
        ? t("home.account.sessionLeft")
        : t("home.account.sessionUsage"),
      value: `${usagePercentLabels.sessionPercent}%`,
      caption: buildWindowCaption(
        sessionResetLabel,
        accountRateLimits?.primary?.windowDurationMins,
        t("home.account.currentWindow"),
        t("home.units.days"),
        t("home.account.window"),
      ),
    });
  }

  if (usagePercentLabels.showWeekly && usagePercentLabels.weeklyPercent !== null) {
    accountCards.push({
      label: usageShowRemaining
        ? t("home.account.weeklyLeft")
        : t("home.account.weeklyUsage"),
      value: `${usagePercentLabels.weeklyPercent}%`,
      caption: buildWindowCaption(
        weeklyResetLabel,
        accountRateLimits?.secondary?.windowDurationMins,
        t("home.account.longerWindow"),
        t("home.units.days"),
        t("home.account.window"),
      ),
    });
  }

  if (accountRateLimits?.credits?.hasCredits) {
    accountCards.push(
      accountRateLimits.credits.unlimited
        ? {
            label: t("home.account.credits"),
            value: t("home.account.unlimited"),
            caption: t("home.account.availableBalance"),
          }
        : {
            label: t("home.account.credits"),
            value: creditsBalance ?? "--",
            suffix: creditsBalance ? t("home.account.creditsSuffix") : null,
            caption: t("home.account.availableBalance"),
          },
    );
  }

  if (planLabel) {
    accountCards.push({
      label: t("home.account.plan"),
      value: planLabel,
      caption: formatAccountTypeLabel(accountInfo?.type, accountTypeLabels),
    });
  }

  const accountMeta = accountInfo?.email ?? null;
  const updatedLabel = localUsageSnapshot
    ? t("home.updated", {
        time: formatRelativeTimeLabel(localUsageSnapshot.updatedAt, locale),
      })
    : null;
  const showUsageSkeleton = isLoadingLocalUsage && !localUsageSnapshot;
  const showUsageEmpty = !isLoadingLocalUsage && !localUsageSnapshot;

  return (
    <div className="home">
      <div className="home-hero">
        <div className="home-title">{t("home.title")}</div>
        <div className="home-subtitle">{t("home.subtitle")}</div>
      </div>
      <div className="home-latest">
        <div className="home-latest-header">
          <div className="home-latest-label">{t("home.latestAgents")}</div>
        </div>
        {latestAgentRuns.length > 0 ? (
          <div className="home-latest-grid">
            {latestAgentRuns.map((run) => (
              <button
                className="home-latest-card home-latest-card-button"
                key={run.threadId}
                onClick={() => onSelectThread(run.workspaceId, run.threadId)}
                type="button"
              >
                <div className="home-latest-card-header">
                  <div className="home-latest-project">
                    <span className="home-latest-project-name">{run.projectName}</span>
                    {run.groupName && (
                      <span className="home-latest-group">{run.groupName}</span>
                    )}
                  </div>
                  <div className="home-latest-time">
                    {formatRelativeTimeLabel(run.timestamp, locale)}
                  </div>
                </div>
                <div className="home-latest-message">
                  {run.message.trim() || t("home.latestAgentFallbackMessage")}
                </div>
                {run.isProcessing && (
                  <div className="home-latest-status">{t("home.running")}</div>
                )}
              </button>
            ))}
          </div>
        ) : isLoadingLatestAgents ? (
          <div
            className="home-latest-grid home-latest-grid-loading"
            aria-label={t("home.loadingAgents")}
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <div className="home-latest-card home-latest-card-skeleton" key={index}>
                <div className="home-latest-card-header">
                  <span className="home-latest-skeleton home-latest-skeleton-title" />
                  <span className="home-latest-skeleton home-latest-skeleton-time" />
                </div>
                <span className="home-latest-skeleton home-latest-skeleton-line" />
                <span className="home-latest-skeleton home-latest-skeleton-line short" />
              </div>
            ))}
          </div>
        ) : (
          <div className="home-latest-empty">
            <div className="home-latest-empty-title">{t("home.noAgentActivityYet")}</div>
            <div className="home-latest-empty-subtitle">{t("home.noAgentActivitySubtitle")}</div>
          </div>
        )}
      </div>
      <div className="home-actions">
        <button
          className="home-button primary home-add-workspaces-button"
          onClick={onAddWorkspace}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            +
          </span>
          {t("home.addWorkspaces")}
        </button>
        <button
          className="home-button secondary home-add-workspace-from-url-button"
          onClick={onAddWorkspaceFromUrl}
          data-tauri-drag-region="false"
        >
          <span className="home-icon" aria-hidden>
            ⤓
          </span>
          {t("home.addWorkspaceFromUrl")}
        </button>
      </div>
      <div className="home-usage">
        <div className="home-section-header">
          <div className="home-section-title">{t("home.usageSnapshot")}</div>
          <div className="home-section-meta-row">
            {updatedLabel && <div className="home-section-meta">{updatedLabel}</div>}
            <button
              type="button"
              className={
                isLoadingLocalUsage
                  ? "home-usage-refresh is-loading"
                  : "home-usage-refresh"
              }
              onClick={onRefreshLocalUsage}
              disabled={isLoadingLocalUsage}
              aria-label={t("home.refreshUsage")}
              title={t("home.refreshUsage")}
            >
              <RefreshCw
                className={
                  isLoadingLocalUsage
                    ? "home-usage-refresh-icon spinning"
                    : "home-usage-refresh-icon"
                }
                aria-hidden
              />
            </button>
          </div>
        </div>
        <div className="home-usage-controls">
          <div className="home-usage-control-group">
            <span className="home-usage-control-label">{t("home.workspaceLabel")}</span>
            <div className="home-usage-select-wrap">
              <select
                className="home-usage-select"
                value={usageWorkspaceId ?? ""}
                onChange={(event) =>
                  onUsageWorkspaceChange(event.target.value || null)
                }
                disabled={usageWorkspaceOptions.length === 0}
              >
                <option value="">{t("home.allWorkspaces")}</option>
                {usageWorkspaceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="home-usage-control-group">
            <span className="home-usage-control-label">{t("home.viewLabel")}</span>
            <div className="home-usage-toggle" role="group" aria-label={t("home.usageView")}>
              <button
                type="button"
                className={
                  usageMetric === "tokens"
                    ? "home-usage-toggle-button is-active"
                    : "home-usage-toggle-button"
                }
                onClick={() => onUsageMetricChange("tokens")}
                aria-pressed={usageMetric === "tokens"}
              >
                {t("home.tokens")}
              </button>
              <button
                type="button"
                className={
                  usageMetric === "time"
                    ? "home-usage-toggle-button is-active"
                    : "home-usage-toggle-button"
                }
                onClick={() => onUsageMetricChange("time")}
                aria-pressed={usageMetric === "time"}
              >
                {t("home.time")}
              </button>
            </div>
          </div>
        </div>
        {showUsageSkeleton ? (
          <div className="home-usage-skeleton">
            <div className="home-usage-grid">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="home-usage-card" key={index}>
                  <span className="home-latest-skeleton home-usage-skeleton-label" />
                  <span className="home-latest-skeleton home-usage-skeleton-value" />
                </div>
              ))}
            </div>
            <div className="home-usage-chart-card">
              <span className="home-latest-skeleton home-usage-skeleton-chart" />
            </div>
          </div>
        ) : showUsageEmpty ? (
          <div className="home-usage-empty">
            <div className="home-usage-empty-title">{t("home.noUsageDataYet")}</div>
            <div className="home-usage-empty-subtitle">{t("home.noUsageDataSubtitle")}</div>
            {localUsageError && (
              <div className="home-usage-error">{localUsageError}</div>
            )}
          </div>
        ) : (
          <>
            <div className="home-usage-grid">
              {usageCards.map((card) => (
                <div className="home-usage-card" key={card.label}>
                  <div className="home-usage-label">{card.label}</div>
                  <div className="home-usage-value">
                    <span className="home-usage-number">{card.value}</span>
                    {card.suffix && <span className="home-usage-suffix">{card.suffix}</span>}
                  </div>
                  <div className="home-usage-caption">{card.caption}</div>
                </div>
              ))}
            </div>
            <div className="home-usage-chart-card">
              <div className="home-usage-chart-nav">
                <div
                  className="home-usage-chart-range"
                  aria-label={chartRangeAriaLabel}
                  aria-live="polite"
                >
                  {chartRangeLabel}
                </div>
                <div className="home-usage-chart-actions">
                  {canShowOlderWeek && (
                    <button
                      type="button"
                      className="home-usage-chart-button"
                      onClick={() => setChartWeekOffset((current) => current + 1)}
                      aria-label={t("home.showPreviousWeek")}
                      title={t("home.showPreviousWeek")}
                    >
                      <ChevronLeft aria-hidden />
                    </button>
                  )}
                  <button
                    type="button"
                    className="home-usage-chart-button"
                    onClick={() => setChartWeekOffset((current) => Math.max(0, current - 1))}
                    aria-label={t("home.showNextWeek")}
                    title={t("home.showNextWeek")}
                    disabled={!canShowNewerWeek}
                  >
                    <ChevronRight aria-hidden />
                  </button>
                </div>
              </div>
              <div className="home-usage-chart">
                {chartDays.map((day) => {
                  const value =
                    usageMetric === "tokens" ? day.totalTokens : day.agentTimeMs ?? 0;
                  const height = Math.max(
                    6,
                    Math.round((value / maxUsageValue) * 100),
                  );
                  const tooltip =
                    usageMetric === "tokens"
                      ? t("home.chartTooltip.tokens", {
                          day: formatDayLabel(day.day, locale),
                          value: formatCount(day.totalTokens, locale),
                        })
                      : t("home.chartTooltip.time", {
                          day: formatDayLabel(day.day, locale),
                          value: formatDuration(day.agentTimeMs ?? 0),
                        });
                  return (
                    <div
                      className="home-usage-bar"
                      key={day.day}
                      data-value={tooltip}
                    >
                      <span
                        className="home-usage-bar-fill"
                        style={{ height: `${height}%` }}
                      />
                      <span className="home-usage-bar-label">
                        {formatDayLabel(day.day, locale)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="home-usage-insights">
              {usageInsights.map((card) => (
                <div
                  className="home-usage-card is-compact"
                  key={card.label}
                >
                  <div className="home-usage-label">{card.label}</div>
                  <div className="home-usage-value">
                    <span className="home-usage-number">{card.value}</span>
                    {card.suffix && <span className="home-usage-suffix">{card.suffix}</span>}
                  </div>
                  <div className="home-usage-caption">{card.caption}</div>
                </div>
              ))}
            </div>
            <div className="home-usage-models">
              <div className="home-usage-models-label">
                {t("home.topModels")}
                {usageMetric === "time" && (
                  <span className="home-usage-models-hint">{t("home.tokens")}</span>
                )}
              </div>
              <div className="home-usage-models-list">
                {localUsageSnapshot?.topModels?.length ? (
                  localUsageSnapshot.topModels.map((model) => (
                    <span
                      className="home-usage-model-chip"
                      key={model.model}
                      title={t("home.topModelTitle", {
                        model: model.model,
                        tokens: formatCount(model.tokens, locale),
                      })}
                    >
                      {model.model}
                      <span className="home-usage-model-share">
                        {model.sharePercent.toFixed(1)}%
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="home-usage-model-empty">{t("home.noModelsYet")}</span>
                )}
              </div>
              {localUsageError && (
                <div className="home-usage-error">{localUsageError}</div>
              )}
            </div>
          </>
        )}
        {accountCards.length > 0 && (
          <div className="home-account">
            <div className="home-section-header">
              <div className="home-section-title">{t("home.accountLimits")}</div>
              {accountMeta && (
                <div className="home-section-meta-row">
                  <div className="home-section-meta">{accountMeta}</div>
                </div>
              )}
            </div>
            <div className="home-usage-grid home-account-grid">
              {accountCards.map((card) => (
                <div className="home-usage-card" key={card.label}>
                  <div className="home-usage-label">{card.label}</div>
                  <div className="home-usage-value">
                    <span className="home-usage-number">{card.value}</span>
                    {card.suffix && (
                      <span className="home-usage-suffix">{card.suffix}</span>
                    )}
                  </div>
                  <div className="home-usage-caption">{card.caption}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
