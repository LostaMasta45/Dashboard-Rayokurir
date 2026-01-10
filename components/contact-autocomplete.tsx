"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getContacts, type Contact } from "@/lib/auth";
import { User, MapPin, Phone } from "lucide-react";

interface ContactAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    onSelect?: (contact: Contact) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
}

export function ContactAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = "Nama pengirim...",
    disabled = false,
    error,
    className = "",
}: ContactAutocompleteProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load contacts on mount
    useEffect(() => {
        const loadContacts = async () => {
            const data = await getContacts();
            setContacts(data);
        };
        loadContacts();
    }, []);

    // Filter contacts based on input
    useEffect(() => {
        if (!value.trim()) {
            setFilteredContacts([]);
            setIsOpen(false);
            return;
        }

        const query = value.toLowerCase();
        const matches = contacts
            .filter(
                (contact) =>
                    contact.name.toLowerCase().includes(query) ||
                    contact.whatsapp.includes(query)
            )
            .slice(0, 5); // Limit to 5 results

        setFilteredContacts(matches);
        setIsOpen(matches.length > 0);
        setHighlightedIndex(-1);
    }, [value, contacts]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (contact: Contact) => {
        onChange(contact.name);
        setIsOpen(false);
        if (onSelect) {
            onSelect(contact);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setHighlightedIndex((prev) =>
                    prev < filteredContacts.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredContacts[highlightedIndex]) {
                    handleSelect(filteredContacts[highlightedIndex]);
                }
                break;
            case "Escape":
                setIsOpen(false);
                break;
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => {
                    if (filteredContacts.length > 0) setIsOpen(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className={`${error ? "border-red-500" : ""} ${className}`}
                autoComplete="off"
            />

            {isOpen && filteredContacts.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
                    {filteredContacts.map((contact, index) => (
                        <div
                            key={contact.id}
                            onClick={() => handleSelect(contact)}
                            className={`px-3 py-2 cursor-pointer transition-colors ${index === highlightedIndex
                                    ? "bg-blue-50"
                                    : "hover:bg-gray-50"
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">
                                        {contact.name}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        {contact.whatsapp && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-3 w-3" />
                                                {contact.whatsapp}
                                            </span>
                                        )}
                                        {contact.address && (
                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="h-3 w-3" />
                                                {contact.address.slice(0, 30)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
