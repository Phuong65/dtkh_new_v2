import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TheodoiTiendoComponent } from './theodoi-tiendo.component';

describe('TheodoiTiendoComponent', () => {
  let component: TheodoiTiendoComponent;
  let fixture: ComponentFixture<TheodoiTiendoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TheodoiTiendoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TheodoiTiendoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

