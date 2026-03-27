/** @vitest-environment jsdom */
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import i18n from "i18next";

import { WorkspaceHomeHistory } from "./WorkspaceHomeHistory";

describe("WorkspaceHomeHistory", () => {
  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders translated empty states in zh", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh");
    });

    const { container } = render(
      <WorkspaceHomeHistory
        runs={[]}
        recentThreadInstances={[]}
        recentThreadsUpdatedAt={null}
        activeWorkspaceId={null}
        activeThreadId={null}
        threadStatusById={{}}
        onSelectInstance={() => {}}
      />,
    );

    expect(screen.getByText("最近运行")).toBeTruthy();
    expect(screen.getByText("开始一次运行后，这里会跟踪显示其实例。")).toBeTruthy();
    expect(screen.getByText("最近线程")).toBeTruthy();
    expect(screen.getByText("侧边栏中的线程会显示在这里。")).toBeTruthy();
  });

  it("renders translated run metadata and instance status", async () => {
    await act(async () => {
      await i18n.changeLanguage("zh");
    });

    const { container } = render(
      <WorkspaceHomeHistory
        runs={[
          {
            id: "run-1",
            workspaceId: "ws-1",
            title: "Run title",
            prompt: "Test",
            createdAt: Date.now(),
            mode: "local",
            instances: [
              {
                id: "instance-1",
                workspaceId: "ws-1",
                threadId: "thread-1",
                modelId: "gpt-5",
                modelLabel: "GPT-5",
                sequence: 1,
              },
            ],
            status: "failed",
            error: null,
            instanceErrors: [],
          },
        ]}
        recentThreadInstances={[]}
        recentThreadsUpdatedAt={null}
        activeWorkspaceId={null}
        activeThreadId={null}
        threadStatusById={{ "thread-1": { isProcessing: true } }}
        onSelectInstance={() => {}}
      />,
    );

    const meta = container.querySelector(".workspace-home-run-meta");
    expect(meta?.textContent?.replace(/\s+/g, " ").trim()).toBe(
      `${i18n.t("workspaceHome.localMode")} · 1 ${i18n.t("workspaceHome.instanceSingular")} · ${i18n.t("workspaceHome.failed")}`,
    );
    expect(screen.getByText("运行中")).toBeTruthy();
  });
});
