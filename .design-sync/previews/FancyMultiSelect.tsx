import { FancyMultiSelect } from "frontend";

export function Languages() {
  return (
    <div style={{ padding: 24, maxWidth: 380 }}>
      <FancyMultiSelect
        placeholder="Select languages"
        searchPlaceholder="Search languages..."
        options={[
          { id: 1, name: "English" },
          { id: 2, name: "Español" },
          { id: 3, name: "Français" },
          { id: 4, name: "Deutsch" },
          { id: 5, name: "Português" },
        ]}
        selectedIds={[1, 3]}
        onChange={() => {}}
      />
    </div>
  );
}
