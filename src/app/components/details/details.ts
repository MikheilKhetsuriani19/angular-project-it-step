import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface TrainDetails {
  id: string;
  name: string;
  number: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  days: string[];
  classes: {
    type: string;
    available: number;
    price: number;
  }[];
  stations: {
    name: string;
    arrival: string;
    departure: string;
    platform: string;
    stop: number;
  }[];
  amenities: string[];
}

@Component({
  selector: 'app-train-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './details.html',
  styleUrl: './details.css'
})
export class TrainDetailsComponent implements OnInit {
  // Angular 21 inject() function for dependency injection
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Angular 21 signals for reactive state management
  train = signal<TrainDetails | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  
  trainId: string = '';

  // Replace with your actual API endpoint
  private apiUrl = 'https://railway.stepprojects.ge/api/trains';

  ngOnInit(): void {
    // Get train ID from route params
    this.trainId = this.route.snapshot.params['id'];
    this.loadTrainDetails();
  }

  loadTrainDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    // API call to get train details
    this.http.get<TrainDetails>(`${this.apiUrl}/${this.trainId}`).subscribe({
      next: (data) => {
        this.train.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading train details:', err);
        this.error.set('Failed to load train details. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  bookClass(classType: string, available: number, price: number): void {
    if (available === 0) return;
    
    // Navigate to booking page with train details
    this.router.navigate(['/booking'], {
      queryParams: {
        trainId: this.trainId,
        classType: classType,
        price: price
      }
    });
  }

  bookNow(): void {
    this.router.navigate(['/booking'], {
      queryParams: { trainId: this.trainId }
    });
  }

  isFirstStation(index: number): boolean {
    return index === 0;
  }

  isLastStation(index: number): boolean {
    const currentTrain = this.train();
    return currentTrain ? index === currentTrain.stations.length - 1 : false;
  }
}