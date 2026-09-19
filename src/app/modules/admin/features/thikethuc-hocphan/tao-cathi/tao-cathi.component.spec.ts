import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaoCathiComponent } from './tao-cathi.component';

describe('TaoCathiComponent', () => {
  let component: TaoCathiComponent;
  let fixture: ComponentFixture<TaoCathiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ TaoCathiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaoCathiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
