import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginMainTemplateComponent } from './login-main-template.component';

@Component({ selector: 'app-login-template-ictu', template: '', standalone: false })
class LoginTemplateIctuStubComponent {}

@Component({ selector: 'app-login-template-v4', template: '', standalone: false })
class LoginTemplateV4StubComponent {}

@Component({ selector: 'app-login-template-ictu-dttx', template: '', standalone: false })
class LoginTemplateIctuDttxStubComponent {}

@Component({ selector: 'app-login-template-nvhcm', template: '', standalone: false })
class LoginTemplateNvhcmStubComponent {}

@Component({ selector: 'app-login-template-vhhcm', template: '', standalone: false })
class LoginTemplateVhhcmStubComponent {}

@Component({ selector: 'app-login-template-hvu', template: '', standalone: false })
class LoginTemplateHvuStubComponent {}

describe('LoginMainTemplateComponent', () => {
  let component: LoginMainTemplateComponent;
  let fixture: ComponentFixture<LoginMainTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LoginMainTemplateComponent,
        LoginTemplateIctuStubComponent,
        LoginTemplateV4StubComponent,
        LoginTemplateIctuDttxStubComponent,
        LoginTemplateNvhcmStubComponent,
        LoginTemplateVhhcmStubComponent,
        LoginTemplateHvuStubComponent
      ],
      imports: [CommonModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginMainTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const templates = [
    ['ictu', 'app-login-template-ictu'],
    ['dttx', 'app-login-template-ictu'],
    ['dev', 'app-login-template-ictu'],
    ['tueba_dttx', 'app-login-template-v4'],
    ['dttx-ictu', 'app-login-template-ictu-dttx'],
    ['nvhcm', 'app-login-template-nvhcm'],
    ['vhhcm', 'app-login-template-vhhcm'],
    ['hvu', 'app-login-template-hvu']
  ];

  for (const [server, selector] of templates) {
    it(`renders only ${selector} for ${server}`, () => {
      component.key_server = server;
      fixture.detectChanges();

      const rendered = fixture.nativeElement.querySelectorAll(templates.map(([, tag]) => tag).join(','));
      expect(rendered.length).toBe(1);
      expect(rendered[0].tagName.toLowerCase()).toBe(selector);
    });
  }

  it('renders the default layout without child templates when division selection is disabled', () => {
    component.acceptDivi = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.login-main-grid')).toBeTruthy();
    expect(fixture.nativeElement.querySelector(templates.map(([, tag]) => tag).join(','))).toBeNull();
  });
});


