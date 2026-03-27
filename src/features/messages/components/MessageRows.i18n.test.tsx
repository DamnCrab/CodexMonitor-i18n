/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DiffRow,
  ExploreRow,
  ReviewRow,
  UserInputRow,
  WorkingIndicator,
} from "./MessageRows";

describe("message rows i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("localizes message row status labels in Chinese", () => {
    render(
      <>
        <WorkingIndicator
          isThinking={false}
          lastDurationMs={4_000}
          hasItems
        />
        <WorkingIndicator
          isThinking={false}
          lastDurationMs={4_000}
          hasItems
          showPollingFetchStatus
          pollingIntervalMs={12_000}
        />
        <ReviewRow
          item={{ id: "review-1", kind: "review", state: "started", text: "" }}
        />
        <DiffRow item={{ id: "diff-1", kind: "diff", title: "src/App.tsx", diff: "", status: "modified" }} />
        <UserInputRow
          item={{ id: "user-input-1", kind: "userInput", status: "answered", questions: [] }}
          isExpanded={true}
          onToggle={vi.fn()}
        />
        <ExploreRow
          item={{
            id: "explore-1",
            kind: "explore",
            status: "exploring",
            entries: [{ kind: "search", label: "routes" }],
          }}
        />
      </>,
    );

    expect(
      screen.getByText(i18n.t("messages.doneIn", { duration: "0:04" })),
    ).toBeTruthy();
    expect(
      screen.getByText(i18n.t("messages.newMessageFetchIn", { count: 12 })),
    ).toBeTruthy();
    expect(screen.getByText(i18n.t("messages.review.started"))).toBeTruthy();
    expect(screen.getByText(i18n.t("messages.review.badge"))).toBeTruthy();
    expect(screen.getByText(i18n.t("messages.diffStatus.modified"))).toBeTruthy();
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent ===
          `${i18n.t("requestUserInput.title")}: ${i18n.t("requestUserInput.noAnswerProvided")}`,
      ),
    ).toBeTruthy();
    expect(screen.getByText(i18n.t("messages.explore.exploring"))).toBeTruthy();
  });
});
