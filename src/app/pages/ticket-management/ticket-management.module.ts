import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TicketManagementPageRoutingModule } from './ticket-management-routing.module';

import { TicketManagementPage } from './ticket-management.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TicketManagementPageRoutingModule
  ],
  declarations: [TicketManagementPage]
})
export class TicketManagementPageModule {}
