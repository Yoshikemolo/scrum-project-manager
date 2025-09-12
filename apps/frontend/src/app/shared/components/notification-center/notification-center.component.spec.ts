import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { signal } from '@angular/core';
import { NotificationCenterComponent } from './notification-center.component';

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;

  const mockNotifications = [
    {
      id: '1',
      title: 'Test Notification',
      message: 'Test message',
      type: 'info',
      timestamp: new Date(),
      read: false
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NotificationCenterComponent,
        NoopAnimationsModule,
        FormsModule,
        MatTabsModule,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        TranslateModule.forRoot()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
    component.notifications = signal(mockNotifications);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display notifications', () => {
    expect(component.filteredNotifications()).toEqual(mockNotifications);
  });

  it('should filter notifications by search', () => {
    component.searchQuery = 'Test';
    component.filterNotifications();
    expect(component.filteredNotifications().length).toBeGreaterThan(0);
  });

  it('should mark notification as read', () => {
    spyOn(component.markRead, 'emit');
    component.markAsRead(mockNotifications[0]);
    expect(component.markRead.emit).toHaveBeenCalledWith(mockNotifications[0]);
  });

  it('should delete notification', () => {
    spyOn(component.delete, 'emit');
    component.deleteNotification(mockNotifications[0]);
    expect(component.delete.emit).toHaveBeenCalledWith(mockNotifications[0]);
  });
});