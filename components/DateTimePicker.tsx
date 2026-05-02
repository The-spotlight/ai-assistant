'use client';

import { useState, useMemo } from 'react';
import { X, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function generateCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days: (number | null)[] = [];

  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
}

function isToday(year: number, month: number, day: number): boolean {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
}

function isPast(year: number, month: number, day: number, currentHour: number = 23, currentMinute: number = 59): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(year, month, day);
  checkDate.setHours(0, 0, 0, 0);
  
  if (checkDate < today) return true;
  if (checkDate > today) return false;
  
  const now = new Date();
  return currentHour < now.getHours() || (currentHour === now.getHours() && currentMinute <= now.getMinutes());
}

function DateTimePicker({ isOpen, onClose, onSelect, initialDate }: DateTimePickerProps) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date(now.getTime() + 60 * 60 * 1000));
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());

  const calendarDays = useMemo(() => generateCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];

  const handleDateSelect = (day: number) => {
    if (isPast(viewYear, viewMonth, day, selectedDate.getHours(), selectedDate.getMinutes())) return;
    const newDate = new Date(selectedDate);
    newDate.setFullYear(viewYear);
    newDate.setMonth(viewMonth);
    newDate.setDate(day);
    setSelectedDate(newDate);
  };

  const handleHourChange = (hour: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour);
    if (isPast(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), hour, newDate.getMinutes())) {
      newDate.setHours(now.getHours() + 1);
    }
    setSelectedDate(newDate);
  };

  const handleMinuteChange = (minute: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMinutes(minute);
    if (isPast(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), newDate.getHours(), minute)) {
      newDate.setMinutes(now.getMinutes() + 15);
    }
    setSelectedDate(newDate);
  };

  const handleConfirm = () => {
    if (!isPast(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedDate.getHours(), selectedDate.getMinutes())) {
      onSelect(selectedDate);
      onClose();
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-[#fafafa] px-4 py-3">
          <h3 className="text-base font-semibold text-[#171717]">选择发送时间</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#737373] opacity-70 transition-opacity hover:opacity-100 hover:bg-[#f5f5f5]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#737373] hover:bg-[#f5f5f5] transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-[#171717]">
              {viewYear}年 {MONTHS[viewMonth]}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#737373] hover:bg-[#f5f5f5] transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-xs font-medium text-[#a3a3a3]"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-8" />;
              }
              const isSelectedDate =
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth &&
                selectedDate.getDate() === day;
              const isTodayDate = isToday(viewYear, viewMonth, day);
              const isPastDate = isPast(viewYear, viewMonth, day, selectedDate.getHours(), selectedDate.getMinutes());

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isPastDate}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors",
                    isSelectedDate
                      ? "bg-[#171717] text-white font-medium"
                      : isTodayDate
                        ? "bg-[#fef3c7] text-[#92400e] font-medium"
                        : isPastDate
                          ? "text-[#e5e5e5] cursor-not-allowed"
                          : "text-[#525252] hover:bg-[#f5f5f5]"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-black/[0.06] px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-[#a3a3a3]" />
            <span className="text-xs font-medium text-[#737373]">选择时间</span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-[#a3a3a3] mb-1">小时</label>
              <select
                value={selectedDate.getHours()}
                onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              >
                {hourOptions.map((h) => {
                  const isDisabled = isPast(viewYear, viewMonth, selectedDate.getDate(), h, selectedDate.getMinutes());
                  return (
                    <option key={h} value={h} disabled={isDisabled}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-[#a3a3a3] mb-1">分钟</label>
              <select
                value={selectedDate.getMinutes()}
                onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
                className="w-full rounded-lg border border-black/[0.06] bg-white px-3 py-2 text-sm text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#171717]/20"
              >
                {minuteOptions.map((m) => {
                  const isDisabled = isPast(viewYear, viewMonth, selectedDate.getDate(), selectedDate.getHours(), m);
                  return (
                    <option key={m} value={m} disabled={isDisabled}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-black/[0.06] bg-[#fafafa] px-4 py-3">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPast(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedDate.getHours(), selectedDate.getMinutes())}
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DateTimePicker;
