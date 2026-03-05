import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Train, SearchCriteria } from '../../models/train.model';
import { TrainService } from '../../services/trains.service';
import { SearchFormComponent } from './search-form/search-form';
import { ResultsListComponent } from './results-list/results-list';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, SearchFormComponent, ResultsListComponent],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class BookingComponent {
  trains: Train[] = [];
  isLoading = false;
  hasSearched = false;
  currentTicketCount = 1;

  constructor(
    private trainService: TrainService,
    private cdr: ChangeDetectorRef  // ⭐ Add this
  ) {}

  onSearch(criteria: SearchCriteria): void {
    console.log('Search triggered with criteria:', criteria);
    this.isLoading = true;
    this.hasSearched = true;
    this.currentTicketCount = criteria.ticketCount;
    
    this.trainService.searchTrains(criteria).subscribe({
      next: (trains) => {
        console.log('Received trains:', trains);
        this.trains = trains;
        this.isLoading = false;
        this.cdr.detectChanges();  // ⭐ Force change detection
        console.log('Updated: isLoading =', this.isLoading, 'trains.length =', this.trains.length);
      },
      error: (error) => {
        console.error('Error fetching trains:', error);
        this.isLoading = false;
        this.cdr.detectChanges();  // ⭐ Force change detection
      }
    });
  }
}