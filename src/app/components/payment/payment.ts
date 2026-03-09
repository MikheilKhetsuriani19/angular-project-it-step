import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface TicketData {
  trainId: number;
  date: string;
  email: string;
  phoneNumber: string;
  alreadyRegistered?: boolean;
  people: {
    seatId: string;
    name: string;
    surname: string;
    idNumber: string;
    status: string;
    payoutCompleted: boolean;
  }[];
}

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment.html',
  styleUrls: ['./payment.css']
})
export class PaymentComponent implements OnInit {
  paymentForm: FormGroup;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  
  private apiUrl = 'https://railway.stepprojects.ge/api';
  private pendingTicketData: TicketData | null = null;
  isProcessing = false;

  constructor() {
    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required]],
      cardName: ['', [Validators.required]],
      expiry: ['', [Validators.required]],
      cvv: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const storedData = sessionStorage.getItem('pendingTicketData');
    if (storedData) {
      try {
        this.pendingTicketData = JSON.parse(storedData);
        console.log('Found pending ticket data:', this.pendingTicketData);
      } catch (e) {
        console.error('Error parsing stored ticket data:', e);
      }
    }
    
    if (!this.pendingTicketData) {
      console.warn('No pending ticket data found. Using mock data for demo.');
    }
  }

  submit(): void {
    const formValues = this.paymentForm.value;
    const hasValues = formValues.cardNumber || formValues.cardName || formValues.expiry || formValues.cvv;
    
    if (!hasValues) {
      (window as any).Swal.fire({
        icon: 'warning',
        title: 'Missing Details',
        text: 'Please enter your card details',
        confirmButtonColor: '#667eea'
      });
      return;
    }

    this.isProcessing = true;

    // Check if tickets are already registered (skip re-registration)
    if (this.pendingTicketData && this.pendingTicketData.alreadyRegistered) {
      // Tickets already registered - just simulate payment success
      console.log('Tickets already registered, processing payment only...');
      this.processPaymentOnly();
      return;
    }

    // Tickets not yet registered - register them with payment
    if (this.pendingTicketData) {
      const updatedTicketData = {
        ...this.pendingTicketData,
        people: this.pendingTicketData.people.map(person => ({
          ...person,
          payoutCompleted: true
        }))
      };

      console.log('Submitting tickets with payment:', updatedTicketData);

      this.http.post(`${this.apiUrl}/tickets/register`, updatedTicketData, { responseType: 'text' }).subscribe({
        next: (response) => {
          console.log('Tickets registered with payment:', response);
          sessionStorage.removeItem('pendingTicketData');
          this.isProcessing = false;
          (window as any).Swal.fire({
            icon: 'success',
            title: 'Payment Successful!',
            text: 'Your tickets have been booked.',
            confirmButtonColor: '#667eea'
          }).then(() => {
            this.router.navigate(['/my-trips']);
          });
        },
        error: (err) => {
          console.error('Error registering tickets:', err);
          this.isProcessing = false;
          
          const errorMessage = err.error?.message || err.error || '';
          if (errorMessage.includes('already occupied')) {
            (window as any).Swal.fire({
              icon: 'error',
              title: 'Seats Already Booked',
              text: 'These seats are already booked. Please go back and select different seats.',
              confirmButtonColor: '#667eea'
            }).then(() => {
              this.router.navigate(['/booking']);
            });
          } else {
            sessionStorage.removeItem('pendingTicketData');
            (window as any).Swal.fire({
              icon: 'error',
              title: 'Payment Failed',
              text: 'Payment failed. Please try again or contact support.',
              confirmButtonColor: '#667eea'
            });
          }
        }
      });
    } else {
      this.processPaymentOnly();
    }
  }

  private processPaymentOnly(): void {
    // Simulate payment processing
    setTimeout(() => {
      this.isProcessing = false;
      sessionStorage.removeItem('pendingTicketData');
      (window as any).Swal.fire({
        icon: 'success',
        title: 'Payment Successful!',
        text: 'Your tickets have been booked.',
        confirmButtonColor: '#667eea'
      }).then(() => {
        this.router.navigate(['/my-trips']);
      });
    }, 1500);
  }
}
