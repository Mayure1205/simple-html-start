import * as React from "react"
import { addDays, format, startOfYear, endOfYear } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface DatePickerWithRangeProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}

// Generate years from 2009 to current year (dataset range)
const getAvailableYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = 2009; year <= currentYear; year++) {
        years.push(year)
    }
    return years.reverse() // Most recent first
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    const availableYears = getAvailableYears()
    
    // Get current year from date or default to current year
    const currentYear = date?.from?.getFullYear() || new Date().getFullYear()
    const selectedYear = currentYear.toString()
    
    const handleYearSelect = (year: string) => {
        if (!year) return
        
        const yearNum = parseInt(year)
        const yearStart = startOfYear(new Date(yearNum, 0, 1))
        const yearEnd = endOfYear(new Date(yearNum, 0, 1))
        
        setDate({
            from: yearStart,
            to: yearEnd
        })
    }
    
    return (
        <div className={cn("flex gap-2 items-center", className)}>
            {/* Year Selector */}
            <Select
                value={selectedYear || currentYear.toString()}
                onValueChange={handleYearSelect}
            >
                <SelectTrigger className="w-[120px] glass-card">
                    <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                            {year}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            
            {/* Date Range Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal glass-card hover:bg-white/10",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
