"use client"

import * as React from "react"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface Location {
    id: string
    label: string
    lat: number
    lng: number
}

interface LocationComboboxProps {
    locations: Location[]
    value: Location | null
    onChange: (location: Location | null) => void
    placeholder?: string
    label?: string
    icon?: "pickup" | "dropoff"
    disabled?: boolean
}

export function LocationCombobox({
    locations,
    value,
    onChange,
    placeholder = "Pilih lokasi...",
    label,
    icon = "pickup",
    disabled = false
}: LocationComboboxProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <MapPin size={14} className={icon === "pickup" ? "text-teal-500" : "text-orange-500"} />
                    {label}
                </label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                    disabled={disabled}
                    className={cn(
                        "w-full h-12 flex items-center justify-between rounded-xl border-2 px-3 py-2 text-left text-sm font-normal",
                        "hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        !value && "text-muted-foreground",
                        icon === "pickup"
                            ? "border-teal-200 bg-teal-50/30"
                            : "border-orange-200 bg-orange-50/30"
                    )}
                >
                    <span className="truncate">
                        {value ? value.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                    sideOffset={4}
                >
                    <Command>
                        <CommandInput placeholder="Ketik nama desa..." className="h-10" />
                        <CommandList>
                            <CommandEmpty>Lokasi tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                                {locations.map((location) => (
                                    <CommandItem
                                        key={location.id}
                                        value={location.label}
                                        onSelect={() => {
                                            onChange(location.id === value?.id ? null : location)
                                            setOpen(false)
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value?.id === location.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <MapPin size={14} className="mr-2 text-gray-400" />
                                        {location.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}


