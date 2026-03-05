export interface Vagon {
  id: number;
  trainId: number;
  trainNumber: number;
  name: string;
  seats: any;
}

export interface Train {
  id: number;
  number: number;
  name: string;
  date: string;
  from: string;
  to: string;
  departure: string;
  arrive: string;
  departureId: number;
  vagons: Vagon[];
}

export interface SearchCriteria {
  from: string;
  to: string;
  date: string;  // This will now store the Georgian day name
  selectedDate?: Date;  // Optional: store the actual date selected
  ticketCount: number;
}

// Helper function to convert date to Georgian day name
export function getGeorgianDayName(date: Date): string {
  const days = [
    'კვირა',      // Sunday
    'ორშაბათი',   // Monday
    'სამშაბათი',  // Tuesday
    'ოთხშაბათი',  // Wednesday
    'ხუთშაბათი',  // Thursday
    'პარასკევი',  // Friday
    'შაბათი'      // Saturday
  ];
  return days[date.getDay()];
}