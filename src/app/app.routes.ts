import { Routes } from '@angular/router';
import { BookingComponent } from './components/booking/booking';
import { TrainDetailsComponent } from './components/details/details';
import { BookingConfirmationComponent } from './components/booking-confirmation/booking-confirmation';
import { PaymentComponent } from './components/payment/payment';
import { MyTripsComponent } from './components/my-trips/my-trips';
import { Main } from './components/main/main';

export const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: 'main', component: Main },
  { path: 'booking', component: BookingComponent },
  { path: 'booking-confirmation', component: BookingConfirmationComponent },
  { path: 'payment', component: PaymentComponent },
  { path: 'my-trips', component: MyTripsComponent },
  { path: 'train/:id', component: TrainDetailsComponent },
  { path: '**', redirectTo: '/main' }

];