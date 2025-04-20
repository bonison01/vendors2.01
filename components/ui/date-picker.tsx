import React, { useState, useEffect, useMemo } from "react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerProps {
  startYear?: number;
  endYear?: number;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
}

const DatePicker: React.FC<DatePickerProps> = ({
  startYear,
  endYear,
  selected,
  onChange,
  minDate,
}) => {
  const currentYear = getYear(new Date());
  const minYear = startYear || currentYear - 50;
  const maxYear = endYear || currentYear + 50;

  const [date, setDate] = useState<Date | null>(selected);
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (selected !== date) {
      setDate(selected);
    }
  }, [selected]);

  const months = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );

  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i),
    [minYear, maxYear]
  );

  const handleDateChange = (newDate: Date | undefined, closePopover = true) => {
    if (newDate && minDate && newDate < minDate) return;

    setDate(newDate || null);
    onChange(newDate || null);
    if (closePopover) setOpen(false);
  };

  // Enhanced event stopper to prevent propagation for clicks, focus, and other events
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation(); // Stops further propagation to parent components
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-transparent",
            !date && "text-muted-foreground"
          )}
          onClick={() => setOpen(!open)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMM dd yyyy") : "Select a date"}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        onClick={stopPropagation}
        onFocus={stopPropagation}
        onMouseDown={stopPropagation} // Prevent mousedown events from closing parent
        onKeyDown={stopPropagation} // Prevent keyboard events from closing parent
      >
        <div className="flex justify-between p-2">
          <div>
            <Select
              onValueChange={(month) =>
                handleDateChange(
                  setMonth(date || new Date(), months.indexOf(month)),
                  false
                )
              }
            >
              <SelectTrigger
                className="w-[110px]"
                onClick={stopPropagation}
                onFocus={stopPropagation}
                onMouseDown={stopPropagation}
              >
                <SelectValue
                  placeholder={date ? months[getMonth(date)] : "Month"}
                />
              </SelectTrigger>
              <SelectContent onClick={stopPropagation} onFocus={stopPropagation}>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              onValueChange={(year) =>
                handleDateChange(
                  setYear(date || new Date(), parseInt(year)),
                  false
                )
              }
            >
              <SelectTrigger
                className="w-[110px]"
                onClick={stopPropagation}
                onFocus={stopPropagation}
                onMouseDown={stopPropagation}
              >
                <SelectValue
                  placeholder={date ? getYear(date).toString() : "Year"}
                />
              </SelectTrigger>
              <SelectContent onClick={stopPropagation} onFocus={stopPropagation}>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Calendar
          mode="single"
          selected={date ?? undefined}
          onSelect={(selectedDate) => handleDateChange(selectedDate)}
          initialFocus
          month={date || new Date()}
          onMonthChange={(newMonth) => setDate(newMonth)}
          disabled={(day) => !!minDate && day < minDate}
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;