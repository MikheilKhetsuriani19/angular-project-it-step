import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TrainService } from '../../services/trains.service';
import { Train } from '../../models/train.model';

interface PassengerInfo {
  email?: string;
  phone?: string;
  name: string;
  surname: string;
  idNumber: string;
}

interface Seat {
  seatId: string;
  number: string;
  price: number;
  isOccupied: boolean;
  vagonId: number;
}

interface Vagon {
  id: number;
  trainId: number;
  trainNumber: number;
  name: string;
  seats: Seat[];
}

interface PeopleRegistration {
  seatId: string;
  name: string;
  surname: string;
  idNumber: string;
  status: string;
  payoutCompleted: boolean;
}

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking-confirmation.html',
  styleUrl: './booking-confirmation.css'
})
export class BookingConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private trainService = inject(TrainService);

  selectedTrain = signal<Train | null>(null);
  ticketCount = signal<number>(1);
  isLoadingVagons = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  vagons = signal<Vagon[]>([]);
  selectedVagon = signal<Vagon | null>(null);
  selectedSeats = signal<{ vagonId: number; seatNumber: string | number; seatId: string }[]>([]);

  generalInfoForm!: FormGroup;
  passengerForms: FormGroup[] = [];
  seatSelectionInProgress = signal<boolean>(false);

  currentStep = signal<'general' | 'passengers' | 'seats' | 'confirmation' | 'invoice'>('general');
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  invoiceTickets = signal<{
    name: string;
    surname: string;
    vagonId: number;
    seatNumber: string | number;
    price: number;
  }[]>([]);
  totalPrice = signal<number>(0);

  private apiUrl = 'https://railway.stepprojects.ge/api';

  ngOnInit(): void {
    this.initializeFormData();
    this.loadVagonsData();
  }

  private initializeFormData(): void {
    const trainId = this.route.snapshot.queryParams['trainId'];
    const ticketCountParam = parseInt(this.route.snapshot.queryParams['ticketCount'] || '1', 10);

    if (!trainId) {
      this.error.set('Train ID not found. Please select a train again.');
      setTimeout(() => this.router.navigate(['/booking']), 2000);
      return;
    }

    this.ticketCount.set(ticketCountParam);

    this.generalInfoForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]]
    });

    this.passengerForms = [];
    for (let i = 0; i < ticketCountParam; i++) {
      this.passengerForms.push(
        this.fb.group({
          name: ['', [Validators.required, Validators.minLength(2)]],
          surname: ['', [Validators.required, Validators.minLength(2)]],
          idNumber: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]]
        })
      );
    }

    this.trainService.selectedTrain$.subscribe(train => {
      if (train) {
        console.log('Selected train from service:', train);
        this.selectedTrain.set(train);
      }
    });
  }

  private loadVagonsData(): void {
    const trainId = this.route.snapshot.queryParams['trainId'];
    if (!trainId) {
      console.error('No train ID provided');
      return;
    }

    this.isLoadingVagons.set(true);
    console.log('Fetching vagons for train ID:', trainId);
    
    this.http.get<any>(`${this.apiUrl}/getvagon/${trainId}`).subscribe({
      next: (response) => {
        console.log('Vagons API response:', response);
        
        let vagonArray: Vagon[] = [];
        
        if (Array.isArray(response)) {
          vagonArray = response;
        } else if (response && response.vagons && Array.isArray(response.vagons)) {
          vagonArray = response.vagons;
        } else if (response && response.data && Array.isArray(response.data)) {
          vagonArray = response.data;
        }
        
        console.log('Processed vagons array:', vagonArray);
        this.vagons.set(vagonArray);
        this.isLoadingVagons.set(false);
      },
      error: (err) => {
        console.error('Error loading vagons:', err);
        this.error.set('Failed to load train seats. Please try again.');
        this.isLoadingVagons.set(false);
      }
    });
  }

  proceedToPassengers(): void {
    if (!this.generalInfoForm.valid) {
      this.error.set('Please fill in all general information fields correctly');
      return;
    }
    this.currentStep.set('passengers');
    this.error.set(null);
  }

  proceedToSeats(): void {
    if (!this.validateAllPassengers()) {
      this.error.set('Please fill in all passenger information correctly');
      return;
    }
    this.currentStep.set('seats');
    this.seatSelectionInProgress.set(true);
    this.error.set(null);
  }

  private validateAllPassengers(): boolean {
    return this.passengerForms.every(form => form.valid);
  }

  selectVagon(vagon: Vagon): void {
    this.selectedVagon.set(vagon);
  }

  selectSeat(vagon: Vagon, seatNumber: string | number): void {
    console.log('Attempting to select seat:', seatNumber, 'in vagon:', vagon.id);
    
    if (!vagon.seats || vagon.seats.length === 0) {
      this.error.set('This vagon has no seats');
      return;
    }
    
    const seat = vagon.seats.find(s => s.number === seatNumber);
    console.log('Found seat:', seat);
    
    if (!seat) {
      this.error.set(`Seat ${seatNumber} not found in vagon`);
      return;
    }
    
    if (seat.isOccupied) {
      this.error.set('This seat is already occupied');
      return;
    }

    const currentSeats = [...this.selectedSeats()];
    const existingIndex = currentSeats.findIndex(
      s => s.vagonId === vagon.id && s.seatNumber === seatNumber
    );

    if (existingIndex >= 0) {
      console.log('Removing seat:', seatNumber);
      currentSeats.splice(existingIndex, 1);
      this.error.set(null);
    } else if (currentSeats.length < this.ticketCount()) {
      console.log('Adding seat:', seatNumber);
      currentSeats.push({ vagonId: vagon.id, seatNumber, seatId: seat.seatId });
      this.error.set(null);
    } else {
      this.error.set(`You can only select ${this.ticketCount()} seat(s)`);
      return;
    }

    console.log('Updated selected seats:', currentSeats);
    this.selectedSeats.set(currentSeats);
  }

  isSeatSelected(vagonId: number, seatNumber: string | number): boolean {
    return this.selectedSeats().some(
      s => s.vagonId === vagonId && s.seatNumber === seatNumber
    );
  }

  getAvailableSeatsCount(vagon: Vagon): number {
    if (!vagon.seats) return 0;
    return vagon.seats.filter((s) => !s.isOccupied).length;
  }

  getGroupedSeats(seats: Seat[], itemsPerRow: number): Seat[][] {
    const grouped: Seat[][] = [];
    for (let i = 0; i < seats.length; i += itemsPerRow) {
      grouped.push(seats.slice(i, i + itemsPerRow));
    }
    return grouped;
  }

  getSeatTooltip(seat: any): string {
    if (seat.isOccupied) {
      return `Seat ${seat.number} - Occupied`;
    }
    return `Seat ${seat.number} - Available`;
  }

  proceedToConfirmation(): void {
    if (this.selectedSeats().length !== this.ticketCount()) {
      this.error.set(`Please select ${this.ticketCount()} seat(s)`);
      return;
    }
    this.currentStep.set('confirmation');
    this.error.set(null);
  }

  submitTickets(): void {
    if (!this.validateAllData()) {
      this.error.set('Please complete all required fields');
      return;
    }

    this.isSubmitting.set(true);
    const generalInfo = this.generalInfoForm.value;
    const trainId = parseInt(this.route.snapshot.queryParams['trainId'], 10);

    const seats = this.selectedSeats();
    const people: PeopleRegistration[] = seats.map((seatInfo, idx) => {
      const pass = this.passengerForms[idx].value;
      return {
        seatId: seatInfo.seatId,
        name: pass.name,
        surname: pass.surname,
        idNumber: pass.idNumber,
        status: 'pending',
        payoutCompleted: false
      };
    });

    const ticketPayload = {
      trainId,
      date: new Date().toISOString(),
      email: generalInfo.email,
      phoneNumber: generalInfo.phone,
      people
    };

    console.log('Submitting group payload:', ticketPayload);

    this.http.post(`${this.apiUrl}/tickets/register`, ticketPayload, { responseType: 'text' }).subscribe({
      next: (response: string) => {
        console.log('Group registration response (text):', response);
        this.success.set('Tickets registered successfully!');
        this.isSubmitting.set(false);

        const tickets: any[] = [];
        for (let j = 0; j < seats.length; j++) {
          const seatInfo = seats[j];
          const pass = this.passengerForms[j].value;
          const vagon = this.vagons().find(v => v.id === seatInfo.vagonId);
          const seatObj = vagon?.seats.find(s => s.seatId === seatInfo.seatId);
          tickets.push({
            name: pass.name,
            surname: pass.surname,
            vagonId: seatInfo.vagonId,
            seatNumber: seatInfo.seatNumber,
            price: seatObj?.price ?? 0
          });
        }
        this.invoiceTickets.set(tickets);
        const total = tickets.reduce((acc, t) => acc + t.price, 0);
        this.totalPrice.set(total);
        this.currentStep.set('invoice');
      },
      error: (err) => {
        console.error('Error registering tickets:', err);
        this.error.set('Failed to register tickets. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  private validateAllData(): boolean {
    return (
      this.generalInfoForm.valid &&
      this.validateAllPassengers() &&
      this.selectedSeats().length === this.ticketCount()
    );
  }

  payTickets(): void {
    // Store ticket data in sessionStorage for the payment component
    const generalInfo = this.generalInfoForm.value;
    const trainId = parseInt(this.route.snapshot.queryParams['trainId'], 10);
    const seats = this.selectedSeats();
    
    // Mark as already registered so payment component knows not to re-register
    const ticketData = {
      trainId,
      date: new Date().toISOString(),
      email: generalInfo.email,
      phoneNumber: generalInfo.phone,
      alreadyRegistered: true, // Flag to indicate tickets are already registered
      people: seats.map((seatInfo, idx) => {
        const pass = this.passengerForms[idx].value;
        return {
          seatId: seatInfo.seatId,
          name: pass.name,
          surname: pass.surname,
          idNumber: pass.idNumber,
          status: 'registered', // Changed from 'pending' to indicate already registered
          payoutCompleted: false
        };
      })
    };
    
    // Save to sessionStorage so payment component can access it
    sessionStorage.setItem('pendingTicketData', JSON.stringify(ticketData));
    console.log('Stored ticket data in sessionStorage:', ticketData);
    
    // route to payment form
    this.router.navigate(['/payment']);
  }

  goBack(): void {
    const currentStep = this.currentStep();
    if (currentStep === 'general') {
      this.router.navigate(['/booking']);
    } else if (currentStep === 'passengers') {
      this.currentStep.set('general');
    } else if (currentStep === 'seats') {
      this.currentStep.set('passengers');
    } else if (currentStep === 'confirmation') {
      this.currentStep.set('seats');
    } else if (currentStep === 'invoice') {
      this.currentStep.set('confirmation');
    }
    this.error.set(null);
  }
}
