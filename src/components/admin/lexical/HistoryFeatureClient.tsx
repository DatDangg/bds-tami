"use client";

import { createClientFeature, toolbarFeatureButtonsGroupWithItems } from "@payloadcms/richtext-lexical/client";
import type { LexicalEditor } from "@payloadcms/richtext-lexical/lexical";
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_LOW, REDO_COMMAND, UNDO_COMMAND } from "@payloadcms/richtext-lexical/lexical";
import { type ReactNode, useEffect, useState } from "react";

interface HistoryButtonProps {
  editor: LexicalEditor;
}

/** Nút trên thanh công cụ cố định: dùng chung lớp CSS của nút Payload để cùng kích thước/màu; có chữ cho trình đọc màn hình và tooltip. */
function HistoryButton({ editor, label, canUseCommand, command, children }: HistoryButtonProps & { label: string; canUseCommand: typeof CAN_UNDO_COMMAND; command: typeof UNDO_COMMAND; children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(
    () =>
      editor.registerCommand(
        canUseCommand,
        (payload: boolean) => {
          setEnabled(payload);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    [editor, canUseCommand],
  );
  return (
    <button
      type="button"
      className={`toolbar-popup__button${enabled ? "" : " disabled"}`}
      aria-label={label}
      title={label}
      disabled={!enabled}
      // Giữ vùng chọn trong ô soạn thảo khi bấm nút.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => editor.focus(() => editor.dispatchCommand(command, undefined))}
    >
      {children}
    </button>
  );
}

const arrowProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

function UndoButton({ editor }: HistoryButtonProps) {
  return (
    <HistoryButton editor={editor} label="Hoàn tác" canUseCommand={CAN_UNDO_COMMAND} command={UNDO_COMMAND}>
      <svg {...arrowProps}>
        <path d="M9 14 4 9l5-5" />
        <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
      </svg>
    </HistoryButton>
  );
}

function RedoButton({ editor }: HistoryButtonProps) {
  return (
    <HistoryButton editor={editor} label="Làm lại" canUseCommand={CAN_REDO_COMMAND} command={REDO_COMMAND}>
      <svg {...arrowProps}>
        <path d="m15 14 5-5-5-5" />
        <path d="M20 9H10a6 6 0 0 0 0 12h3" />
      </svg>
    </HistoryButton>
  );
}

/**
 * Nút Hoàn tác / Làm lại trên thanh công cụ cố định (BL-042). Lexical của Payload không có sẵn; `HistoryPlugin` đã được gắn vào mọi
 * ô soạn thảo nên chỉ cần gửi `UNDO_COMMAND` / `REDO_COMMAND`. Không thêm node, không đổi dữ liệu lưu.
 */
export const HistoryFeatureClient = createClientFeature({
  toolbarFixed: {
    // `order` nhỏ hơn mọi nhóm sẵn có (25 trở lên) → nằm đầu thanh công cụ.
    groups: [{ ...toolbarFeatureButtonsGroupWithItems([{ key: "undo", Component: UndoButton }, { key: "redo", Component: RedoButton }]), key: "history", order: 1 }],
  },
});
