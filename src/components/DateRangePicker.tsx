import { endOfYear, format, startOfYear } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

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
import { cn } from "@/lib/utils"

interface DatePickerWithRangeProps {
    className?: string
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    availableYears?: number[]
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
    availableYears = []
}: DatePickerWithRangeProps) {
    // If no years provided, default to current year
    const years = availableYears.length > 0 ? availableYears : [new Date().getFullYear()]
    
    // Get selected year from date, or default to "all"
    const selectedYear = date?.from ? date.from.getFullYear().toString() : "all"
    
    const handleYearSelect = (year: string) => {
        if (!year) return
        
        // If "All Data" is selected, clear the date filter
        if (year === "all") {
            setDate(undefined)
            return
        }
        
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
                value={selectedYear || "all"}
                onValueChange={handleYearSelect}
            >
                <SelectTrigger className="w-[120px] glass-card">
                    <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Data</SelectItem>
                    {years.map((year) => (
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
                            <span>All Data</span>
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
