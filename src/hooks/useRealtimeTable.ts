import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeTableOptions {
    table: string;
    events?: RealtimeEvent[];
    debounceMs?: number;
    onRefresh: () => void;
}

export function useRealtimeTable({
    table,
    events = ['INSERT', 'UPDATE', 'DELETE'],
    debounceMs = 1500,
    onRefresh,
}: UseRealtimeTableOptions) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onRefreshRef = useRef(onRefresh);

    useEffect(() => {
        onRefreshRef.current = onRefresh;
    });

    useEffect(() => {
        const channelName = `realtime_${table}_${Math.random().toString(36).slice(2)}`;
        let channel = supabase.channel(channelName);

        for (const event of events) {
            channel = channel.on(
                'postgres_changes' as any,
                { event, schema: 'public', table },
                () => {
                    if (timerRef.current) clearTimeout(timerRef.current);
                    timerRef.current = setTimeout(() => {
                        onRefreshRef.current();
                    }, debounceMs);
                }
            );
        }

        channel.subscribe();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            supabase.removeChannel(channel);
        };
    }, [table, debounceMs]);
}