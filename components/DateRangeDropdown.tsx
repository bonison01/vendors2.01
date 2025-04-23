import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, startOfWeek, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { CardTitle } from "./ui/card";

interface DateRangeDropdownProps {
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

const DateRangeDropdown: React.FC<DateRangeDropdownProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("thisMonth");
  const [customStart, setCustomStart] = useState<Date | null>(
    new Date(startDate)
  );
  const [customEnd, setCustomEnd] = useState<Date | null>(new Date(endDate));
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Stop event propagation
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  // Handle predefined range selection
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    setIsCustom(false);
    setIsOpen(false);

    let newStartDate: string;
    let newEndDate: string = format(addDays(new Date(), 1), "yyyy-MM-dd");

    switch (value) {
      case "today":
        newStartDate = format(new Date(), "yyyy-MM-dd");
        break;
      case "thisWeek":
        newStartDate = format(
          startOfWeek(new Date(), { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
        break;
      case "thisMonth":
        newStartDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
        break;
      default:
        return;
    }

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setCustomStart(new Date(newStartDate));
    setCustomEnd(new Date(newEndDate));
  };

  // Apply custom date range
  const applyCustomDate = () => {
    if (customStart && customEnd) {
      setStartDate(format(customStart, "yyyy-MM-dd"));
      setEndDate(format(customEnd, "yyyy-MM-dd"));
      setSelectedPeriod("");
      setIsCustom(true);
      setIsOpen(false);
    }
  };

  // Button label for display
  const getButtonLabel = (): string => {
    if (isCustom && customStart && customEnd) {
      return `${format(customStart, "MMM dd, yyyy")} - ${format(
        customEnd,
        "MMM dd, yyyy"
      )}`;
    }
    switch (selectedPeriod) {
      case "today":
        return "Today";
      case "thisWeek":
        return "This Week";
      case "thisMonth":
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
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        {getButtonLabel()}
      </Button>

      {/* Custom Dropdown */}
      {isOpen && (
        <div
          className="absolute z-50 mt-2 w-64 rounded-md bg-stone-950 shadow-lg border p-4 -translate-x-[60%]"
          onClick={stopPropagation}
        >
          {/* Predefined Ranges */}
          <div>
            <CardTitle className="text-sm mb-2">Select Range</CardTitle>
            <RadioGroup
              value={selectedPeriod}
              onValueChange={handlePeriodChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="today" id="today" />
                <Label htmlFor="today">Today</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thisWeek" id="thisWeek" />
                <Label htmlFor="thisWeek">This Week</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="thisMonth" id="thisMonth" />
                <Label htmlFor="thisMonth">This Month</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Separator */}
          <Separator className="my-2" />

          {/* Custom Date Picker Section */}
          <div>
            <CardTitle className="text-sm">Custom Date</CardTitle>
            <div className="mt-2 space-y-3">
              <div onClick={stopPropagation}>
                <Label className="mb-1 text-gray-400">
                  Start Date
                </Label>
                <DatePicker
                  selected={customStart}
                  onChange={handleCustomStartChange}
                />
              </div>
              <div onClick={stopPropagation}>
                <Label className="mb-1 text-gray-400">
                  End Date
                </Label>
                <DatePicker
                  selected={customEnd}
                  onChange={handleCustomEndChange}
                  minDate={customStart ?? undefined}
                />
              </div>
              <Button
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                onClick={applyCustomDate}
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangeDropdown;