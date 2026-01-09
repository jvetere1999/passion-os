"use client";

/**
 * Planner Client Component
 * Calendar with events and scheduling
 *
 * Auto-refresh: 30s polling for multi-device sync + focus refetch (per SYNC.md)
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAutoRefresh } from "@/lib/hooks";
import styles from "./page.module.css";

// Types
type CalendarEventType = "meeting" | "appointment" | "workout" | "other";
type ViewMode = "month" | "week" | "day";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: CalendarEventType;
  start_time: Date;
  end_time: Date;
  all_day: boolean;
  location?: string;
  color?: string;
  xpReward?: number;
  coinReward?: number;
  completed?: boolean;
}

interface APICalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: CalendarEventType;
  start_time: string;
  end_time: string;
  all_day: number;
  location: string | null;
  color: string | null;
  xp_reward?: number;
  coin_reward?: number;
  completed?: number;
}

interface PlannerClientProps {
  initialEvents?: CalendarEvent[];
}

// Helper functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateForInput(date: Date): string {
  return date.toISOString().slice(0, 16);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function getEventTypeColor(type: CalendarEventType): string {
  switch (type) {
    case "meeting":
      return "#3b82f6"; // blue
    case "appointment":
      return "#f59e0b"; // amber
    case "workout":
      return "#10b981"; // green
    default:
      return "#8b5cf6"; // purple
  }
}

function apiEventToLocal(event: APICalendarEvent): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description || undefined,
    event_type: event.event_type,
    start_time: new Date(event.start_time),
    end_time: new Date(event.end_time),
    all_day: event.all_day === 1,
    location: event.location || undefined,
    color: event.color || getEventTypeColor(event.event_type),
    xpReward: event.xp_reward || 10,
    coinReward: event.coin_reward || 5,
    completed: event.completed === 1,
  };
}

function getEventTypeIcon(type: CalendarEventType): React.ReactNode {
  switch (type) {
    case "meeting":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "appointment":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "workout":
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6.5 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          <path d="M4 21v-7l-2-4 4-2 4 4-2 4" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export function PlannerClient({ initialEvents = [] }: PlannerClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filterType, setFilterType] = useState<CalendarEventType | "all">("all");
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/calendar");
      if (response.ok) {
        const data = await response.json() as { events?: APICalendarEvent[] };
        const localEvents = (data.events || []).map(apiEventToLocal);
        setEvents(localEvents);
      } else {
        console.error("[planner] Failed to fetch events:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("[planner] Failed to fetch events:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Auto-refresh: 30s polling for multi-device sync + focus refetch (per SYNC.md)
  // Pauses on page unload and when tab is hidden to reduce CPU usage
  // Soft refreshes on reload if stale
  useAutoRefresh({
    onRefresh: fetchEvents,
    refreshKey: "planner",
    stalenessMs: 30000, // 30 seconds per SYNC.md contract
    refreshOnMount: true,
    refetchOnFocus: true,
    refetchOnVisible: true,
    pollingIntervalMs: 30000, // Poll every 30s for multi-device sync
    enabled: !isLoading && !isSaving,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "meeting" as CalendarEventType,
    start_time: "",
    end_time: "",
    all_day: false,
    location: "",
    xpReward: 10,
    coinReward: 5,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Memoize today to avoid recalculating on every render
  const today = useMemo(() => new Date(), []);

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((event) => event.event_type === filterType);
  }, [events, filterType]);

  // Get events for a specific day
  const getEventsForDay = (day: number): CalendarEvent[] => {
    const date = new Date(year, month, day);
    return filteredEvents.filter((event) => isSameDay(event.start_time, date));
  };

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return filteredEvents
      .filter((event) => event.start_time >= now && event.start_time <= weekFromNow)
      .sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
  }, [filteredEvents]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Event handling
  const openAddModal = (date?: Date) => {
    const startDate = date || new Date();
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(10, 0, 0, 0);

    setFormData({
      title: "",
      description: "",
      event_type: "meeting",
      start_time: formatDateForInput(startDate),
      end_time: formatDateForInput(endDate),
      all_day: false,
      location: "",
      xpReward: 10,
      coinReward: 5,
    });
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setFormData({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      start_time: formatDateForInput(event.start_time),
      end_time: formatDateForInput(event.end_time),
      all_day: event.all_day,
      location: event.location || "",
      xpReward: event.xpReward || 10,
      coinReward: event.coinReward || 5,
    });
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        all_day: formData.all_day,
        location: formData.location || null,
        color: getEventTypeColor(formData.event_type),
      };

      if (editingEvent) {
        // Update existing event
        const response = await fetch("/api/calendar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingEvent.id, ...eventData }),
        });

        if (!response.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errorData: any = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update event: ${response.status}`);
        }

        const data = await response.json() as { event: APICalendarEvent };
        const updatedEvent = apiEventToLocal(data.event);
        setEvents(events.map((e) => (e.id === editingEvent.id ? updatedEvent : e)));
      } else {
        // Create new event
        const response = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const errorData: any = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create event: ${response.status}`);
        }

        const data = await response.json() as { event: APICalendarEvent };
        const newEvent = apiEventToLocal(data.event);
        setEvents([...events, newEvent]);
      }

      closeModal();
    } catch (error) {
      console.error("[planner] Failed to save event:", error);
      alert(`Failed to save event: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/calendar?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 404) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorData: any = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete event: ${response.status}`);
      }

      setEvents(events.filter((e) => e.id !== id));
      closeModal();
    } catch (error) {
      console.error("[planner] Failed to delete event:", error);
      alert(`Failed to delete event: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle event completion and award XP/coins
  const toggleEventComplete = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== eventId) return event;

        const wasCompleted = event.completed;
        const newCompleted = !wasCompleted;

        // Note: XP and coins are awarded server-side via activity events
        // when planner_task_complete event is logged

        return { ...event, completed: newCompleted };
      })
    );
  }, []);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; isCurrentMonth: boolean; isToday: boolean }> = [];

    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        isToday:
          i === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear(),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, today]);

  // Week view days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  // Hours for day/week view
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Planner</h1>
        <p className={styles.subtitle}>
          Schedule meetings, appointments, and workouts.
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.addButton} onClick={() => openAddModal()}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Event</span>
          </button>
          <button className={styles.todayButton} onClick={goToToday}>
            Today
          </button>
        </div>

        <div className={styles.filters}>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as CalendarEventType | "all")}
          >
            <option value="all">All Events</option>
            <option value="meeting">Meetings</option>
            <option value="appointment">Appointments</option>
            <option value="workout">Workouts</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={styles.viewButton}
              data-active={viewMode === "month"}
              onClick={() => setViewMode("month")}
            >
              Month
            </button>
            <button
              className={styles.viewButton}
              data-active={viewMode === "week"}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
            <button
              className={styles.viewButton}
              data-active={viewMode === "day"}
              onClick={() => setViewMode("day")}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <button className={styles.navButton} onClick={goToPreviousMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className={styles.monthTitle}>{monthName}</h2>
          <button className={styles.navButton} onClick={goToNextMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {viewMode === "month" && (
          <div className={styles.calendar}>
            <div className={styles.weekdays}>
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>
            <div className={styles.days}>
              {calendarDays.map((dayInfo, i) => {
                const dayEvents = dayInfo.isCurrentMonth
                  ? getEventsForDay(dayInfo.day)
                  : [];
                return (
                  <div
                    key={i}
                    className={`${styles.day} ${!dayInfo.isCurrentMonth ? styles.otherMonth : ""} ${dayInfo.isToday ? styles.today : ""} ${selectedDate && dayInfo.isCurrentMonth && selectedDate.getDate() === dayInfo.day ? styles.selected : ""}`}
                    onClick={() => {
                      if (dayInfo.isCurrentMonth) {
                        // Single click: switch to day view
                        const clickedDate = new Date(year, month, dayInfo.day);
                        setCurrentDate(clickedDate);
                        setSelectedDate(clickedDate);
                        setViewMode("day");
                      }
                    }}
                    onDoubleClick={() => {
                      if (dayInfo.isCurrentMonth) {
                        // Double click: open add event modal
                        openAddModal(new Date(year, month, dayInfo.day));
                      }
                    }}
                  >
                    <span className={styles.dayNumber}>{dayInfo.day}</span>
                    {dayEvents.length > 0 && (
                      <div className={styles.dayEvents}>
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={styles.dayEvent}
                            style={{ backgroundColor: event.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(event);
                            }}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className={styles.moreEvents}>
                            +{dayEvents.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === "week" && (
          <div className={styles.weekView}>
            <div className={styles.weekHeader}>
              <div className={styles.timeColumn}></div>
              {weekDays.map((date, i) => (
                <div
                  key={i}
                  className={`${styles.weekDay} ${isSameDay(date, today) ? styles.todayColumn : ""}`}
                  onClick={() => {
                    // Click on day header: switch to day view
                    setCurrentDate(date);
                    setSelectedDate(date);
                    setViewMode("day");
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <span className={styles.weekDayName}>
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                  <span className={styles.weekDayNumber}>{date.getDate()}</span>
                </div>
              ))}
            </div>
            <div className={styles.weekBody}>
              {hours.map((hour) => (
                <div key={hour} className={styles.hourRow}>
                  <div className={styles.timeColumn}>
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </div>
                  {weekDays.map((date, i) => {
                    const hourEvents = filteredEvents.filter(
                      (e) =>
                        isSameDay(e.start_time, date) &&
                        e.start_time.getHours() === hour
                    );
                    return (
                      <div
                        key={i}
                        className={styles.hourCell}
                        onClick={() => {
                          const newDate = new Date(date);
                          newDate.setHours(hour, 0, 0, 0);
                          openAddModal(newDate);
                        }}
                      >
                        {hourEvents.map((event) => (
                          <div
                            key={event.id}
                            className={styles.weekEvent}
                            style={{ backgroundColor: event.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(event);
                            }}
                          >
                            <span className={styles.eventTime}>
                              {formatTime(event.start_time)}
                            </span>
                            <span className={styles.eventTitle}>{event.title}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === "day" && (
          <div className={styles.dayView}>
            <div className={styles.dayViewHeader}>
              <h3 className={styles.dayViewTitle}>
                {currentDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
            </div>
            <div className={styles.dayViewBody}>
              {hours.map((hour) => {
                const hourEvents = filteredEvents.filter(
                  (e) =>
                    isSameDay(e.start_time, currentDate) &&
                    e.start_time.getHours() === hour
                );
                return (
                  <div key={hour} className={styles.dayHourRow}>
                    <div className={styles.dayTimeColumn}>
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </div>
                    <div
                      className={styles.dayHourCell}
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        newDate.setHours(hour, 0, 0, 0);
                        openAddModal(newDate);
                      }}
                    >
                      {hourEvents.map((event) => (
                        <div
                          key={event.id}
                          className={styles.dayEvent}
                          style={{ backgroundColor: event.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(event);
                          }}
                        >
                          <div className={styles.dayEventHeader}>
                            {getEventTypeIcon(event.event_type)}
                            <span className={styles.eventTime}>
                              {formatTime(event.start_time)} - {formatTime(event.end_time)}
                            </span>
                          </div>
                          <span className={styles.eventTitle}>{event.title}</span>
                          {event.location && (
                            <span className={styles.eventLocation}>{event.location}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={styles.upcomingSection}>
        <h3 className={styles.sectionTitle}>Upcoming Events</h3>
        {upcomingEvents.length > 0 ? (
          <div className={styles.eventsList}>
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={`${styles.eventCard} ${event.completed ? styles.completedEvent : ""}`}
              >
                <input
                  type="checkbox"
                  className={styles.eventCheckbox}
                  checked={event.completed || false}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleEventComplete(event.id);
                  }}
                  title="Mark as complete"
                />
                <div
                  className={styles.eventColorBar}
                  style={{ backgroundColor: event.color }}
                />
                <div className={styles.eventInfo} onClick={() => openEditModal(event)}>
                  <div className={styles.eventHeader}>
                    {getEventTypeIcon(event.event_type)}
                    <span className={styles.eventType}>{event.event_type}</span>
                    <span className={styles.eventRewards}>
                      <span className={styles.xpBadge}>+{event.xpReward || 10} XP</span>
                      <span className={styles.coinBadge}>+{event.coinReward || 5} *</span>
                    </span>
                  </div>
                  <h4 className={styles.eventCardTitle}>{event.title}</h4>
                  <p className={styles.eventCardTime}>
                    {event.start_time.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    at {formatTime(event.start_time)}
                  </p>
                  {event.location && (
                    <p className={styles.eventCardLocation}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {event.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h4 className={styles.emptyTitle}>No upcoming events</h4>
            <p className={styles.emptyText}>
              Add events to your calendar to stay organized.
            </p>
            <button className={styles.emptyAction} onClick={() => openAddModal()}>
              Add Event
            </button>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingEvent ? "Edit Event" : "Add Event"}
              </h3>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Type</label>
                <select
                  className={styles.formSelect}
                  value={formData.event_type}
                  onChange={(e) =>
                    setFormData({ ...formData, event_type: e.target.value as CalendarEventType })
                  }
                >
                  <option value="meeting">Meeting</option>
                  <option value="appointment">Appointment</option>
                  <option value="workout">Workout</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    checked={formData.all_day}
                    onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                  />
                  <span>All day event</span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Location (optional)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Add location"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description (optional)</label>
                <textarea
                  className={styles.formTextarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add description"
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>XP Reward</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={formData.xpReward}
                    onChange={(e) => setFormData({ ...formData, xpReward: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Coin Reward</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={formData.coinReward}
                    onChange={(e) => setFormData({ ...formData, coinReward: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                {editingEvent && (
                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={() => deleteEvent(editingEvent.id)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Deleting..." : "Delete"}
                  </button>
                )}
                <button type="button" className={styles.cancelButton} onClick={closeModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton} disabled={isSaving}>
                  {isSaving ? "Saving..." : editingEvent ? "Save Changes" : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

