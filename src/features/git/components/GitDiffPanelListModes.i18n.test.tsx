/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GitPerFileModeContent } from "./GitDiffPanelListModes";

describe("GitDiffPanelListModes i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("localizes per-file edit statuses in Chinese", () => {
    render(
      <GitPerFileModeContent
        groups={[
          {
            path: "src/App.tsx",
            edits: [
              {
                id: "edit-1",
                path: "src/App.tsx",
                label: "src/App.tsx",
                status: "M",
                diff: "@@ -1 +1 @@",
                sourceItemId: "tool-1",
                additions: 2,
                deletions: 1,
              },
            ],
          },
        ]}
        selectedPath={null}
        onSelectFile={vi.fn()}
      />,
    );

    expect(screen.getByText("1 处编辑")).toBeTruthy();
    expect(screen.getByText("修改")).toBeTruthy();
  });
});
