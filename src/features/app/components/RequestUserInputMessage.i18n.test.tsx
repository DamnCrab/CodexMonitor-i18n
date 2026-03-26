/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import i18n from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestUserInputMessage } from "./RequestUserInputMessage";

describe("RequestUserInputMessage i18n", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("localizes the input request card in Chinese", () => {
    const onSubmit = vi.fn();

    render(
      <RequestUserInputMessage
        requests={[
          {
            workspace_id: "ws-1",
            request_id: 1,
            params: {
              thread_id: "thread-1",
              turn_id: "turn-1",
              item_id: "item-1",
              questions: [
                {
                  id: "q1",
                  header: "",
                  question: "选择部署方式",
                  options: [{ label: "蓝绿发布", description: "零停机" }],
                },
              ],
            },
          },
          {
            workspace_id: "ws-1",
            request_id: 2,
            params: {
              thread_id: "thread-1",
              turn_id: "turn-2",
              item_id: "item-2",
              questions: [],
            },
          },
        ]}
        activeThreadId="thread-1"
        activeWorkspaceId="ws-1"
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("group", { name: "请求用户输入" })).toBeTruthy();
    expect(screen.getByText("需要输入")).toBeTruthy();
    expect(screen.getByText("请求 1 / 2")).toBeTruthy();
    expect(screen.getByPlaceholderText("添加备注（可选）")).toBeTruthy();

    fireEvent.click(screen.getByText("蓝绿发布"));
    fireEvent.click(screen.getByRole("button", { name: "提交" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ request_id: 1 }),
      expect.objectContaining({
        answers: {
          q1: {
            answers: ["蓝绿发布"],
          },
        },
      }),
    );
  });
});
