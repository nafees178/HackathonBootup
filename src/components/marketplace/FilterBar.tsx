import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";

interface FilterBarProps {
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  currentCategory: string;
}

const categories = [
  "All",
  "Design",
  "Education",
  "Tech",
  "Writing",
  "Marketing",
  "Video/Photo",
  "Music/Audio",
  "Business",
  "Other",
];

export const FilterBar = ({ onSearchChange, onCategoryChange, currentCategory }: FilterBarProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests by title or description..."
            className="pl-10"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={currentCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
};