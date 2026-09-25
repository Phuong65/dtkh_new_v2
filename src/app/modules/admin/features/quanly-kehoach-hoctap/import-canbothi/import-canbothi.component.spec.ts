import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportCanbothiComponent } from './import-canbothi.component';

describe('ImportCanbothiComponent', () => {
  let component: ImportCanbothiComponent;
  let fixture: ComponentFixture<ImportCanbothiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImportCanbothiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportCanbothiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

