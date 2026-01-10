"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/lib/auth";

type OrderChangeEvent = {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: Order | null;
    old: Order | null;
};

type OrderChangeCallback = (event: OrderChangeEvent) => void;

export function useRealtimeOrders(
    onOrderChange?: OrderChangeCallback,
    enabled: boolean = true
) {
    const callbackRef = useRef<OrderChangeCallback | undefined>(onOrderChange);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onOrderChange;
    }, [onOrderChange]);

    const subscribe = useCallback(() => {
        if (!enabled) return null;

        const channel = supabase
            .channel("orders-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "orders",
                },
                (payload) => {
                    const event: OrderChangeEvent = {
                        eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
                        new: payload.new as Order | null,
                        old: payload.old as Order | null,
                    };

                    if (callbackRef.current) {
                        callbackRef.current(event);
                    }
                }
            )
            .subscribe();

        return channel;
    }, [enabled]);

    useEffect(() => {
        const channel = subscribe();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [subscribe]);
}

// Hook for COD history realtime
export function useRealtimeCOD(
    onCODChange?: (event: { eventType: string; new: unknown; old: unknown }) => void,
    enabled: boolean = true
) {
    const callbackRef = useRef(onCODChange);

    useEffect(() => {
        callbackRef.current = onCODChange;
    }, [onCODChange]);

    useEffect(() => {
        if (!enabled) return;

        const channel = supabase
            .channel("cod-realtime")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "cod_history",
                },
                (payload) => {
                    if (callbackRef.current) {
                        callbackRef.current({
                            eventType: payload.eventType,
                            new: payload.new,
                            old: payload.old,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [enabled]);
}
