import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { Objects3dComponent } from './objects-3d/objects-3d.component';

@NgModule({
  declarations: [
    AppComponent,
    Objects3dComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
