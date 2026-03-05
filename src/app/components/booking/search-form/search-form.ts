import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TrainService } from '../../../services/trains.service';
import { getGeorgianDayName } from '../../../models/train.model';

@Component({
  selector: 'app-search-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-form.html',
  styleUrls: ['./search-form.css']
})
export class SearchFormComponent implements OnInit {
  searchForm!: FormGroup;
  cities: string[] = [];
  
  ticketCounts = [1, 2, 3, 4, 5, 6, 7, 8];
  minDate: string;
  
  @Output() searchSubmitted = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    private trainService: TrainService
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
  }

  initForm(): void {
    this.searchForm = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      selectedDate: ['', Validators.required],  // Changed from 'date' to 'selectedDate'
      ticketCount: [1, [Validators.required, Validators.min(1)]]
    });
  }

  loadDropdownData(): void {
    this.trainService.getCities().subscribe(cities => {
      this.cities = cities;
    });
  }

  swapCities(): void {
    const from = this.searchForm.get('from')?.value;
    const to = this.searchForm.get('to')?.value;
    
    this.searchForm.patchValue({
      from: to,
      to: from
    });
  }

  onSubmit(): void {
    if (this.searchForm.valid) {
      const formValue = this.searchForm.value;
      
      // Convert the selected date to a Georgian day name
      const selectedDate = new Date(formValue.selectedDate);
      const georgianDay = getGeorgianDayName(selectedDate);
      
      // Create the search criteria with the Georgian day
      const searchCriteria = {
        from: formValue.from,
        to: formValue.to,
        date: georgianDay,  // This is what the API expects
        selectedDate: selectedDate,  // Keep the original date for reference
        ticketCount: formValue.ticketCount
      };
      
      console.log('Selected date:', selectedDate);
      console.log('Georgian day:', georgianDay);
      console.log('Search criteria:', searchCriteria);
      
      this.searchSubmitted.emit(searchCriteria);
    }
  }

  // Helper to show which day will be searched
  getPreviewDay(): string {
    const dateValue = this.searchForm.get('selectedDate')?.value;
    if (dateValue) {
      const date = new Date(dateValue);
      return getGeorgianDayName(date);
    }
    return '';
  }
}