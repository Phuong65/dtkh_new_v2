import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TreeCustomComponent } from './tree-custom.component';

describe('TreeCustomComponent', () => {
  let component: TreeCustomComponent;
  let fixture: ComponentFixture<TreeCustomComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [TreeCustomComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TreeCustomComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
