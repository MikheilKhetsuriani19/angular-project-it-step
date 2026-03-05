import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Passenger {
  name: string;
  surname: string;
  idNumber: string;
}

interface Train {
  id: number;
  number: number;
  name: string;
  date: string;
  from: string;
  to: string;
  departure: string;
  arrive: string;
  departureId: number;
}

interface Ticket {
  id: string;
  trainID: number;
  ticketPrice: number;
  date: string;
  email: string;
  phone: string;
  persons: Passenger[];
}

@Component({
  selector: 'app-my-trips',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-trips.html',
  styleUrls: ['./my-trips.css']
})
export class MyTripsComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  trainDetails: Map<number, Train> = new Map();
  isLoading = true;
  
  // Filter properties
  filterType = 'all'; // 'all', 'id', 'passenger', 'email'
  filterValue = '';
  
  private apiUrl = 'https://railway.stepprojects.ge/api';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  private loadTickets(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/tickets`).subscribe({
      next: data => {
        if (Array.isArray(data)) {
          this.tickets = data;
        } else if (data && data.tickets) {
          this.tickets = data.tickets;
        }
        
        // Get unique train IDs and fetch their details
        const trainIds = [...new Set(this.tickets.map(t => t.trainID))];
        this.fetchTrainDetails(trainIds);
        
        this.filteredTickets = [...this.tickets];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load tickets', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private fetchTrainDetails(trainIds: number[]): void {
    if (trainIds.length === 0) return;

    // Fetch all trains and filter by the IDs we need
    this.http.get<Train[]>(`${this.apiUrl}/trains`).subscribe({
      next: trains => {
        trains.forEach(train => {
          if (trainIds.includes(train.id)) {
            this.trainDetails.set(train.id, train);
          }
        });
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load train details', err);
      }
    });
  }

  getTrainFrom(ticket: Ticket): string {
    const train = this.trainDetails.get(ticket.trainID);
    return train?.from || 'N/A';
  }

  getTrainTo(ticket: Ticket): string {
    const train = this.trainDetails.get(ticket.trainID);
    return train?.to || 'N/A';
  }

  getTrainDeparture(ticket: Ticket): string {
    const train = this.trainDetails.get(ticket.trainID);
    return train?.departure || 'N/A';
  }

  getTrainArrive(ticket: Ticket): string {
    const train = this.trainDetails.get(ticket.trainID);
    return train?.arrive || 'N/A';
  }

  getTrainName(ticket: Ticket): string {
    const train = this.trainDetails.get(ticket.trainID);
    return train?.name || `Train #${ticket.trainID}`;
  }

  getPlaceholder(): string {
    switch (this.filterType) {
      case 'id':
        return 'Enter ticket ID...';
      case 'passenger':
        return 'Enter passenger name...';
      case 'email':
        return 'Enter email address...';
      default:
        return 'Search tickets...';
    }
  }

  filterTickets(): void {
    const searchTerm = this.filterValue.toLowerCase().trim();
    
    if (!searchTerm || this.filterType === 'all') {
      this.filteredTickets = [...this.tickets];
      return;
    }

    this.filteredTickets = this.tickets.filter(ticket => {
      switch (this.filterType) {
        case 'id':
          return ticket.id?.toLowerCase().includes(searchTerm);
        case 'passenger':
          return ticket.persons?.some(p => 
            p.name?.toLowerCase().includes(searchTerm) || 
            p.surname?.toLowerCase().includes(searchTerm)
          );
        case 'email':
          return ticket.email?.toLowerCase().includes(searchTerm);
        default:
          return true;
      }
    });
  }

  clearFilter(): void {
    this.filterType = 'all';
    this.filterValue = '';
    this.filteredTickets = [...this.tickets];
  }

  deleteTicket(ticketId: string): void {
    if (!confirm('Are you sure you want to cancel this ticket?')) {
      return;
    }

    this.http.delete(`${this.apiUrl}/tickets/cancel/${ticketId}`, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Ticket cancelled:', response);
        alert('Ticket cancelled successfully');
        // Remove from local array
        this.tickets = this.tickets.filter(t => t.id !== ticketId);
        this.filterTickets();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to cancel ticket:', err);
        alert('Failed to cancel ticket. Please try again.');
      }
    });
  }
}
