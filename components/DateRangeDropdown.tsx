import React, { useState } from "react";
import { format, startOfMonth, startOfWeek, addDays } from "date-fns"; 
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DatePicker from "@/components/ui/date-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface DateRangeDropdownProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({ startDate, setStartDate, endDate, setEndDate }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("thisMonth");
  const [customStart, setCustomStart] = useState<Date | null>(new Date(startDate));
  const [customEnd, setCustomEnd] = useState<Date | null>(new Date(endDate));
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  // Handle predefined range selection
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setIsCustom(false);
    setOpen(false);

    let newStartDate: string;
    let newEndDate: string = format(addDays(new Date(), 1), "yyyy-MM-dd");

    switch (value) {
      case "today":
        newStartDate = format(new Date(), "yyyy-MM-dd");
        break;
      case "thisWeek":
        newStartDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "thisMonth": // Changed from thisYear to thisMonth
        newStartDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
        break;
      default:
        return;
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  const applyCustomDate = () => {
    if (customStart && customEnd) {
      setStartDate(format(customStart, "yyyy-MM-dd"));
      setEndDate(format(customEnd, "yyyy-MM-dd"));
      setSelectedPeriod("");
      setIsCustom(true);
      setOpen(false);
    }
  };

  const getButtonLabel = (): string => {
    if (isCustom && customStart && customEnd) {
      return `${format(customStart, "MMM dd, yyyy")} - ${format(customEnd, "MMM dd, yyyy")}`;
    }
    switch (selectedPeriod) {
      case "today":
        return "Today";
      case "thisWeek":
        return "This Week";
      case "thisMonth": // Changed from thisYear to thisMonth
        return "This Month";
      default:
        return "Select Date";
    }
  };

  // Handlers for DatePicker onChange
  const handleCustomStartChange = (date: Date | null) => {
    setCustomStart(date);
  };

  const handleCustomEndChange = (date: Date | null) => {
    setCustomEnd(date);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{getButtonLabel()}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 p-4">
        {/* Section: Quick Date Ranges */}
        <DropdownMenuLabel>Select Range</DropdownMenuLabel>
        <RadioGroup value={selectedPeriod} onValueChange={handlePeriodChange} className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="today" id="today" />
            <Label htmlFor="today">Today</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="thisWeek" id="thisWeek" />
            <Label htmlFor="thisWeek">This Week</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="thisMonth" id="thisMonth" /> {/* Changed from thisYear to thisMonth */}
            <Label htmlFor="thisMonth">This Month</Label>
          </div>
        </RadioGroup>

        <DropdownMenuSeparator className="my-3" />

        {/* Section: Custom Date Picker */}
        <DropdownMenuLabel>Custom Date</DropdownMenuLabel>
        <div className="flex flex-col gap-3 mt-2 z-10">
          <div>
            <Label className="text-sm font-medium">Start Date</Label>
            <DatePicker selected={customStart} onChange={handleCustomStartChange} />
          </div>
          <div>
            <Label className="text-sm font-medium">End Date</Label>
            <DatePicker selected={customEnd} onChange={handleCustomEndChange} minDate={customStart ?? undefined} />
          </div>
          <Button className="mt-2 w-full text-white" onClick={applyCustomDate}>
            Apply
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DateRangeDropdown;