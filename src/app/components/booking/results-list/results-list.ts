import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Train } from '../../../models/train.model';
import { TrainService } from '../../../services/trains.service';

@Component({
  selector: 'app-results-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './results-list.html',
  styleUrls: ['./results-list.css']
})
export class ResultsListComponent {
  @Input() trains: Train[] = [];
  @Input() ticketCount: number = 1;

  constructor(private trainService: TrainService, private router: Router) {}

  selectTrain(train: Train): void {
    this.trainService.setSelectedTrain(train);
    // Navigate to booking confirmation page
    this.router.navigate(['/booking-confirmation'], {
      queryParams: {
        trainId: train.id,
        ticketCount: this.ticketCount
      }
    });
  }
}