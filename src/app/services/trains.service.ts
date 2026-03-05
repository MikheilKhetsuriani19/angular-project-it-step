import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Train, SearchCriteria } from '../models/train.model';

@Injectable({
  providedIn: 'root'
})
export class TrainService {
  private apiUrl = 'https://railway.stepprojects.ge/api/trains';
  
  private searchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);
  public searchCriteria$ = this.searchCriteriaSubject.asObservable();

  private selectedTrainSubject = new BehaviorSubject<Train | null>(null);
  public selectedTrain$ = this.selectedTrainSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all trains from API
  getAllTrains(): Observable<Train[]> {
    return this.http.get<Train[]>(this.apiUrl).pipe(
      tap(trains => console.log('All trains from API:', trains))
    );
  }

  // Search trains by criteria
  searchTrains(criteria: SearchCriteria): Observable<Train[]> {
    console.log('Search criteria:', criteria);
    this.searchCriteriaSubject.next(criteria);
    
    return this.getAllTrains().pipe(
      map(trains => {
        const filtered = trains.filter(train => {
          console.log('Checking train:', train);
          console.log('Match from?', train.from === criteria.from);
          console.log('Match to?', train.to === criteria.to);
          console.log('Match date?', train.date === criteria.date);
          
          return train.from === criteria.from &&
                 train.to === criteria.to &&
                 train.date === criteria.date;
        });
        
        console.log('Filtered trains:', filtered);
        return filtered;
      })
    );
  }

  // Get unique cities
  getCities(): Observable<string[]> {
    return this.getAllTrains().pipe(
      map(trains => {
        const cities = new Set<string>();
        trains.forEach(train => {
          cities.add(train.from);
          cities.add(train.to);
        });
        const cityArray = Array.from(cities).sort();
        console.log('Available cities:', cityArray);
        return cityArray;
      })
    );
  }

  // Get unique dates (days of week)
  getDates(): Observable<string[]> {
    return this.getAllTrains().pipe(
      map(trains => {
        const dates = new Set<string>();
        trains.forEach(train => dates.add(train.date));
        const dateArray = Array.from(dates);
        console.log('Available dates:', dateArray);
        return dateArray;
      })
    );
  }

  // Set selected train
  setSelectedTrain(train: Train): void {
    this.selectedTrainSubject.next(train);
  }

  // Get current search criteria
  getSearchCriteria(): SearchCriteria | null {
    return this.searchCriteriaSubject.value;
  }
}