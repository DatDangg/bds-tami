import { useId, type ComponentProps } from "react";
import { WarningCircle } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { OptionSelect } from "@/components/ui/option-select";
import { cn } from "@/lib/utils";

type Chrome = {
  name: string;
  label: string;
  required?: boolean;
  /** Gợi ý dưới ô (định dạng, giới hạn). KHÔNG dùng placeholder thay label. */
  helper?: string;
  /** Lỗi đã dịch theo ngôn ngữ đang xem; có giá trị => aria-invalid. */
  error?: string;
  /** Nhãn "bắt buộc" cho trình đọc màn hình (đi kèm dấu *). */
  requiredLabel?: string;
  className?: string;
};

type Reserved = Exclude<keyof Chrome, "name"> | "id" | "aria-invalid" | "aria-describedby";
type InputProps = Omit<ComponentProps<"input">, Reserved>;
type TextareaProps = Omit<ComponentProps<"textarea">, Reserved>;
type SelectProps = Pick<ComponentProps<"select">, "name" | "disabled" | "defaultValue" | "value"> & {
  placeholder?: string;
  onValueChange?: (value: string) => void;
};
type ControlProps =
  | ({ as?: "input" } & InputProps)
  | ({ as: "textarea" } & TextareaProps)
  | ({ as: "select"; options: { value: string; label: string }[] } & SelectProps)
  | ({ as: "file" } & Omit<InputProps, "type">);

export type FormFieldProps = Chrome & ControlProps;

type Shared = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-required"?: true;
};

// Cùng kích thước/viền với <Input> (cao 48px, viền 3:1) để các loại ô đồng nhất.
const controlBase =
  "w-full min-w-0 rounded-sm border border-input bg-surface font-sans text-body text-text transition-colors duration-(--duration-fast) focus-visible:border-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50 read-only:bg-surface-muted aria-invalid:border-error";
const fileClasses =
  "h-12 cursor-pointer py-2.5 pr-4 pl-2 file:mr-3 file:h-8 file:cursor-pointer file:rounded-sm file:border-0 file:bg-surface-muted file:px-3 file:font-sans file:text-small file:font-semibold file:text-text";

function withoutKind<T extends { as?: unknown }>(control: T): Omit<T, "as"> {
  const copy = { ...control };
  delete copy.as;
  return copy;
}

function Control({ control, shared }: { control: ControlProps; shared: Shared }) {
  if (control.as === "textarea") {
    const attrs = withoutKind(control);
    return <textarea rows={4} {...attrs} {...shared} className={cn(controlBase, "min-h-28 px-4 py-3")} />;
  }
  if (control.as === "select") {
    const { options, name, disabled, placeholder, onValueChange } = control;
    return (
      <OptionSelect
        id={shared.id}
        name={name}
        options={options}
        value={typeof control.value === "string" ? control.value : undefined}
        defaultValue={typeof control.defaultValue === "string" ? control.defaultValue : undefined}
        onValueChange={onValueChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={shared["aria-invalid"]}
        aria-describedby={shared["aria-describedby"]}
        aria-required={shared["aria-required"]}
      />
    );
  }
  if (control.as === "file") {
    const attrs = withoutKind(control);
    return <input {...attrs} {...shared} type="file" className={cn(controlBase, fileClasses)} />;
  }
  const attrs = withoutKind(control);
  return <Input {...attrs} {...shared} />;
}

/** Một ô form đầy đủ: label thật, `*` + chữ ẩn, helper và lỗi nối bằng aria-describedby, aria-invalid. */
export function FormField({ label, required, helper, error, requiredLabel, className, ...control }: FormFieldProps) {
  const reactId = useId();
  const id = `${reactId}-${control.name}`;
  const helperId = helper ? `${id}-helper` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const shared: Shared = {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [helperId, errorId].filter(Boolean).join(" ") || undefined,
    "aria-required": required ? true : undefined,
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-semibold text-text">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-error">
              *
            </span>
            {requiredLabel && <span className="sr-only"> ({requiredLabel})</span>}
          </>
        )}
      </label>
      <Control control={control as ControlProps} shared={shared} />
      {helper && (
        <p id={helperId} className="text-small text-text-muted">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-small text-error">
          <WarningCircle size={16} weight="fill" aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
