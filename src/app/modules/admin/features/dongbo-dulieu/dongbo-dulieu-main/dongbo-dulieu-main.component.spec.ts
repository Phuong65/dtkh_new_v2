import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DongboDulieuMainComponent } from './dongbo-dulieu-main.component';

describe('DongboDulieuMainComponent', () => {
  let component: DongboDulieuMainComponent;
  let fixture: ComponentFixture<DongboDulieuMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ DongboDulieuMainComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DongboDulieuMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

<<<<<<< HEAD
import { ComponentFixture, TestBed } from '@angular/core/testing';
=======
﻿import { ComponentFixture, TestBed } from '@angular/core/testing';
>>>>>>> parent of 4e11996 (a)

import { DongboDulieuMainComponent } from './dongbo-dulieu-main.component';

describe('DongboDulieuMainComponent', () => {
  let component: DongboDulieuMainComponent;
  let fixture: ComponentFixture<DongboDulieuMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
<<<<<<< HEAD
      declarations: [ DongboDulieuMainComponent ]
=======
      imports: [ DongboDulieuMainComponent ]
>>>>>>> parent of 4e11996 (a)
    })
    .compileComponents();

    fixture = TestBed.createComponent(DongboDulieuMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
<<<<<<< HEAD
=======

>>>>>>> parent of 4e11996 (a)
