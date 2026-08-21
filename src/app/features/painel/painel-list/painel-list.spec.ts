import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PainelList } from './painel-list';

describe('PainelList', () => {
  let component: PainelList;
  let fixture: ComponentFixture<PainelList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PainelList],
    }).compileComponents();

    fixture = TestBed.createComponent(PainelList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
