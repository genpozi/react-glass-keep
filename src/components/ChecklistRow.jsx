import React from 'react';

export function ChecklistRow({
  item,
  onToggle,
  onChange,
  onRemove,
  readOnly,
  disableToggle = false,
  showRemove = false,
  size = "md", // "sm" | "md" | "lg"
}) {
  const boxSize =
    size === "lg"
      ? "h-7 w-7 md:h-6 md:w-6"
      : size === "sm"
        ? "h-4 w-4 md:h-3.5 md:w-3.5"
        : "h-5 w-5 md:h-4 md:w-4";

  const removeSize =
    size === "lg"
      ? "w-7 h-7 text-base md:w-6 md:h-6"
      : size === "sm"
        ? "w-5 h-5 text-xs md:w-4 md:h-4"
        : "w-6 h-6 text-sm md:w-5 md:h-5";

  const removeVisibility = showRemove
    ? "opacity-80 hover:opacity-100"
    : "opacity-0 group-hover:opacity-100";

  return (
    <div className="flex items-start gap-3 md:gap-2 group">
      <input
        type="checkbox"
        className={`mt-0.5 ${boxSize} cursor-pointer`}
        checked={!!item.done}
        onChange={(e) => {
          e.stopPropagation();
          onToggle?.(e.target.checked, e);
        }}
        onClick={(e) => e.stopPropagation()}
        disabled={!!disableToggle}
      />
      {readOnly ? (
        <span
          className={`text-sm ${item.done ? "line-through text-gray-500 dark:text-gray-400" : ""}`}
        >
          {item.text}
        </span>
      ) : (
        <input
          className={`flex-1 bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-[var(--border-light)] pb-0.5 ${item.done ? "line-through text-gray-500 dark:text-gray-400" : ""}`}
          value={item.text}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="List item"
        />
      )}

      {(showRemove || !readOnly) && (
        <button
          className={`${removeVisibility} transition-opacity text-gray-500 hover:text-red-600 rounded-full border border-[var(--border-light)] flex items-center justify-center ${removeSize}`}
          title="Remove item"
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
}
