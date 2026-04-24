"use client";

interface Tab<T extends string> {
  key: T;
  label: React.ReactNode;
}

export default function ToolTabs<T extends string>({
  tabs,
  active,
  onChange,
  idPrefix,
}: {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
  idPrefix?: string;
}) {
  return (
    <div className="border-b border-black/[0.06] bg-white px-4 md:px-8 py-3">
      <div
        className="max-w-5xl mx-auto flex justify-center gap-1.5 overflow-x-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              id={idPrefix ? `${idPrefix}-${t.key}` : undefined}
              onClick={() => onChange(t.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
              }`}
              style={isActive ? { backgroundColor: "#C4634E" } : {}}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
