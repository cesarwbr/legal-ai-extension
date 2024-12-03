import { Finding } from "../services/types";
import FindingItem from "./finding-item";

export default function FindingCategories({
  findingsByCategory,
}: {
  findingsByCategory: Record<string, Finding[]>;
}) {
  return (
    <div>
      {Object.keys(findingsByCategory).map((category) => (
        <div key={category}>
          <h3 className="text-lg font-bold">{category}</h3>
          {findingsByCategory[category].map((finding) => (
            <FindingItem finding={finding} />
          ))}
        </div>
      ))}
    </div>
  );
}
